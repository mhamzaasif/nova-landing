import { Router, RequestHandler } from "express";
import { getPool } from "../db";
import type { EmployeeTraining, CreateEmployeeTrainingRequest, UpdateEmployeeTrainingRequest } from "@shared/api";

const router = Router();

// Get all employee training assignments
export const getEmployeeTraining: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { employeeId, status } = req.query;

    let query = `
      SELECT et.*, t.name as training_name, t.provider, t.duration_hours,
             s.name as skill_name, e.name as employee_name, e.email
      FROM employee_training et
      JOIN trainings t ON et.training_id = t.id
      LEFT JOIN skills s ON t.skill_id = s.id
      JOIN employees e ON et.employee_id = e.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (employeeId) {
      conditions.push("et.employee_id = ?");
      params.push(employeeId);
    }

    if (status) {
      conditions.push("et.status = ?");
      params.push(status);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY et.employee_id, t.name";
    const [trainings] = await pool.query(query, params);
    res.json(trainings);
  } catch (error) {
    console.error("Error fetching employee training:", error);
    res.status(500).json({ error: "Failed to fetch employee training" });
  }
};

// Get training for a specific employee
export const getEmployeeTrainingById: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { employeeId } = req.params;

    const [trainings] = await pool.query(`
      SELECT et.*, t.name as training_name, t.provider, t.duration_hours, t.description,
             s.name as skill_name, s.id as skill_id
      FROM employee_training et
      JOIN trainings t ON et.training_id = t.id
      LEFT JOIN skills s ON t.skill_id = s.id
      WHERE et.employee_id = ?
      ORDER BY 
        CASE et.status
          WHEN 'pending' THEN 1
          WHEN 'in_progress' THEN 2
          WHEN 'completed' THEN 3
        END,
        t.name
    `, [employeeId]);

    res.json(trainings);
  } catch (error) {
    console.error("Error fetching employee training:", error);
    res.status(500).json({ error: "Failed to fetch employee training" });
  }
};

// Assign training to employee
export const assignTraining: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { employee_id, training_id, completed_date, status, notes } =
      req.body as CreateEmployeeTrainingRequest;

    if (!employee_id || !training_id) {
      res.status(400).json({
        error: "employee_id and training_id are required",
      });
      return;
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

    // Verify training exists
    const [trainingCheck] = await pool.query(
      "SELECT id FROM trainings WHERE id = ?",
      [training_id]
    );
    if ((trainingCheck as any[]).length === 0) {
      res.status(404).json({ error: "Training not found" });
      return;
    }

    const [result] = await pool.query(
      `INSERT INTO employee_training (employee_id, training_id, completed_date, status, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [
        employee_id,
        training_id,
        completed_date || null,
        status || "pending",
        notes || null,
      ]
    );

    const assignmentId = (result as any).insertId;

    const [assignments] = await pool.query(`
      SELECT et.*, t.name as training_name, t.provider, t.duration_hours,
             s.name as skill_name, e.name as employee_name, e.email
      FROM employee_training et
      JOIN trainings t ON et.training_id = t.id
      LEFT JOIN skills s ON t.skill_id = s.id
      JOIN employees e ON et.employee_id = e.id
      WHERE et.id = ?
    `, [assignmentId]);

    res.status(201).json((assignments as any[])[0]);
  } catch (error: any) {
    console.error("Error assigning training:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({
        error: "Employee already has this training assigned",
      });
      return;
    }
    res.status(400).json({ error: error.message || "Failed to assign training" });
  }
};

// Update employee training
export const updateEmployeeTraining: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { completed_date, status, notes } = req.body as UpdateEmployeeTrainingRequest;

    const fields: string[] = [];
    const values: any[] = [];

    if (completed_date !== undefined) {
      fields.push("completed_date = ?");
      values.push(completed_date);
    }
    if (status !== undefined) {
      fields.push("status = ?");
      values.push(status);
    }
    if (notes !== undefined) {
      fields.push("notes = ?");
      values.push(notes);
    }

    if (fields.length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    values.push(id);
    const query = `UPDATE employee_training SET ${fields.join(", ")} WHERE id = ?`;

    const [result] = await pool.query(query, values);

    if ((result as any).affectedRows === 0) {
      res.status(404).json({ error: "Employee training not found" });
      return;
    }

    const [assignments] = await pool.query(`
      SELECT et.*, t.name as training_name, t.provider, t.duration_hours,
             s.name as skill_name, e.name as employee_name, e.email
      FROM employee_training et
      JOIN trainings t ON et.training_id = t.id
      LEFT JOIN skills s ON t.skill_id = s.id
      JOIN employees e ON et.employee_id = e.id
      WHERE et.id = ?
    `, [id]);

    res.json((assignments as any[])[0]);
  } catch (error) {
    console.error("Error updating employee training:", error);
    res.status(500).json({ error: "Failed to update employee training" });
  }
};

// Remove training from employee
export const removeTraining: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    const [result] = await pool.query(
      "DELETE FROM employee_training WHERE id = ?",
      [id]
    );

    if ((result as any).affectedRows === 0) {
      res.status(404).json({ error: "Employee training not found" });
      return;
    }

    res.json({ message: "Training removed successfully" });
  } catch (error) {
    console.error("Error removing training:", error);
    res.status(500).json({ error: "Failed to remove training" });
  }
};

router.get("/", getEmployeeTraining);
router.get("/:employeeId", getEmployeeTrainingById);
router.post("/", assignTraining);
router.patch("/:id", updateEmployeeTraining);
router.delete("/:id", removeTraining);

export default router;
