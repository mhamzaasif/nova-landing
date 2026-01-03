import { Router, RequestHandler } from "express";
import { getPool } from "../db";
import type {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
} from "@shared/api";

const router = Router();

// Get all roles with their skills
export const getRoles: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM roles ORDER BY name ASC");
    const roles = rows as any[];

    // Fetch skills for each role
    const rolesWithSkills = await Promise.all(
      roles.map(async (role) => {
        const [skillRows] = await pool.query(
          `
          SELECT rs.*, s.id as skill_id, s.name as skill_name, s.description,
                 pl.id as proficiency_level_id, pl.level_name, pl.numeric_value
          FROM role_skills rs
          JOIN skills s ON rs.skill_id = s.id
          JOIN proficiency_levels pl ON rs.required_proficiency_level_id = pl.id
          WHERE rs.role_id = ?
          ORDER BY s.name ASC
        `,
          [role.id]
        );
        return {
          ...role,
          skills: skillRows,
        };
      })
    );

    res.json(rolesWithSkills);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
};

// Get single role with its skills
export const getRole: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM roles WHERE id = ?", [id]);
    const role = (rows as any[])[0];

    if (!role) {
      res.status(404).json({ error: "Role not found" });
      return;
    }

    // Fetch role skills
    const [skillRows] = await pool.query(
      `
      SELECT rs.*, s.name as skill_name, s.description, pl.level_name, pl.numeric_value
      FROM role_skills rs
      JOIN skills s ON rs.skill_id = s.id
      JOIN proficiency_levels pl ON rs.required_proficiency_level_id = pl.id
      WHERE rs.role_id = ?
      ORDER BY s.name ASC
    `,
      [id]
    );

    res.json({
      ...role,
      skills: skillRows,
    });
  } catch (error) {
    console.error("Error fetching role:", error);
    res.status(500).json({ error: "Failed to fetch role" });
  }
};

// Create role with skills
export const createRole: RequestHandler = async (req, res) => {
  const connection = await (getPool() as any).getConnection();
  try {
    const { name, description, skills } = req.body as CreateRoleRequest;

    if (!name) {
      res.status(400).json({ error: "Name is required" });
      return;
    }

    // Start transaction
    await connection.beginTransaction();

    // Insert role
    const [result] = await connection.query(
      "INSERT INTO roles (name, description) VALUES (?, ?)",
      [name, description || null]
    );

    const roleId = (result as any).insertId;

    // Insert role skills if provided
    if (skills && Array.isArray(skills) && skills.length > 0) {
      for (const skill of skills) {
        if (!skill.skill_id || !skill.required_proficiency_level_id) {
          throw new Error("skill_id and required_proficiency_level_id are required for each skill");
        }

        // Verify skill exists
        const [skillCheck] = await connection.query(
          "SELECT id FROM skills WHERE id = ?",
          [skill.skill_id]
        );
        if ((skillCheck as any[]).length === 0) {
          throw new Error(`Skill with ID ${skill.skill_id} not found`);
        }

        // Verify proficiency level exists
        const [levelCheck] = await connection.query(
          "SELECT id FROM proficiency_levels WHERE id = ?",
          [skill.required_proficiency_level_id]
        );
        if ((levelCheck as any[]).length === 0) {
          throw new Error(`Proficiency level with ID ${skill.required_proficiency_level_id} not found`);
        }

        // Insert role skill
        await connection.query(
          "INSERT INTO role_skills (role_id, skill_id, required_proficiency_level_id) VALUES (?, ?, ?)",
          [roleId, skill.skill_id, skill.required_proficiency_level_id]
        );
      }
    }

    await connection.commit();

    // Fetch the created role with skills
    const [rows] = await connection.query("SELECT * FROM roles WHERE id = ?", [roleId]);
    const role = (rows as any[])[0];

    const [skillRows] = await connection.query(
      `
      SELECT rs.*, s.id as skill_id, s.name as skill_name, s.description,
             pl.id as proficiency_level_id, pl.level_name, pl.numeric_value
      FROM role_skills rs
      JOIN skills s ON rs.skill_id = s.id
      JOIN proficiency_levels pl ON rs.required_proficiency_level_id = pl.id
      WHERE rs.role_id = ?
      ORDER BY s.name ASC
    `,
      [roleId]
    );

    res.status(201).json({
      ...role,
      skills: skillRows,
    });
  } catch (error: any) {
    await connection.rollback();
    console.error("Error creating role:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "Role name already exists" });
      return;
    }
    res.status(400).json({ error: error.message || "Failed to create role" });
  } finally {
    connection.release();
  }
};

