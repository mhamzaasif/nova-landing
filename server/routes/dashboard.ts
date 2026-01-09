import { Router, RequestHandler } from "express";
import { getPool } from "../db";

const router = Router();

// Get role requirements (skills and target levels per role)
export const getRoleRequirements: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const [requirements] = await pool.query(`
      SELECT * FROM vw_role_requirements
      ORDER BY role_id, skill_name
    `);
    res.json(requirements);
  } catch (error) {
    console.error("Error fetching role requirements:", error);
    res.status(500).json({ error: "Failed to fetch role requirements" });
  }
};

// Get latest assessments (most recent skill assessment per employee, role, skill)
export const getLatestAssessments: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const [assessments] = await pool.query(`
      SELECT * FROM vw_latest_assessments
      ORDER BY employee_id, role_id, skill_name
    `);
    res.json(assessments);
  } catch (error) {
    console.error("Error fetching latest assessments:", error);
    res.status(500).json({ error: "Failed to fetch latest assessments" });
  }
};

// Get competency delta (gaps between required and actual proficiency)
export const getCompetencyDelta: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { employeeId, roleId } = req.query;

    let query = "SELECT * FROM vw_competency_delta WHERE 1=1";
    const params: any[] = [];

    if (employeeId) {
      query += " AND employee_id = ?";
      params.push(employeeId);
    }

    if (roleId) {
      query += " AND role_id = ?";
      params.push(roleId);
    }

    query += " ORDER BY employee_id, role_id, skill_name";

    const [delta] = await pool.query(query, params);
    res.json(delta);
  } catch (error) {
    console.error("Error fetching competency delta:", error);
    res.status(500).json({ error: "Failed to fetch competency delta" });
  }
};

// Get role readiness (overall readiness index per employee per role)
export const getRoleReadiness: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { employeeId, roleId } = req.query;

    let query = "SELECT * FROM vw_role_readiness WHERE 1=1";
    const params: any[] = [];

    if (employeeId) {
      query += " AND employee_id = ?";
      params.push(employeeId);
    }

    if (roleId) {
      query += " AND role_id = ?";
      params.push(roleId);
    }

    query += " ORDER BY employee_id, readiness_index DESC";

    const [readiness] = await pool.query(query, params);
    res.json(readiness);
  } catch (error) {
    console.error("Error fetching role readiness:", error);
    res.status(500).json({ error: "Failed to fetch role readiness" });
  }
};

// Get comprehensive dashboard data (role readiness with role and employee names)
export const getDashboardOverview: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const [readiness] = await pool.query(`
      SELECT rr.employee_id, rr.role_id, rr.readiness_index,
             e.name AS employee_name, e.department,
             r.name AS role_name
      FROM vw_role_readiness rr
      JOIN employees e ON e.id = rr.employee_id
      JOIN roles r ON r.id = rr.role_id
      ORDER BY rr.readiness_index DESC, e.name
    `);

    res.json(readiness);
  } catch (error) {
    console.error("Error fetching dashboard overview:", error);
    res.status(500).json({ error: "Failed to fetch dashboard overview" });
  }
};

// Get skills gap heatmap data (role x skill with average gaps)
export const getGapAnalysis: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const [gapData] = await pool.query(`
      SELECT r.name AS role_name, s.name AS skill_name,
             COUNT(DISTINCT cd.employee_id) AS employee_count,
             AVG(cd.gap) AS avg_gap,
             MAX(cd.gap) AS max_gap,
             MIN(cd.gap) AS min_gap
      FROM vw_competency_delta cd
      JOIN roles r ON r.id = cd.role_id
      JOIN skills s ON s.id = cd.skill_id
      GROUP BY cd.role_id, cd.skill_id, r.name, s.name
      ORDER BY avg_gap DESC
    `);

    res.json(gapData);
  } catch (error) {
    console.error("Error fetching gap analysis:", error);
    res.status(500).json({ error: "Failed to fetch gap analysis" });
  }
};

// Get training needs (employees with gaps in assigned roles)
export const getTrainingNeeds: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { minGap } = req.query;
    const threshold = minGap ? parseFloat(minGap as string) : 0;

    const [needs] = await pool.query(`
      SELECT e.id AS employee_id, e.name AS employee_name, e.department,
             r.id AS role_id, r.name AS role_name,
             COUNT(*) AS skills_with_gap,
             SUM(cd.gap) AS total_gap,
             AVG(cd.gap) AS avg_gap
      FROM vw_competency_delta cd
      JOIN employees e ON e.id = cd.employee_id
      JOIN roles r ON r.id = cd.role_id
      WHERE cd.gap > ?
      GROUP BY cd.employee_id, cd.role_id, e.id, e.name, e.department, r.id, r.name
      ORDER BY total_gap DESC
    `, [threshold]);

    res.json(needs);
  } catch (error) {
    console.error("Error fetching training needs:", error);
    res.status(500).json({ error: "Failed to fetch training needs" });
  }
};

