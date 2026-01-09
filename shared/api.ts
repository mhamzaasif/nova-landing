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
  required_proficiency_level_id?: number;
  proficiency_level?: ProficiencyLevel;
  required_proficiency_level?: ProficiencyLevel;
  level_name?: string;
  required_level_name?: string;
  numeric_value?: number;
  required_numeric_value?: number;
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
    required_proficiency_level_id?: number;
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

// Dashboard Views
export interface RoleRequirement {
  role_id: number;
  skill_id: number;
  skill_name: string;
  required_level_order: number;
}

export interface LatestAssessment {
  employee_id: number;
  role_id: number;
  assessment_date: string;
  skill_id: number;
  skill_name: string;
  actual_level_order: number;
}

export interface CompetencyDelta {
  employee_id: number;
  role_id: number;
  skill_id: number;
  skill_name: string;
  required_level_order: number;
  actual_level_order: number;
  gap: number;
}

export interface RoleReadiness {
  employee_id: number;
  role_id: number;
  readiness_index: number;
  employee_name?: string;
  role_name?: string;
  department?: string;
}

export interface GapAnalysis {
  role_name: string;
  skill_name: string;
  employee_count: number;
  avg_gap: number;
  max_gap: number;
  min_gap: number;
}

export interface TrainingNeed {
  employee_id: number;
  employee_name: string;
  department: string;
  role_id: number;
  role_name: string;
  skills_with_gap: number;
  total_gap: number;
  avg_gap: number;
}

// Certifications
export interface Certification {
  id: number;
  name: string;
  description: string;
  issuing_body: string;
  is_critical: boolean;
  renewal_period_months?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCertificationRequest {
  name: string;
  description: string;
  issuing_body: string;
  is_critical?: boolean;
  renewal_period_months?: number;
}

export interface UpdateCertificationRequest {
  name?: string;
  description?: string;
  issuing_body?: string;
  is_critical?: boolean;
  renewal_period_months?: number;
}

// Employee Certifications
export interface EmployeeCertification {
  id: number;
  employee_id: number;
  certification_id: number;
  issue_date: string;
  expiry_date?: string;
  certification?: Certification;
  employee?: Employee;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEmployeeCertificationRequest {
  employee_id: number;
  certification_id: number;
  issue_date: string;
  expiry_date?: string;
}

export interface UpdateEmployeeCertificationRequest {
  issue_date?: string;
  expiry_date?: string;
}

// Trainings
export interface Training {
  id: number;
  name: string;
  description: string;
  provider: string;
  duration_hours: number;
  skill_id?: number;
  skill?: Skill;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTrainingRequest {
  name: string;
  description: string;
  provider: string;
  duration_hours: number;
  skill_id?: number;
}

export interface UpdateTrainingRequest {
  name?: string;
  description?: string;
  provider?: string;
  duration_hours?: number;
  skill_id?: number;
}

// Employee Training
export interface EmployeeTraining {
  id: number;
  employee_id: number;
  training_id: number;
  completed_date?: string;
  status: "pending" | "in_progress" | "completed";
  notes?: string;
  training?: Training;
  employee?: Employee;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEmployeeTrainingRequest {
  employee_id: number;
  training_id: number;
  completed_date?: string;
  status?: "pending" | "in_progress" | "completed";
  notes?: string;
}

export interface UpdateEmployeeTrainingRequest {
  completed_date?: string;
  status?: "pending" | "in_progress" | "completed";
  notes?: string;
}

// Dashboard Matrices
export interface InitialAssessment {
  employee_id: number;
  employee_name: string;
  department: string;
  role_id: number;
  role_name: string;
  assessment_date: string;
  total_skills_assessed: number;
  avg_proficiency: number;
}

export interface SkillsInventory {
  skill_id: number;
  skill_name: string;
  total_employees: number;
  avg_proficiency: number;
  employees_by_level: Record<number, number>;
  departments: string[];
}

export interface LearningPathRecommendation {
  employee_id: number;
  employee_name: string;
  role_id: number;
  role_name: string;
  skill_id: number;
  skill_name: string;
  current_level: number;
  target_level: number;
  gap: number;
  recommended_trainings: {
    training_id: number;
    training_name: string;
    provider: string;
    duration_hours: number;
  }[];
  priority: "high" | "medium" | "low";
}

export interface TeamCapability {
  department: string;
  role_id: number;
  role_name: string;
  total_employees: number;
  avg_readiness: number;
  ready_count: number;
  not_ready_count: number;
}

export interface SuccessionCandidate {
  role_id: number;
  role_name: string;
  employee_id: number;
  employee_name: string;
  department: string;
  readiness_index: number;
  key_skills_covered: number;
  total_skills_required: number;
  coverage_percentage: number;
  potential_rating: "high" | "medium" | "low";
}

export interface ResourceAllocation {
  role_id: number;
  role_name: string;
  required_employees: number;
  current_employees: number;
  gap: number;
  avg_readiness: number;
  recommended_actions: string[];
  critical_skills_gaps: {
    skill_name: string;
    employees_needed: number;
  }[];
}

export interface CertificationTracking {
  employee_id: number;
  employee_name: string;
  department: string;
  certification_id: number;
  cert_name: string;
  is_critical: boolean;
  issue_date: string;
  expiry_date?: string;
  days_until_expiry?: number;
  status: "valid" | "expiring_soon" | "expired" | "missing";
}
