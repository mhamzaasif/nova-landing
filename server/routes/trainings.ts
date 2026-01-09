import { Router, RequestHandler } from "express";
import { getPool } from "../db";
import type { Training, CreateTrainingRequest, UpdateTrainingRequest } from "@shared/api";

const router = Router();

// Get all trainings
export const getTrainings: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const [trainings] = await pool.query(`
      SELECT t.*, s.name as skill_name
      FROM trainings t
      LEFT JOIN skills s ON t.skill_id = s.id
      ORDER BY t.name
    `);
    res.json(trainings);
  } catch (error) {
    console.error("Error fetching trainings:", error);
    res.status(500).json({ error: "Failed to fetch trainings" });
  }
};

// Get training by ID
export const getTrainingById: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const [trainings] = await pool.query(`
      SELECT t.*, s.name as skill_name
      FROM trainings t
      LEFT JOIN skills s ON t.skill_id = s.id
      WHERE t.id = ?
    `, [id]);

    if ((trainings as any[]).length === 0) {
      res.status(404).json({ error: "Training not found" });
      return;
    }
    res.json((trainings as any[])[0]);
  } catch (error) {
    console.error("Error fetching training:", error);
    res.status(500).json({ error: "Failed to fetch training" });
  }
};

// Create training
export const createTraining: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { name, description, provider, duration_hours, skill_id } =
      req.body as CreateTrainingRequest;

    if (!name || !provider || !duration_hours) {
      res.status(400).json({ error: "name, provider, and duration_hours are required" });
      return;
    }

    // Verify skill exists if skill_id is provided
    if (skill_id) {
      const [skillCheck] = await pool.query(
        "SELECT id FROM skills WHERE id = ?",
        [skill_id]
      );
      if ((skillCheck as any[]).length === 0) {
        res.status(404).json({ error: "Skill not found" });
        return;
      }
    }

    const [result] = await pool.query(
      `INSERT INTO trainings (name, description, provider, duration_hours, skill_id)
       VALUES (?, ?, ?, ?, ?)`,
      [name, description || null, provider, duration_hours, skill_id || null]
    );

    const trainingId = (result as any).insertId;

    const [trainings] = await pool.query(`
      SELECT t.*, s.name as skill_name
      FROM trainings t
      LEFT JOIN skills s ON t.skill_id = s.id
      WHERE t.id = ?
    `, [trainingId]);

    res.status(201).json((trainings as any[])[0]);
  } catch (error: any) {
    console.error("Error creating training:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "Training with this name already exists" });
      return;
    }
    res.status(400).json({ error: error.message || "Failed to create training" });
  }
};

// Update training
export const updateTraining: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { name, description, provider, duration_hours, skill_id } =
      req.body as UpdateTrainingRequest;

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
    if (provider !== undefined) {
      fields.push("provider = ?");
      values.push(provider);
    }
    if (duration_hours !== undefined) {
      fields.push("duration_hours = ?");
      values.push(duration_hours);
    }
    if (skill_id !== undefined) {
      // Verify skill exists if provided
      if (skill_id !== null) {
        const [skillCheck] = await pool.query(
          "SELECT id FROM skills WHERE id = ?",
          [skill_id]
        );
        if ((skillCheck as any[]).length === 0) {
          res.status(404).json({ error: "Skill not found" });
          return;
        }
      }
      fields.push("skill_id = ?");
      values.push(skill_id);
    }

    if (fields.length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    values.push(id);
    const query = `UPDATE trainings SET ${fields.join(", ")} WHERE id = ?`;

    const [result] = await pool.query(query, values);

    if ((result as any).affectedRows === 0) {
      res.status(404).json({ error: "Training not found" });
      return;
    }

    const [trainings] = await pool.query(`
      SELECT t.*, s.name as skill_name
      FROM trainings t
      LEFT JOIN skills s ON t.skill_id = s.id
      WHERE t.id = ?
    `, [id]);

    res.json((trainings as any[])[0]);
  } catch (error: any) {
    console.error("Error updating training:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "Training with this name already exists" });
      return;
    }
    res.status(400).json({ error: error.message || "Failed to update training" });
  }
};

// Delete training
export const deleteTraining: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    // First delete employee training records
    await pool.query("DELETE FROM employee_training WHERE training_id = ?", [id]);

    // Then delete the training
    const [result] = await pool.query("DELETE FROM trainings WHERE id = ?", [id]);

    if ((result as any).affectedRows === 0) {
      res.status(404).json({ error: "Training not found" });
      return;
    }

    res.json({ message: "Training deleted successfully" });
  } catch (error) {
    console.error("Error deleting training:", error);
    res.status(500).json({ error: "Failed to delete training" });
  }
};

router.get("/", getTrainings);
router.get("/:id", getTrainingById);
router.post("/", createTraining);
router.patch("/:id", updateTraining);
router.delete("/:id", deleteTraining);

export default router;
