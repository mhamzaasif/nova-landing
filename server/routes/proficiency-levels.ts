import { Router, RequestHandler } from "express";
import { getPool } from "../db";
import type {
  ProficiencyLevel,
  CreateProficiencyLevelRequest,
  UpdateProficiencyLevelRequest,
} from "@shared/api";

const router = Router();

// Get all proficiency levels
export const getProficiencyLevels: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      "SELECT * FROM proficiency_levels ORDER BY numeric_value ASC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching proficiency levels:", error);
    res.status(500).json({ error: "Failed to fetch proficiency levels" });
  }
};

// Get single proficiency level
export const getProficiencyLevel: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM proficiency_levels WHERE id = ?",
      [id]
    );
    const level = (rows as any[])[0];

    if (!level) {
      res.status(404).json({ error: "Proficiency level not found" });
      return;
    }

    res.json(level);
  } catch (error) {
    console.error("Error fetching proficiency level:", error);
    res.status(500).json({ error: "Failed to fetch proficiency level" });
  }
};

// Create proficiency level
export const createProficiencyLevel: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { level_name, numeric_value } =
      req.body as CreateProficiencyLevelRequest;

    if (!level_name || numeric_value === undefined) {
      res
        .status(400)
        .json({ error: "level_name and numeric_value are required" });
      return;
    }

    const [result] = await pool.query(
      "INSERT INTO proficiency_levels (level_name, numeric_value) VALUES (?, ?)",
      [level_name, numeric_value]
    );

    const insertId = (result as any).insertId;
    const [rows] = await pool.query(
      "SELECT * FROM proficiency_levels WHERE id = ?",
      [insertId]
    );
    const level = (rows as any[])[0];

    res.status(201).json(level);
  } catch (error: any) {
    console.error("Error creating proficiency level:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "Proficiency level name already exists" });
      return;
    }
    res.status(500).json({ error: "Failed to create proficiency level" });
  }
};

// Update proficiency level
export const updateProficiencyLevel: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { level_name, numeric_value } =
      req.body as UpdateProficiencyLevelRequest;

    const updates: string[] = [];
    const values: any[] = [];

    if (level_name !== undefined) {
      updates.push("level_name = ?");
      values.push(level_name);
    }

    if (numeric_value !== undefined) {
      updates.push("numeric_value = ?");
      values.push(numeric_value);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    values.push(id);
    const query = `UPDATE proficiency_levels SET ${updates.join(", ")} WHERE id = ?`;

    await pool.query(query, values);

    const [rows] = await pool.query(
      "SELECT * FROM proficiency_levels WHERE id = ?",
      [id]
    );
    const level = (rows as any[])[0];

    if (!level) {
      res.status(404).json({ error: "Proficiency level not found" });
      return;
    }

    res.json(level);
  } catch (error: any) {
    console.error("Error updating proficiency level:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "Proficiency level name already exists" });
      return;
    }
    res.status(500).json({ error: "Failed to update proficiency level" });
  }
};

// Delete proficiency level
export const deleteProficiencyLevel: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    const [result] = await pool.query(
      "DELETE FROM proficiency_levels WHERE id = ?",
      [id]
    );

    if ((result as any).affectedRows === 0) {
      res.status(404).json({ error: "Proficiency level not found" });
      return;
    }

    res.json({ message: "Proficiency level deleted successfully" });
  } catch (error) {
    console.error("Error deleting proficiency level:", error);
    res.status(500).json({ error: "Failed to delete proficiency level" });
  }
};

router.get("/", getProficiencyLevels);
router.get("/:id", getProficiencyLevel);
router.post("/", createProficiencyLevel);
router.put("/:id", updateProficiencyLevel);
router.delete("/:id", deleteProficiencyLevel);

export default router;
