import { Router, RequestHandler } from "express";
import { getPool } from "../db";
import type {
  Skill,
  CreateSkillRequest,
  UpdateSkillRequest,
} from "@shared/api";

const router = Router();

// Get all skills
export const getSkills: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      "SELECT * FROM skills ORDER BY name ASC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching skills:", error);
    res.status(500).json({ error: "Failed to fetch skills" });
  }
};

// Get single skill
export const getSkill: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM skills WHERE id = ?",
      [id]
    );
    const skill = (rows as any[])[0];

    if (!skill) {
      res.status(404).json({ error: "Skill not found" });
      return;
    }

    res.json(skill);
  } catch (error) {
    console.error("Error fetching skill:", error);
    res.status(500).json({ error: "Failed to fetch skill" });
  }
};

// Search skills by name
export const searchSkills: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { query } = req.query;

    if (!query || typeof query !== "string") {
      res.status(400).json({ error: "Search query is required" });
      return;
    }

    const [rows] = await pool.query(
      "SELECT * FROM skills WHERE name LIKE ? ORDER BY name ASC LIMIT 10",
      [`%${query}%`]
    );

    res.json(rows);
  } catch (error) {
    console.error("Error searching skills:", error);
    res.status(500).json({ error: "Failed to search skills" });
  }
};

// Create skill
export const createSkill: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { name, description } = req.body as CreateSkillRequest;

    if (!name) {
      res.status(400).json({ error: "Name is required" });
      return;
    }

    const [result] = await pool.query(
      "INSERT INTO skills (name, description) VALUES (?, ?)",
      [name, description || null]
    );

    const insertId = (result as any).insertId;
    const [rows] = await pool.query(
      "SELECT * FROM skills WHERE id = ?",
      [insertId]
    );
    const skill = (rows as any[])[0];

    res.status(201).json(skill);
  } catch (error: any) {
    console.error("Error creating skill:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "Skill name already exists" });
      return;
    }
    res.status(500).json({ error: "Failed to create skill" });
  }
};

// Update skill
export const updateSkill: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { name, description } = req.body as UpdateSkillRequest;

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }

    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    values.push(id);
    const query = `UPDATE skills SET ${updates.join(", ")} WHERE id = ?`;

    await pool.query(query, values);

    const [rows] = await pool.query(
      "SELECT * FROM skills WHERE id = ?",
      [id]
    );
    const skill = (rows as any[])[0];

    if (!skill) {
      res.status(404).json({ error: "Skill not found" });
      return;
    }

    res.json(skill);
  } catch (error: any) {
    console.error("Error updating skill:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "Skill name already exists" });
      return;
    }
    res.status(500).json({ error: "Failed to update skill" });
  }
};

// Delete skill
export const deleteSkill: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    const [result] = await pool.query(
      "DELETE FROM skills WHERE id = ?",
      [id]
    );

    if ((result as any).affectedRows === 0) {
      res.status(404).json({ error: "Skill not found" });
      return;
    }

    res.json({ message: "Skill deleted successfully" });
  } catch (error) {
    console.error("Error deleting skill:", error);
    res.status(500).json({ error: "Failed to delete skill" });
  }
};

router.get("/", getSkills);
router.get("/search", searchSkills);
router.get("/:id", getSkill);
router.post("/", createSkill);
router.put("/:id", updateSkill);
router.delete("/:id", deleteSkill);

export default router;
