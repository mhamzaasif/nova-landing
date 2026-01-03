import "dotenv/config";
import { getPool, initializeDatabase } from "./db";

async function seedDatabase() {
  try {
    console.log("🌱 Seeding database...");

    // Initialize database tables first
    await initializeDatabase();

    const pool = getPool();

    // Seed Proficiency Levels
    console.log("📊 Seeding proficiency levels...");
    const proficiencyLevels = [
      { level_name: "Beginner", numeric_value: 1 },
      { level_name: "Intermediate", numeric_value: 2 },
      { level_name: "Advanced", numeric_value: 3 },
      { level_name: "Expert", numeric_value: 4 },
      { level_name: "Master", numeric_value: 5 },
    ];

    for (const level of proficiencyLevels) {
      try {
        await pool.query(
          `INSERT IGNORE INTO proficiency_levels (level_name, numeric_value)
           VALUES (?, ?)`,
          [level.level_name, level.numeric_value]
        );
      } catch (err) {
        // Ignore duplicates
      }
    }

    // Seed Skills
    console.log("🎯 Seeding skills...");
    const skillsList = [
      { name: "JavaScript", description: "Core JavaScript programming language" },
      { name: "React", description: "React.js frontend library" },
      { name: "Node.js", description: "Node.js runtime and server-side development" },
      { name: "TypeScript", description: "TypeScript - superset of JavaScript" },
      { name: "CSS", description: "Cascading Style Sheets" },
      { name: "HTML", description: "HyperText Markup Language" },
      { name: "Database Design", description: "Database architecture and design" },
      { name: "SQL", description: "Structured Query Language" },
      { name: "Express.js", description: "Express.js web framework" },
      { name: "RESTful APIs", description: "REST API design and implementation" },
      { name: "Problem Solving", description: "Problem-solving and algorithmic skills" },
      { name: "Communication", description: "Communication and team collaboration" },
    ];

    for (const skill of skillsList) {
      try {
        await pool.query(
          `INSERT IGNORE INTO skills (name, description)
           VALUES (?, ?)`,
          [skill.name, skill.description]
        );
      } catch (err) {
        // Ignore duplicates
      }
    }

    // Seed Roles
    console.log("🎯 Seeding roles...");
    const roles = [
      {
        name: "Frontend Engineer",
        description: "Develops user-facing web applications using React, Vue, or Angular",
      },
      {
        name: "Backend Engineer",
        description: "Develops server-side applications and APIs",
      },
      {
        name: "Full Stack Engineer",
        description: "Develops both frontend and backend components",
      },
      {
        name: "DevOps Engineer",
        description: "Manages infrastructure, deployment, and system reliability",
      },
      {
        name: "Product Manager",
        description: "Defines product strategy and roadmap",
      },
    ];

    for (const role of roles) {
      try {
        await pool.query(
          `INSERT IGNORE INTO roles (name, description)
           VALUES (?, ?)`,
          [role.name, role.description]
        );
      } catch (err) {
        // Ignore duplicates
      }
    }

    // Seed Employees
    console.log("👥 Seeding employees...");
    const employees = [
      {
        name: "Alice Johnson",
        email: "alice@example.com",
        department: "Engineering",
      },
      {
        name: "Bob Smith",
        email: "bob@example.com",
        department: "Engineering",
      },
      {
        name: "Carol Williams",
        email: "carol@example.com",
        department: "Product",
      },
      {
        name: "David Brown",
        email: "david@example.com",
        department: "DevOps",
      },
      {
        name: "Emma Davis",
        email: "emma@example.com",
        department: "Engineering",
      },
    ];

    for (const employee of employees) {
      try {
        await pool.query(
          `INSERT IGNORE INTO employees (name, email, department)
           VALUES (?, ?, ?)`,
          [employee.name, employee.email, employee.department]
        );
      } catch (err) {
        // Ignore duplicates
      }
    }

    // Seed Assessments
    console.log("📋 Seeding assessments...");
    const [rolesData] = await pool.query("SELECT id, name FROM roles LIMIT 2");
    const [employeesData] = await pool.query("SELECT id FROM employees LIMIT 3");
    const [levelsData] = await pool.query("SELECT id FROM proficiency_levels");

    if (
      (rolesData as any[]).length > 0 &&
      (employeesData as any[]).length > 0 &&
      (levelsData as any[]).length > 0
    ) {
      const role = (rolesData as any[])[0];
      const employee = (employeesData as any[])[0];
      const levels = (levelsData as any[]).slice(0, 3);

      // Create a few assessments with sample data
      const assessmentDates = [
        new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      ];

      for (const date of assessmentDates) {
        try {
          const dateStr = date.toISOString().split("T")[0];
          const [result] = await pool.query(
            `INSERT INTO assessments (employee_id, role_id, date, comments)
             VALUES (?, ?, ?, ?)`,
            [
              employee.id,
              role.id,
              dateStr,
              "Regular performance assessment",
            ]
          );

          const assessmentId = (result as any).insertId;

          // Add assessment items
          for (let i = 0; i < 3; i++) {
            const skills = ["JavaScript", "React", "Node.js", "TypeScript", "CSS"];
            const skillIndex = i % skills.length;
            const level = levels[i % levels.length];

            await pool.query(
              `INSERT INTO assessment_items (assessment_id, skill_name, proficiency_level_id)
               VALUES (?, ?, ?)`,
              [assessmentId, skills[skillIndex], level.id]
            );
          }
        } catch (err) {
          // Ignore errors (might be duplicates)
        }
      }
    }

    console.log("✅ Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