// Get initial competency assessments (first assessment per employee per role)
export const getInitialAssessments: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const [assessments] = await pool.query(`
      SELECT a.employee_id, e.name AS employee_name, e.department,
             a.role_id, r.name AS role_name, a.date AS assessment_date,
             COUNT(DISTINCT ai.skill_id) AS total_skills_assessed,
             AVG(pl.numeric_value) AS avg_proficiency
      FROM assessments a
      JOIN employees e ON e.id = a.employee_id
      JOIN roles r ON r.id = a.role_id
      JOIN assessment_items ai ON ai.assessment_id = a.id
      JOIN proficiency_levels pl ON pl.id = ai.proficiency_level_id
      WHERE (a.employee_id, a.role_id, a.date) IN (
        SELECT employee_id, role_id, MIN(date) AS first_date
        FROM assessments
        GROUP BY employee_id, role_id
      )
      GROUP BY a.employee_id, a.role_id, a.id, e.name, e.department, r.name, a.date
      ORDER BY a.date DESC, e.name
    `);
    res.json(assessments);
  } catch (error) {
    console.error("Error fetching initial assessments:", error);
    res.status(500).json({ error: "Failed to fetch initial assessments" });
  }
};

// Get skills inventory (all skills with employee distribution)
export const getSkillsInventory: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const [inventory] = await pool.query(`
      SELECT s.id AS skill_id, s.name AS skill_name,
             COUNT(DISTINCT la.employee_id) AS total_employees,
             AVG(la.actual_level_order) AS avg_proficiency
      FROM skills s
      LEFT JOIN vw_latest_assessments la ON la.skill_id = s.id
      GROUP BY s.id, s.name
      ORDER BY s.name
    `);

    // Get proficiency level distribution for each skill
    const enriched = await Promise.all(
      (inventory as any[]).map(async (skill) => {
        const [levelDist] = await pool.query(`
          SELECT pl.numeric_value, COUNT(DISTINCT la.employee_id) AS count
          FROM vw_latest_assessments la
          JOIN proficiency_levels pl ON pl.numeric_value = la.actual_level_order
          WHERE la.skill_id = ?
          GROUP BY pl.numeric_value
        `, [skill.skill_id]);

        const [departments] = await pool.query(`
          SELECT DISTINCT e.department
          FROM vw_latest_assessments la
          JOIN employees e ON e.id = la.employee_id
          WHERE la.skill_id = ? AND e.department IS NOT NULL
        `, [skill.skill_id]);

        return {
          ...skill,
          employees_by_level: (levelDist as any[]).reduce((acc, item) => {
            acc[item.numeric_value] = item.count;
            return acc;
          }, {}),
          departments: (departments as any[]).map((d) => d.department),
        };
      })
    );

    res.json(enriched);
  } catch (error) {
    console.error("Error fetching skills inventory:", error);
    res.status(500).json({ error: "Failed to fetch skills inventory" });
  }
};

// Get learning path recommendations
export const getLearningPathRecommendations: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { employeeId, roleId } = req.query;

    let query = `
      SELECT cd.employee_id, e.name AS employee_name,
             cd.role_id, r.name AS role_name,
             cd.skill_id, cd.skill_name,
             cd.actual_level_order AS current_level,
             cd.required_level_order AS target_level,
             cd.gap
      FROM vw_competency_delta cd
      JOIN employees e ON e.id = cd.employee_id
      JOIN roles r ON r.id = cd.role_id
      WHERE cd.gap > 0
    `;
    const params: any[] = [];

    if (employeeId) {
      query += " AND cd.employee_id = ?";
      params.push(employeeId);
    }

    if (roleId) {
      query += " AND cd.role_id = ?";
      params.push(roleId);
    }

    query += " ORDER BY cd.gap DESC, cd.employee_id, cd.skill_name";

    const [gaps] = await pool.query(query, params);

    // Enrich with training recommendations
    const recommendations = await Promise.all(
      (gaps as any[]).map(async (gap) => {
        // Find trainings that match this skill
        const [trainings] = await pool.query(`
          SELECT t.id AS training_id, t.name AS training_name, 
                 t.provider, t.duration_hours
          FROM trainings t
          WHERE t.skill_id = ? OR t.skill_id IS NULL
          ORDER BY CASE WHEN t.skill_id = ? THEN 0 ELSE 1 END, t.name
          LIMIT 3
        `, [gap.skill_id, gap.skill_id]);

        const priority =
          gap.gap >= 2 ? "high" : gap.gap >= 1 ? "medium" : "low";

        return {
          ...gap,
          recommended_trainings: trainings,
          priority,
        };
      })
    );

    res.json(recommendations);
  } catch (error) {
    console.error("Error fetching learning path recommendations:", error);
    res.status(500).json({
      error: "Failed to fetch learning path recommendations",
    });
  }
};

