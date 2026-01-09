import mysql from "mysql2/promise";

// Global pool instance
let globalPool: mysql.Pool | null = null;

// Create the database pool (called once during initialization)
async function createDatabasePool() {
  if (globalPool) return globalPool;

  const dbName = process.env.DB_NAME || "compatibility_matrix";

  // First, try to create database with a temporary pool
  try {
    const tempPool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0,
    });

    const connection = await tempPool.getConnection();
    try {
      await connection.execute(
        `CREATE DATABASE IF NOT EXISTS \`${dbName}\``
      );
    } finally {
      connection.release();
    }

    await tempPool.end();
  } catch (err) {
    console.warn("Warning: Could not create database. Make sure MySQL is running.");
  }

  // Create the main pool with the database
  globalPool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return globalPool;
}

export async function initializeDatabase() {
  try {
    // Ensure the pool is created first
    await createDatabasePool();
    const db = getPool();
    const connection = await db.getConnection();
    try {
      // Create tables if they don't exist
      const tables = [
        `
        CREATE TABLE IF NOT EXISTS roles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
        `,
        `
        CREATE TABLE IF NOT EXISTS skills (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
        `,
        `
        CREATE TABLE IF NOT EXISTS proficiency_levels (
          id INT AUTO_INCREMENT PRIMARY KEY,
          level_name VARCHAR(255) NOT NULL UNIQUE,
          numeric_value INT NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
        `,
        `
        CREATE TABLE IF NOT EXISTS employees (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          department VARCHAR(255),
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
        `,
        `
        CREATE TABLE IF NOT EXISTS assessments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          employee_id INT NOT NULL,
          role_id INT NOT NULL,
          date DATE NOT NULL,
          comments TEXT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
          FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
          UNIQUE KEY unique_employee_role_date (employee_id, role_id, date)
        )
        `,
        `
        CREATE TABLE IF NOT EXISTS assessment_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          assessment_id INT NOT NULL,
          skill_id INT,
          skill_name VARCHAR(255) NOT NULL,
          proficiency_level_id INT NOT NULL,
          required_proficiency_level_id INT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
          FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE SET NULL,
          FOREIGN KEY (proficiency_level_id) REFERENCES proficiency_levels(id) ON DELETE RESTRICT,
          FOREIGN KEY (required_proficiency_level_id) REFERENCES proficiency_levels(id) ON DELETE SET NULL
        )
        `,
        `
        CREATE TABLE IF NOT EXISTS role_skills (
          id INT AUTO_INCREMENT PRIMARY KEY,
          role_id INT NOT NULL,
          skill_id INT NOT NULL,
          required_proficiency_level_id INT NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
          FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
          FOREIGN KEY (required_proficiency_level_id) REFERENCES proficiency_levels(id) ON DELETE RESTRICT,
          UNIQUE KEY unique_role_skill (role_id, skill_id)
        )
        `,
        `
        CREATE TABLE IF NOT EXISTS employee_roles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          employee_id INT NOT NULL,
          role_id INT NOT NULL,
          assigned_date DATE NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
          FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
          UNIQUE KEY unique_employee_role (employee_id, role_id)
        )
        `,
        `
        CREATE TABLE IF NOT EXISTS certifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          issuing_body VARCHAR(255),
          is_critical BOOLEAN DEFAULT FALSE,
          renewal_period_months INT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
        `,
        `
        CREATE TABLE IF NOT EXISTS employee_certifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          employee_id INT NOT NULL,
          certification_id INT NOT NULL,
          issue_date DATE NOT NULL,
          expiry_date DATE,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
          FOREIGN KEY (certification_id) REFERENCES certifications(id) ON DELETE CASCADE,
          UNIQUE KEY unique_employee_cert (employee_id, certification_id)
        )
        `,
        `
        CREATE TABLE IF NOT EXISTS trainings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          provider VARCHAR(255),
          duration_hours INT,
          skill_id INT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE SET NULL
        )
        `,
        `
        CREATE TABLE IF NOT EXISTS employee_training (
          id INT AUTO_INCREMENT PRIMARY KEY,
          employee_id INT NOT NULL,
          training_id INT NOT NULL,
          completed_date DATE,
          status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
          notes TEXT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
          FOREIGN KEY (training_id) REFERENCES trainings(id) ON DELETE CASCADE,
          UNIQUE KEY unique_employee_training (employee_id, training_id)
        )
        `,
      ];

      for (const table of tables) {
        await connection.execute(table);
      }

      console.log("✅ Database tables initialized successfully");

      // Create analytics views
      const views = [
        // View 1: Role Requirements
        `
        CREATE OR REPLACE VIEW vw_role_requirements AS
        SELECT rs.role_id, rs.skill_id, s.name AS skill_name,
               pl.numeric_value AS required_level_order
        FROM role_skills rs
        JOIN skills s ON s.id = rs.skill_id
        JOIN proficiency_levels pl ON pl.id = rs.required_proficiency_level_id
        `,

        // View 2: Latest Assessments
        `
        CREATE OR REPLACE VIEW vw_latest_assessments AS
        SELECT *
        FROM (
          SELECT af.*, ROW_NUMBER() OVER (
            PARTITION BY af.employee_id, af.role_id, af.skill_name
            ORDER BY af.assessment_date DESC
          ) AS rn
          FROM (
            SELECT a.employee_id, a.role_id, a.date AS assessment_date,
                   ai.skill_id, ai.skill_name, pl.numeric_value AS actual_level_order
            FROM assessments a
            JOIN assessment_items ai ON ai.assessment_id = a.id
            JOIN proficiency_levels pl ON pl.id = ai.proficiency_level_id
          ) af
        ) t WHERE t.rn = 1
        `,

        // View 3: Competency Delta
        `
        CREATE OR REPLACE VIEW vw_competency_delta AS
        SELECT er.employee_id, er.role_id, rr.skill_id, rr.skill_name,
               rr.required_level_order,
               COALESCE(la.actual_level_order, 0) AS actual_level_order,
               GREATEST(0, ROUND(rr.required_level_order - COALESCE(la.actual_level_order, 0))) AS gap
        FROM employee_roles er
        JOIN vw_role_requirements rr ON rr.role_id = er.role_id
        LEFT JOIN vw_latest_assessments la
               ON la.employee_id = er.employee_id
              AND la.role_id = er.role_id
              AND la.skill_name = rr.skill_name
        `,

        // View 4: Role Readiness
        `
        CREATE OR REPLACE VIEW vw_role_readiness AS
        SELECT employee_id, role_id,
               ROUND(AVG(LEAST(COALESCE(actual_level_order,0)/required_level_order,1)) * 100, 2) AS readiness_index
        FROM vw_competency_delta
        GROUP BY employee_id, role_id
        `,
      ];

      for (const view of views) {
        await connection.execute(view);
      }

      console.log("✅ Analytics views created successfully");
    } finally {
      connection.release();
    }
  } catch (error) {
    console.warn(
      "⚠️ Warning: Database initialization failed. Make sure you have a MySQL database running."
    );
    console.warn("Set the following environment variables:");
    console.warn("  DB_HOST - MySQL host (default: localhost)");
    console.warn("  DB_USER - MySQL user (default: root)");
    console.warn("  DB_PASSWORD - MySQL password");
    console.warn("  DB_NAME - Database name (default: compatibility_matrix)");
    console.warn("\nError details:", error);
  }
}

export function getPool() {
  if (!globalPool) {
    throw new Error("Database pool not initialized. Call initializeDatabase first.");
  }
  return globalPool;
}

export async function closePool() {
  if (globalPool) {
    await globalPool.end();
    globalPool = null;
  }
}
