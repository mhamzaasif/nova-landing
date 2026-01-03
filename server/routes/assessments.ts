import { Router, RequestHandler } from "express";
import { getPool } from "../db";
import type {
  Assessment,
  CreateAssessmentRequest,
  AnalyticsTrends,
  TrendData,
} from "@shared/api";

const router = Router();

// Get all assessments
export const getAssessments: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const [assessments] = await pool.query(`
      SELECT a.*, e.id as employee_id, e.name as employee_name, e.email, e.department,
             r.id as role_id, r.name as role_name, r.description as role_description
      FROM assessments a
      JOIN employees e ON a.employee_id = e.id
      JOIN roles r ON a.role_id = r.id
      ORDER BY a.date DESC
    `);

    // Fetch items for each assessment
    const assessmentsWithItems = [];
    for (const assessment of assessments as any[]) {
      const [items] = await pool.query(`
        SELECT ai.*, pl.level_name, pl.numeric_value
        FROM assessment_items ai
        JOIN proficiency_levels pl ON ai.proficiency_level_id = pl.id
        WHERE ai.assessment_id = ?
      `, [assessment.id]);

      assessmentsWithItems.push({
        ...assessment,
        items,
      });
    }

    res.json(assessmentsWithItems);
  } catch (error) {
    console.error("Error fetching assessments:", error);
    res.status(500).json({ error: "Failed to fetch assessments" });
  }
};

// Get assessments for a specific employee
export const getEmployeeAssessmentHistory: RequestHandler = async (
  req,
  res
) => {
  try {
    const pool = getPool();
    const { employeeId } = req.params;

    const [assessments] = await pool.query(`
      SELECT a.*, r.id as role_id, r.name as role_name, r.description
      FROM assessments a
      JOIN roles r ON a.role_id = r.id
      WHERE a.employee_id = ?
      ORDER BY a.date DESC
    `, [employeeId]);

    // Fetch items for each assessment
    const assessmentsWithItems = [];
    for (const assessment of assessments as any[]) {
      const [items] = await pool.query(`
        SELECT ai.*, pl.level_name, pl.numeric_value
        FROM assessment_items ai
        JOIN proficiency_levels pl ON ai.proficiency_level_id = pl.id
        WHERE ai.assessment_id = ?
      `, [assessment.id]);

      assessmentsWithItems.push({
        ...assessment,
        items,
      });
    }

    res.json(assessmentsWithItems);
  } catch (error) {
    console.error("Error fetching assessment history:", error);
    res.status(500).json({ error: "Failed to fetch assessment history" });
  }
};

// Create assessment
export const createAssessment: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { employee_id, role_id, date, comments, items, assessment_type } =
      req.body as CreateAssessmentRequest;

    // Validation
    if (!employee_id || !role_id || !date) {
      res
        .status(400)
        .json({ error: "employee_id, role_id, and date are required" });
      return;
    }

    if (!items || items.length === 0) {
      res.status(400).json({ error: "At least one assessment item is required" });
      return;
    }

    // Validate all items have required fields
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.skill_name || !item.proficiency_level_id) {
        res.status(400).json({
          error: `Assessment item ${i + 1} is missing skill_name or proficiency_level_id`,
        });
        return;
      }

      // Verify proficiency level exists
      const [levelCheck] = await pool.query(
        "SELECT id FROM proficiency_levels WHERE id = ?",
        [item.proficiency_level_id]
      );
      if ((levelCheck as any[]).length === 0) {
        res.status(400).json({
          error: `Proficiency level ${item.proficiency_level_id} not found`,
        });
        return;
      }
    }

    // Verify employee exists
    const [empCheck] = await pool.query(
      "SELECT id FROM employees WHERE id = ?",
      [employee_id]
    );
    if ((empCheck as any[]).length === 0) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    // Verify role exists
    const [roleCheck] = await pool.query(
      "SELECT id FROM roles WHERE id = ?",
      [role_id]
    );
    if ((roleCheck as any[]).length === 0) {
      res.status(404).json({ error: "Role not found" });
      return;
    }

    // Insert assessment
    const [result] = await pool.query(
      `INSERT INTO assessments (employee_id, role_id, date, comments)
       VALUES (?, ?, ?, ?)`,
      [employee_id, role_id, date, comments || null]
    );

    const assessmentId = (result as any).insertId;

    // Insert assessment items
    for (const item of items) {
      let skillId = item.skill_id || null;

      // If skill_id is not provided, try to find or create the skill
      if (!skillId) {
        const [skillCheck] = await pool.query(
          "SELECT id FROM skills WHERE name = ?",
          [item.skill_name]
        );
        if ((skillCheck as any[]).length > 0) {
          skillId = (skillCheck as any[])[0].id;
        } else {
          // Create the skill if it doesn't exist
          const [createResult] = await pool.query(
            "INSERT INTO skills (name, description) VALUES (?, ?)",
            [item.skill_name, ""]
          );
          skillId = (createResult as any).insertId;
        }
      }

      await pool.query(
        `INSERT INTO assessment_items (assessment_id, skill_name, proficiency_level_id)
         VALUES (?, ?, ?)`,
        [assessmentId, item.skill_name, item.proficiency_level_id]
      );
    }

    // Fetch the created assessment with items
    const [assessments] = await pool.query(`
      SELECT a.*, e.id as employee_id, e.name as employee_name, e.email, e.department,
             r.id as role_id, r.name as role_name, r.description as role_description
      FROM assessments a
      JOIN employees e ON a.employee_id = e.id
      JOIN roles r ON a.role_id = r.id
      WHERE a.id = ?
    `, [assessmentId]);

    const assessment = (assessments as any[])[0];

    const [assessmentItems] = await pool.query(`
      SELECT ai.*, pl.level_name, pl.numeric_value
      FROM assessment_items ai
      JOIN proficiency_levels pl ON ai.proficiency_level_id = pl.id
      WHERE ai.assessment_id = ?
    `, [assessmentId]);

    res.status(201).json({
      ...assessment,
      assessment_type: assessment_type || "employee",
      items: assessmentItems,
    });
  } catch (error: any) {
    console.error("Error creating assessment:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({
        error: "Assessment for this employee and role on this date already exists",
      });
      return;
    }
    res.status(400).json({ error: error.message || "Failed to create assessment" });
  }
};