// Get team capability (department/role level)
export const getTeamCapability: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { department } = req.query;

    let query = `
      SELECT e.department, rr.role_id, r.name AS role_name,
             COUNT(DISTINCT rr.employee_id) AS total_employees,
             AVG(rr.readiness_index) AS avg_readiness,
             SUM(CASE WHEN rr.readiness_index >= 90 THEN 1 ELSE 0 END) AS ready_count,
             SUM(CASE WHEN rr.readiness_index < 50 THEN 1 ELSE 0 END) AS not_ready_count
      FROM vw_role_readiness rr
      JOIN employees e ON e.id = rr.employee_id
      JOIN roles r ON r.id = rr.role_id
      WHERE e.department IS NOT NULL
    `;
    const params: any[] = [];

    if (department) {
      query += " AND e.department = ?";
      params.push(department);
    }

    query += " GROUP BY e.department, rr.role_id, r.name ORDER BY e.department, r.name";

    const [capability] = await pool.query(query, params);
    res.json(capability);
  } catch (error) {
    console.error("Error fetching team capability:", error);
    res.status(500).json({ error: "Failed to fetch team capability" });
  }
};

// Get succession planning candidates
export const getSuccessionCandidates: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { roleId, minReadiness } = req.query;

    let query = `
      SELECT rr.role_id, r.name AS role_name,
             rr.employee_id, e.name AS employee_name, e.department,
             rr.readiness_index,
             COUNT(DISTINCT CASE WHEN cd.gap <= 0 THEN cd.skill_id END) AS key_skills_covered,
             COUNT(DISTINCT cd.skill_id) AS total_skills_required
      FROM vw_role_readiness rr
      JOIN employees e ON e.id = rr.employee_id
      JOIN roles r ON r.id = rr.role_id
      JOIN vw_competency_delta cd ON cd.employee_id = rr.employee_id 
                                   AND cd.role_id = rr.role_id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (roleId) {
      conditions.push("rr.role_id = ?");
      params.push(roleId);
    }

    const minReadinessValue = minReadiness
      ? parseFloat(minReadiness as string)
      : 50;
    conditions.push("rr.readiness_index >= ?");
    params.push(minReadinessValue);

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += `
      GROUP BY rr.role_id, r.name, rr.employee_id, e.name, e.department, rr.readiness_index
      ORDER BY rr.role_id, rr.readiness_index DESC
    `;

    const [candidates] = await pool.query(query, params);

    // Enrich with coverage percentage and potential rating
    const enriched = (candidates as any[]).map((candidate) => {
      const coverage =
        candidate.total_skills_required > 0
          ? (candidate.key_skills_covered /
              candidate.total_skills_required) *
            100
          : 0;

      let potential_rating: "high" | "medium" | "low" = "low";
      if (coverage >= 80 && candidate.readiness_index >= 80) {
        potential_rating = "high";
      } else if (coverage >= 60 && candidate.readiness_index >= 60) {
        potential_rating = "medium";
      }

      return {
        ...candidate,
        coverage_percentage: Math.round(coverage * 100) / 100,
        potential_rating,
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error("Error fetching succession candidates:", error);
    res.status(500).json({ error: "Failed to fetch succession candidates" });
  }
};

// Get resource allocation optimization
export const getResourceAllocation: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const [allocation] = await pool.query(`
      SELECT r.id AS role_id, r.name AS role_name,
             COUNT(DISTINCT er.employee_id) AS current_employees,
             COUNT(DISTINCT er.employee_id) AS required_employees,
             AVG(rr.readiness_index) AS avg_readiness
      FROM roles r
      LEFT JOIN employee_roles er ON er.role_id = r.id
      LEFT JOIN vw_role_readiness rr ON rr.role_id = r.id 
                                     AND rr.employee_id = er.employee_id
      GROUP BY r.id, r.name
      ORDER BY r.name
    `);

    // Enrich with gap analysis and recommendations
    const enriched = await Promise.all(
      (allocation as any[]).map(async (role) => {
        const [criticalGaps] = await pool.query(`
          SELECT cd.skill_name,
                 COUNT(DISTINCT cd.employee_id) AS employees_needed
          FROM vw_competency_delta cd
          WHERE cd.role_id = ? AND cd.gap >= 2
          GROUP BY cd.skill_name
          ORDER BY employees_needed DESC
          LIMIT 5
        `, [role.role_id]);

        const gap = 0; // Could be calculated based on business requirements
        const recommendations: string[] = [];

        if (role.avg_readiness < 70) {
          recommendations.push(
            "Focus on upskilling existing employees in critical skills"
          );
        }
        if (criticalGaps && (criticalGaps as any[]).length > 0) {
          recommendations.push(
            `Address critical gaps in: ${(criticalGaps as any[])
              .map((g) => g.skill_name)
              .join(", ")}`
          );
        }
        if (role.current_employees === 0) {
          recommendations.push("Consider hiring or reassigning employees");
        }

        return {
          ...role,
          gap,
          recommended_actions: recommendations,
          critical_skills_gaps: criticalGaps || [],
        };
      })
    );

    res.json(enriched);
  } catch (error) {
    console.error("Error fetching resource allocation:", error);
    res.status(500).json({ error: "Failed to fetch resource allocation" });
  }
};

// Get certification tracking
export const getCertificationTracking: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { employeeId, status } = req.query;

    let query = `
      SELECT ec.employee_id, e.name AS employee_name, e.department,
             ec.certification_id, c.name AS cert_name, c.is_critical,
             ec.issue_date, ec.expiry_date,
             CASE
               WHEN ec.expiry_date IS NULL THEN NULL
               WHEN ec.expiry_date < CURDATE() THEN DATEDIFF(CURDATE(), ec.expiry_date)
               ELSE DATEDIFF(ec.expiry_date, CURDATE())
             END AS days_until_expiry
      FROM employee_certifications ec
      JOIN employees e ON e.id = ec.employee_id
      JOIN certifications c ON c.id = ec.certification_id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (employeeId) {
      conditions.push("ec.employee_id = ?");
      params.push(employeeId);
    }

    if (status) {
      if (status === "expired") {
        conditions.push("ec.expiry_date IS NOT NULL AND ec.expiry_date < CURDATE()");
      } else if (status === "expiring_soon") {
        conditions.push(
          "ec.expiry_date IS NOT NULL AND ec.expiry_date >= CURDATE() AND ec.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)"
        );
      } else if (status === "valid") {
        conditions.push(
          "(ec.expiry_date IS NULL OR ec.expiry_date > DATE_ADD(CURDATE(), INTERVAL 30 DAY))"
        );
      }
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY ec.employee_id, c.name";

    const [certifications] = await pool.query(query, params);

    // Add status field
    const enriched = (certifications as any[]).map((cert) => {
      let status: "valid" | "expiring_soon" | "expired" | "missing" = "valid";
      if (cert.expiry_date) {
        if (cert.days_until_expiry < 0) {
          status = "expired";
        } else if (cert.days_until_expiry <= 30) {
          status = "expiring_soon";
        }
      }
      return {
        ...cert,
        status,
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error("Error fetching certification tracking:", error);
    res.status(500).json({ error: "Failed to fetch certification tracking" });
  }
};

router.get("/role-requirements", getRoleRequirements);
router.get("/latest-assessments", getLatestAssessments);
router.get("/competency-delta", getCompetencyDelta);
router.get("/role-readiness", getRoleReadiness);
router.get("/overview", getDashboardOverview);
router.get("/gap-analysis", getGapAnalysis);
router.get("/training-needs", getTrainingNeeds);
router.get("/initial-assessments", getInitialAssessments);
router.get("/skills-inventory", getSkillsInventory);
router.get("/learning-paths", getLearningPathRecommendations);
router.get("/team-capability", getTeamCapability);
router.get("/succession-candidates", getSuccessionCandidates);
router.get("/resource-allocation", getResourceAllocation);
router.get("/certification-tracking", getCertificationTracking);

export default router;
