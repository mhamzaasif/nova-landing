import { Router, RequestHandler } from "express";
import { getPool } from "../db";
import type {
  EmployeeRole,
  CreateEmployeeRoleRequest,
  UpdateEmployeeRoleRequest,
} from "@shared/api";

const router = Router();

// Get all employee role assignments
export const getEmployeeRoles: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT er.*, e.name as employee_name, r.name as role_name
      FROM employee_roles er
      JOIN employees e ON er.employee_id = e.id
      JOIN roles r ON er.role_id = r.id
      ORDER BY e.name, r.name ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching employee roles:", error);
    res.status(500).json({ error: "Failed to fetch employee roles" });
  }
};

// Get employee roles by employee ID
export const getEmployeeRolesByEmployeeId: RequestHandler = async (
  req,
  res
) => {
  try {
    const pool = getPool();
    const { employeeId } = req.params;
    const [rows] = await pool.query(
      `
      SELECT er.*, e.name as employee_name, r.name as role_name, r.description
      FROM employee_roles er
      JOIN employees e ON er.employee_id = e.id
      JOIN roles r ON er.role_id = r.id
      WHERE er.employee_id = ?
      ORDER BY r.name ASC
    `,
      [employeeId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching employee roles:", error);
    res.status(500).json({ error: "Failed to fetch employee roles" });
  }
};

// Get roles assigned to an employee
export const getRolesByEmployeeId: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { employeeId } = req.params;
    const [rows] = await pool.query(
      `
      SELECT DISTINCT r.*
      FROM roles r
      JOIN employee_roles er ON r.id = er.role_id
      WHERE er.employee_id = ?
      ORDER BY r.name ASC
    `,
      [employeeId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching assigned roles:", error);
    res.status(500).json({ error: "Failed to fetch assigned roles" });
  }
};

// Create employee role assignment
export const createEmployeeRole: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { employee_id, role_id, assigned_date } =
      req.body as CreateEmployeeRoleRequest;

    // Validation
    if (!employee_id || !role_id || !assigned_date) {
      res
        .status(400)
        .json({
          error: "employee_id, role_id, and assigned_date are required",
        });
      return;
    }

    // Check if employee exists
    const [employeeRows] = await pool.query(
      "SELECT id FROM employees WHERE id = ?",
      [employee_id]
    );
    if ((employeeRows as any[]).length === 0) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    // Check if role exists
    const [roleRows] = await pool.query("SELECT id FROM roles WHERE id = ?", [
      role_id,
    ]);
    if ((roleRows as any[]).length === 0) {
      res.status(404).json({ error: "Role not found" });
      return;
    }

    // Create the assignment
    const [result] = await pool.query(
      "INSERT INTO employee_roles (employee_id, role_id, assigned_date) VALUES (?, ?, ?)",
      [employee_id, role_id, assigned_date]
    );

    const insertId = (result as any).insertId;
    const [rows] = await pool.query(
      `
      SELECT er.*, e.name as employee_name, r.name as role_name
      FROM employee_roles er
      JOIN employees e ON er.employee_id = e.id
      JOIN roles r ON er.role_id = r.id
      WHERE er.id = ?
    `,
      [insertId]
    );
    const employeeRole = (rows as any[])[0];

    res.status(201).json(employeeRole);
  } catch (error: any) {
    console.error("Error creating employee role:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res
        .status(400)
        .json({
          error: "This role is already assigned to this employee",
        });
      return;
    }
    res.status(500).json({ error: "Failed to create employee role" });
  }
};

// Delete employee role assignment
export const deleteEmployeeRole: RequestHandler = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    const [result] = await pool.query("DELETE FROM employee_roles WHERE id = ?", [
      id,
    ]);

    if ((result as any).affectedRows === 0) {
      res.status(404).json({ error: "Employee role assignment not found" });
      return;
    }

    res.json({ message: "Employee role assignment deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee role:", error);
    res.status(500).json({ error: "Failed to delete employee role" });
  }
};

// Delete all role assignments for an employee (when unassigning a role)
export const deleteEmployeeRoleByEmployeeAndRole: RequestHandler = async (
  req,
  res
) => {
  try {
    const pool = getPool();
    const { employeeId, roleId } = req.params;

    const [result] = await pool.query(
      "DELETE FROM employee_roles WHERE employee_id = ? AND role_id = ?",
      [employeeId, roleId]
    );

    if ((result as any).affectedRows === 0) {
      res.status(404).json({ error: "Employee role assignment not found" });
      return;
    }

    res.json({ message: "Role unassigned successfully" });
  } catch (error) {
    console.error("Error unassigning role:", error);
    res.status(500).json({ error: "Failed to unassign role" });
  }
};

router.get("/", getEmployeeRoles);
router.get("/by-employee/:employeeId", getEmployeeRolesByEmployeeId);
router.get("/assigned-roles/:employeeId", getRolesByEmployeeId);
router.post("/", createEmployeeRole);
router.delete("/:id", deleteEmployeeRole);
router.delete("/:employeeId/:roleId", deleteEmployeeRoleByEmployeeAndRole);

export default router;
