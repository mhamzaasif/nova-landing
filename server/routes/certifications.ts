import { Router, RequestHandler } from "express";
import { getPool } from "../db";
import type { Certification, CreateCertificationRequest, UpdateCertificationRequest } from "@shared/api";

const router = Router();

// Get all certifications
export const getCertifications: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const [certifications] = await pool.query(
      "SELECT * FROM certifications ORDER BY name"
    );
    res.json(certifications);
  } catch (error) {
    console.error("Error fetching certifications:", error);
    res.status(500).json({ error: "Failed to fetch certifications" });
  }
};

// Get certification by ID
export const getCertificationById: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const [certifications] = await pool.query(
      "SELECT * FROM certifications WHERE id = ?",
      [id]
    );
    if ((certifications as any[]).length === 0) {
      res.status(404).json({ error: "Certification not found" });
      return;
    }
    res.json((certifications as any[])[0]);
  } catch (error) {
    console.error("Error fetching certification:", error);
    res.status(500).json({ error: "Failed to fetch certification" });
  }
};

// Create certification
export const createCertification: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { name, description, issuing_body, is_critical, renewal_period_months } =
      req.body as CreateCertificationRequest;

    if (!name || !issuing_body) {
      res.status(400).json({ error: "name and issuing_body are required" });
      return;
    }

    const [result] = await pool.query(
      `INSERT INTO certifications (name, description, issuing_body, is_critical, renewal_period_months)
       VALUES (?, ?, ?, ?, ?)`,
      [name, description || null, issuing_body, is_critical || false, renewal_period_months || null]
    );

    const certificationId = (result as any).insertId;

    const [certifications] = await pool.query(
      "SELECT * FROM certifications WHERE id = ?",
      [certificationId]
    );

    res.status(201).json((certifications as any[])[0]);
  } catch (error: any) {
    console.error("Error creating certification:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "Certification with this name already exists" });
      return;
    }
    res.status(400).json({ error: error.message || "Failed to create certification" });
  }
};

// Update certification
export const updateCertification: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { name, description, issuing_body, is_critical, renewal_period_months } =
      req.body as UpdateCertificationRequest;

    // Build dynamic update query
    const fields: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      fields.push("name = ?");
      values.push(name);
    }
    if (description !== undefined) {
      fields.push("description = ?");
      values.push(description);
    }
    if (issuing_body !== undefined) {
      fields.push("issuing_body = ?");
      values.push(issuing_body);
    }
    if (is_critical !== undefined) {
      fields.push("is_critical = ?");
      values.push(is_critical);
    }
    if (renewal_period_months !== undefined) {
      fields.push("renewal_period_months = ?");
      values.push(renewal_period_months);
    }

    if (fields.length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    values.push(id);
    const query = `UPDATE certifications SET ${fields.join(", ")} WHERE id = ?`;

    const [result] = await pool.query(query, values);

    if ((result as any).affectedRows === 0) {
      res.status(404).json({ error: "Certification not found" });
      return;
    }

    const [certifications] = await pool.query(
      "SELECT * FROM certifications WHERE id = ?",
      [id]
    );

    res.json((certifications as any[])[0]);
  } catch (error: any) {
    console.error("Error updating certification:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "Certification with this name already exists" });
      return;
    }
    res.status(400).json({ error: error.message || "Failed to update certification" });
  }
};

// Delete certification
export const deleteCertification: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    // First delete employee certifications
    await pool.query("DELETE FROM employee_certifications WHERE certification_id = ?", [id]);

    // Then delete the certification
    const [result] = await pool.query("DELETE FROM certifications WHERE id = ?", [id]);

    if ((result as any).affectedRows === 0) {
      res.status(404).json({ error: "Certification not found" });
      return;
    }

    res.json({ message: "Certification deleted successfully" });
  } catch (error) {
    console.error("Error deleting certification:", error);
    res.status(500).json({ error: "Failed to delete certification" });
  }
};

router.get("/", getCertifications);
router.get("/:id", getCertificationById);
router.post("/", createCertification);
router.patch("/:id", updateCertification);
router.delete("/:id", deleteCertification);

export default router;
