/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

// Example response type for /api/demo
export interface DemoResponse {
  message: string;
}

// Roles
export interface RoleSkill {
  id: number;
  role_id: number;
  skill_id: number;
  required_proficiency_level_id: number;
  skill?: Skill;
  proficiency_level?: ProficiencyLevel;
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  skills?: RoleSkill[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  skills?: {
    skill_id: number;
    required_proficiency_level_id: number;
  }[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  skills?: {
    skill_id: number;
    required_proficiency_level_id: number;
  }[];
}

// Proficiency Levels
export interface ProficiencyLevel {
  id: number;
  level_name: string;
  numeric_value: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProficiencyLevelRequest {
  level_name: string;
  numeric_value: number;
}

export interface UpdateProficiencyLevelRequest {
  level_name?: string;
  numeric_value?: number;
}

// Employees
export interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEmployeeRequest {
  name: string;
  email: string;
  department: string;
}

export interface UpdateEmployeeRequest {
  name?: string;
  email?: string;
  department?: string;
}

// Employee Roles
export interface EmployeeRole {
  id: number;
  employee_id: number;
  role_id: number;
  assigned_date: string;
  employee?: Employee;
  role?: Role;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEmployeeRoleRequest {
  employee_id: number;
  role_id: number;
  assigned_date: string;
}

export interface UpdateEmployeeRoleRequest {
  assigned_date?: string;
}

// Skills
export interface Skill {
  id: number;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSkillRequest {
  name: string;
  description: string;
}

export interface UpdateSkillRequest {
  name?: string;
  description?: string;
}

// Assessments
export interface Assessment {
  id: number;
  employee_id: number;
  role_id: number;
  assessment_type?: "employee" | "role";
  date: string;
  comments: string;
  employee?: Employee;
  employee_name?: string;
  role?: Role;
  role_name?: string;
  items?: AssessmentItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AssessmentItem {
  id: number;
  assessment_id: number;
  skill_name: string;
  skill_id?: number;
  proficiency_level_id: number;
  proficiency_level?: ProficiencyLevel;
  level_name?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAssessmentRequest {
  employee_id: number;
  role_id: number;
  assessment_type?: "employee" | "role";
  date: string;
  comments?: string;
  items: {
    skill_name: string;
    skill_id?: number;
    proficiency_level_id: number;
  }[];
}

// Analytics
export interface TrendData {
  date: string;
  proficiency: number;
  employeeName?: string;
}

export interface AnalyticsTrends {
  general: TrendData[];
  employees: Record<number, { employee: Employee; trends: TrendData[] }>;
}