// Update role with skills
export const updateRole: RequestHandler = async (req, res) => {
  const connection = await (getPool() as any).getConnection();
  try {
    const { id } = req.params;
    const { name, description, skills } = req.body as UpdateRoleRequest;

    // Start transaction
    await connection.beginTransaction();

    // Check if role exists
    const [roleCheck] = await connection.query("SELECT id FROM roles WHERE id = ?", [id]);
    if ((roleCheck as any[]).length === 0) {
      res.status(404).json({ error: "Role not found" });
      return;
    }

    // Update role basic info
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

    if (updates.length > 0) {
      values.push(id);
      const query = `UPDATE roles SET ${updates.join(", ")} WHERE id = ?`;
      await connection.query(query, values);
    }

    // Update skills if provided
    if (skills !== undefined && Array.isArray(skills)) {
      // Delete existing role skills
      await connection.query("DELETE FROM role_skills WHERE role_id = ?", [id]);

      // Insert new role skills
      for (const skill of skills) {
        if (!skill.skill_id || !skill.required_proficiency_level_id) {
          throw new Error("skill_id and required_proficiency_level_id are required for each skill");
        }

        // Verify skill exists
        const [skillCheck] = await connection.query(
          "SELECT id FROM skills WHERE id = ?",
          [skill.skill_id]
        );
        if ((skillCheck as any[]).length === 0) {
          throw new Error(`Skill with ID ${skill.skill_id} not found`);
        }

        // Verify proficiency level exists
        const [levelCheck] = await connection.query(
          "SELECT id FROM proficiency_levels WHERE id = ?",
          [skill.required_proficiency_level_id]
        );
        if ((levelCheck as any[]).length === 0) {
          throw new Error(`Proficiency level with ID ${skill.required_proficiency_level_id} not found`);
        }

        // Insert role skill
        await connection.query(
          "INSERT INTO role_skills (role_id, skill_id, required_proficiency_level_id) VALUES (?, ?, ?)",
          [id, skill.skill_id, skill.required_proficiency_level_id]
        );
      }
    }

    await connection.commit();

    // Fetch updated role with skills
    const [rows] = await connection.query("SELECT * FROM roles WHERE id = ?", [id]);
    const role = (rows as any[])[0];

    const [skillRows] = await connection.query(
      `
      SELECT rs.*, s.id as skill_id, s.name as skill_name, s.description,
             pl.id as proficiency_level_id, pl.level_name, pl.numeric_value
      FROM role_skills rs
      JOIN skills s ON rs.skill_id = s.id
      JOIN proficiency_levels pl ON rs.required_proficiency_level_id = pl.id
      WHERE rs.role_id = ?
      ORDER BY s.name ASC
    `,
      [id]
    );

    res.json({
      ...role,
      skills: skillRows,
    });
  } catch (error: any) {
    await connection.rollback();
    console.error("Error updating role:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "Role name already exists" });
      return;
    }
    res.status(400).json({ error: error.message || "Failed to update role" });
  } finally {
    connection.release();
  }
};

// Delete role
export const deleteRole: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    const [result] = await pool.query("DELETE FROM roles WHERE id = ?", [id]);

    if ((result as any).affectedRows === 0) {
      res.status(404).json({ error: "Role not found" });
      return;
    }

    res.json({ message: "Role deleted successfully" });
  } catch (error) {
    console.error("Error deleting role:", error);
    res.status(500).json({ error: "Failed to delete role" });
  }
};

router.get("/", getRoles);
router.get("/:id", getRole);
router.post("/", createRole);
router.put("/:id", updateRole);
router.delete("/:id", deleteRole);

export default router;
