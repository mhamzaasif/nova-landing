import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { initializeDatabase } from "./db";
import rolesRouter from "./routes/roles";
import skillsRouter from "./routes/skills";
import proficiencyLevelsRouter from "./routes/proficiency-levels";
import employeesRouter from "./routes/employees";
import assessmentsRouter from "./routes/assessments";
import employeeRolesRouter from "./routes/employee-roles";
import dashboardRouter from "./routes/dashboard";
import certificationsRouter from "./routes/certifications";
import trainingsRouter from "./routes/trainings";
import employeeCertificationsRouter from "./routes/employee-certifications";
import employeeTrainingRouter from "./routes/employee-training";

export async function createServer() {
  const app = express();

  // Initialize database (non-blocking, will warn if fails)
  await initializeDatabase();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // API routes
  app.use("/api/roles", rolesRouter);
  app.use("/api/skills", skillsRouter);
  app.use("/api/proficiency-levels", proficiencyLevelsRouter);
  app.use("/api/employees", employeesRouter);
  app.use("/api/employee-roles", employeeRolesRouter);
  app.use("/api/assessments", assessmentsRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/certifications", certificationsRouter);
  app.use("/api/trainings", trainingsRouter);
  app.use("/api/employee-certifications", employeeCertificationsRouter);
  app.use("/api/employee-training", employeeTrainingRouter);

  return app;
}
