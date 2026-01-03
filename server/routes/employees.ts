import { Router, RequestHandler } from "express";
import { getPool } from "../db";
import type {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
} from "@shared/api";

const router = Router();

// Get all employees
export const getEmployees: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      "SELECT * FROM employees ORDER BY name ASC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
};

// Get single employee
export const getEmployee: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM employees WHERE id = ?", [
      id,
    ]);
    const employee = (rows as any[])[0];

    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    res.json(employee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({ error: "Failed to fetch employee" });
  }
};

// Create employee
export const createEmployee: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { name, email, department } = req.body as CreateEmployeeRequest;

    if (!name || !email) {
      res.status(400).json({ error: "Name and email are required" });
      return;
    }

    const [result] = await pool.query(
      "INSERT INTO employees (name, email, department) VALUES (?, ?, ?)",
      [name, email, department || null]
    );

    const insertId = (result as any).insertId;
    const [rows] = await pool.query("SELECT * FROM employees WHERE id = ?", [
      insertId,
    ]);
    const employee = (rows as any[])[0];

    res.status(201).json(employee);
  } catch (error: any) {
    console.error("Error creating employee:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "Email already exists" });
      return;
    }
    res.status(500).json({ error: "Failed to create employee" });
  }
};

// Update employee
export const updateEmployee: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { name, email, department } = req.body as UpdateEmployeeRequest;

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }

    if (email !== undefined) {
      updates.push("email = ?");
      values.push(email);
    }

    if (department !== undefined) {
      updates.push("department = ?");
      values.push(department);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    values.push(id);
    const query = `UPDATE employees SET ${updates.join(", ")} WHERE id = ?`;

    await pool.query(query, values);

    const [rows] = await pool.query("SELECT * FROM employees WHERE id = ?", [
      id,
    ]);
    const employee = (rows as any[])[0];

    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    res.json(employee);
  } catch (error: any) {
    console.error("Error updating employee:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "Email already exists" });
      return;
    }
    res.status(500).json({ error: "Failed to update employee" });
  }
};

// Delete employee
export const deleteEmployee: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    const [result] = await pool.query("DELETE FROM employees WHERE id = ?", [
      id,
    ]);

    if ((result as any).affectedRows === 0) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(500).json({ error: "Failed to delete employee" });
  }
};

router.get("/", getEmployees);
router.get("/:id", getEmployee);
router.post("/", createEmployee);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;
