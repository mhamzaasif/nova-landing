import { Router, RequestHandler } from "express";
import { getPool } from "../db";
import type { EmployeeCertification, CreateEmployeeCertificationRequest, UpdateEmployeeCertificationRequest } from "@shared/api";

const router = Router();

// Get all employee certifications
export const getEmployeeCertifications: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { employeeId } = req.query;

    let query = `
      SELECT ec.*, c.name as cert_name, c.is_critical, c.renewal_period_months,
             e.name as employee_name, e.email
      FROM employee_certifications ec
      JOIN certifications c ON ec.certification_id = c.id
      JOIN employees e ON ec.employee_id = e.id
    `;
    const params: any[] = [];

    if (employeeId) {
      query += " WHERE ec.employee_id = ?";
      params.push(employeeId);
    }

    query += " ORDER BY ec.employee_id, c.name";
    const [certifications] = await pool.query(query, params);
    res.json(certifications);
  } catch (error) {
    console.error("Error fetching employee certifications:", error);
    res.status(500).json({ error: "Failed to fetch employee certifications" });
  }
};

// Get certifications for a specific employee
export const getEmployeeCertificationsById: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { employeeId } = req.params;

    const [certifications] = await pool.query(`
      SELECT ec.*, c.name as cert_name, c.is_critical, c.renewal_period_months,
             c.issuing_body, c.description
      FROM employee_certifications ec
      JOIN certifications c ON ec.certification_id = c.id
      WHERE ec.employee_id = ?
      ORDER BY c.name
    `, [employeeId]);

    res.json(certifications);
  } catch (error) {
    console.error("Error fetching employee certifications:", error);
    res.status(500).json({ error: "Failed to fetch employee certifications" });
  }
};

// Assign certification to employee
export const assignCertification: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { employee_id, certification_id, issue_date, expiry_date } =
      req.body as CreateEmployeeCertificationRequest;

    if (!employee_id || !certification_id || !issue_date) {
      res.status(400).json({
        error: "employee_id, certification_id, and issue_date are required",
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

    // Verify certification exists
    const [certCheck] = await pool.query(
      "SELECT id FROM certifications WHERE id = ?",
      [certification_id]
    );
    if ((certCheck as any[]).length === 0) {
      res.status(404).json({ error: "Certification not found" });
      return;
    }

    const [result] = await pool.query(
      `INSERT INTO employee_certifications (employee_id, certification_id, issue_date, expiry_date)
       VALUES (?, ?, ?, ?)`,
      [employee_id, certification_id, issue_date, expiry_date || null]
    );

    const assignmentId = (result as any).insertId;

    const [assignments] = await pool.query(`
      SELECT ec.*, c.name as cert_name, c.is_critical, c.renewal_period_months,
             e.name as employee_name, e.email
      FROM employee_certifications ec
      JOIN certifications c ON ec.certification_id = c.id
      JOIN employees e ON ec.employee_id = e.id
      WHERE ec.id = ?
    `, [assignmentId]);

    res.status(201).json((assignments as any[])[0]);
  } catch (error: any) {
    console.error("Error assigning certification:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({
        error: "Employee already has this certification assigned",
      });
      return;
    }
    res.status(400).json({ error: error.message || "Failed to assign certification" });
  }
};

// Update employee certification
export const updateEmployeeCertification: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { issue_date, expiry_date } = req.body as UpdateEmployeeCertificationRequest;

    const fields: string[] = [];
    const values: any[] = [];

    if (issue_date !== undefined) {
      fields.push("issue_date = ?");
      values.push(issue_date);
    }
    if (expiry_date !== undefined) {
      fields.push("expiry_date = ?");
      values.push(expiry_date);
    }

    if (fields.length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    values.push(id);
    const query = `UPDATE employee_certifications SET ${fields.join(", ")} WHERE id = ?`;

    const [result] = await pool.query(query, values);

    if ((result as any).affectedRows === 0) {
      res.status(404).json({ error: "Employee certification not found" });
      return;
    }

    const [assignments] = await pool.query(`
      SELECT ec.*, c.name as cert_name, c.is_critical, c.renewal_period_months,
             e.name as employee_name, e.email
      FROM employee_certifications ec
      JOIN certifications c ON ec.certification_id = c.id
      JOIN employees e ON ec.employee_id = e.id
      WHERE ec.id = ?
    `, [id]);

    res.json((assignments as any[])[0]);
  } catch (error) {
    console.error("Error updating employee certification:", error);
    res.status(500).json({ error: "Failed to update employee certification" });
  }
};

// Remove certification from employee
export const removeCertification: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    const [result] = await pool.query(
      "DELETE FROM employee_certifications WHERE id = ?",
      [id]
    );

    if ((result as any).affectedRows === 0) {
      res.status(404).json({ error: "Employee certification not found" });
      return;
    }

    res.json({ message: "Certification removed successfully" });
  } catch (error) {
    console.error("Error removing certification:", error);
    res.status(500).json({ error: "Failed to remove certification" });
  }
};

router.get("/", getEmployeeCertifications);
router.get("/:employeeId", getEmployeeCertificationsById);
router.post("/", assignCertification);
router.patch("/:id", updateEmployeeCertification);
router.delete("/:id", removeCertification);

export default router;