// Delete assessment
export const deleteAssessment: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    // Delete assessment items first (due to foreign key constraint)
    await pool.query("DELETE FROM assessment_items WHERE assessment_id = ?", [id]);

    // Delete assessment
    const [result] = await pool.query("DELETE FROM assessments WHERE id = ?", [id]);

    if ((result as any).affectedRows === 0) {
      res.status(404).json({ error: "Assessment not found" });
      return;
    }

    res.json({ message: "Assessment deleted successfully" });
  } catch (error) {
    console.error("Error deleting assessment:", error);
    res.status(500).json({ error: "Failed to delete assessment" });
  }
};

// Get analytics/trends
export const getAnalyticsTrends: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();

    // Get general trend (average proficiency across all assessments over time)
    const [generalTrendData] = await pool.query(`
      SELECT a.date, AVG(pl.numeric_value) as avg_proficiency
      FROM assessments a
      JOIN assessment_items ai ON a.id = ai.assessment_id
      JOIN proficiency_levels pl ON ai.proficiency_level_id = pl.id
      GROUP BY a.date
      ORDER BY a.date ASC
    `);

    const general = (generalTrendData as any[]).map((row: any) => ({
      date: row.date,
      proficiency: parseFloat(row.avg_proficiency.toString()),
    }));

    // Get employee-specific trends
    const [employees] = await pool.query(
      "SELECT id, name FROM employees ORDER BY name ASC"
    );

    const employeeTrends: Record<number, any> = {};

    for (const employee of employees as any[]) {
      const [trendData] = await pool.query(`
        SELECT a.date, AVG(pl.numeric_value) as avg_proficiency
        FROM assessments a
        JOIN assessment_items ai ON a.id = ai.assessment_id
        JOIN proficiency_levels pl ON ai.proficiency_level_id = pl.id
        WHERE a.employee_id = ?
        GROUP BY a.date
        ORDER BY a.date ASC
      `, [employee.id]);

      employeeTrends[employee.id] = {
        employee: {
          id: employee.id,
          name: employee.name,
        },
        trends: (trendData as any[]).map((row: any) => ({
          date: row.date,
          proficiency: parseFloat(row.avg_proficiency.toString()),
          employeeName: employee.name,
        })),
      };
    }

    const analytics: AnalyticsTrends = {
      general,
      employees: employeeTrends,
    };

    res.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};

router.get("/", getAssessments);
router.post("/", createAssessment);
router.get("/history/:employeeId", getEmployeeAssessmentHistory);
router.get("/analytics/trends", getAnalyticsTrends);
router.delete("/:id", deleteAssessment);

export default router;
