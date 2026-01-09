import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Calendar,
  User,
  Briefcase,
  Trash2,
  Search,
  CheckCircle,
} from "lucide-react";
import type {
  Assessment,
  Employee,
  Role,
  Skill,
  ProficiencyLevel,
  CreateAssessmentRequest,
} from "@shared/api";
import AppLayout from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [employeeRoles, setEmployeeRoles] = useState<Record<number, Role[]>>(
    {},
  );
  const [skills, setSkills] = useState<Skill[]>([]);
  const [levels, setLevels] = useState<ProficiencyLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [assessmentDate, setAssessmentDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [comments, setComments] = useState<string>("");
  const [assessmentItems, setAssessmentItems] = useState<
    {
      skill_name: string;
      skill_id?: number;
      proficiency_level_id: string;
      required_proficiency_level_id?: number;
      required_level_name?: string;
    }[]
  >([{ skill_name: "", proficiency_level_id: "" }]);
  const [skillSearchQuery, setSkillSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Skill[]>([]);
  const [showSkillCreator, setShowSkillCreator] = useState<number | null>(null);
  const [newSkillName, setNewSkillName] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        assessmentsRes,
        employeesRes,
        rolesRes,
        skillsRes,
        levelsRes,
        empRolesRes,
      ] = await Promise.all([
        fetch("/api/assessments"),
        fetch("/api/employees"),
        fetch("/api/roles"),
        fetch("/api/skills"),
        fetch("/api/proficiency-levels"),
        fetch("/api/employee-roles"),
      ]);

      if (
        !assessmentsRes.ok ||
        !employeesRes.ok ||
        !rolesRes.ok ||
        !skillsRes.ok ||
        !levelsRes.ok ||
        !empRolesRes.ok
      ) {
        throw new Error("Failed to fetch data");
      }

      const [
        assessmentsData,
        employeesData,
        rolesData,
        skillsData,
        levelsData,
        empRolesData,
      ] = await Promise.all([
        assessmentsRes.json(),
        employeesRes.json(),
        rolesRes.json(),
        skillsRes.json(),
        levelsRes.json(),
        empRolesRes.json(),
      ]);

      setAssessments(assessmentsData);
      setEmployees(employeesData);
      setRoles(rolesData);
      setSkills(skillsData);
      setLevels(levelsData);

      // Build a map of employee roles
      const empRolesMap: Record<number, Role[]> = {};
      for (const employee of employeesData) {
        empRolesMap[employee.id] = [];
      }
      for (const empRole of empRolesData) {
        if (!empRolesMap[empRole.employee_id]) {
          empRolesMap[empRole.employee_id] = [];
        }
        const role = rolesData.find((r: any) => r.id === empRole.role_id);
        if (role) {
          empRolesMap[empRole.employee_id].push(role);
        }
      }
      setEmployeeRoles(empRolesMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getAvailableRolesForEmployee = (employeeId: string): Role[] => {
    if (!employeeId) return [];
    return employeeRoles[parseInt(employeeId)] || [];
  };

  const getSkillsForRole = (roleId: string) => {
    if (!roleId) return [];
    const role = roles.find((r) => r.id === parseInt(roleId));
    return role?.skills || [];
  };

  const handleAddItem = () => {
    setAssessmentItems([
      ...assessmentItems,
      { skill_name: "", proficiency_level_id: "" },
    ]);
  };

  const handleSearchSkills = async (query: string, itemIndex: number) => {
    setSkillSearchQuery(query);
    if (query.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/skills/search?query=${encodeURIComponent(query)}`,
      );
      if (!response.ok) throw new Error("Failed to search skills");
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      console.error("Error searching skills:", err);
      setSearchResults([]);
    }
  };

  const handleSelectSkill = (itemIndex: number, skill: Skill) => {
    const newItems = [...assessmentItems];

    // Check if this skill is in the role's required skills
    const roleSkills = getSkillsForRole(selectedRole);
    const roleSkill = roleSkills.find((rs: any) => rs.skill_id === skill.id);

    newItems[itemIndex] = {
      ...newItems[itemIndex],
      skill_name: skill.name,
      skill_id: skill.id,
      required_proficiency_level_id: roleSkill?.required_proficiency_level_id,
      required_level_name: roleSkill?.level_name,
    };
    setAssessmentItems(newItems);
    setSearchResults([]);
    setSkillSearchQuery("");
    setShowSkillCreator(null);
  };

  const handleCreateSkillInline = async (itemIndex: number) => {
    try {
      if (!newSkillName.trim()) {
        setError("Skill name is required");
        return;
      }

      const response = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSkillName,
          description: "",
        }),
      });

      if (!response.ok) throw new Error("Failed to create skill");
      const newSkill = await response.json();

      const newItems = [...assessmentItems];
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        skill_name: newSkill.name,
        skill_id: newSkill.id,
      };
      setAssessmentItems(newItems);

      await fetchData();

      setNewSkillName("");
      setShowSkillCreator(null);
      setSearchResults([]);
      setSkillSearchQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create skill");
    }
  };

  const handleRemoveItem = (index: number) => {
    setAssessmentItems(assessmentItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (
    index: number,
    field: "skill_name" | "proficiency_level_id",
    value: string,
  ) => {
    const newItems = [...assessmentItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setAssessmentItems(newItems);
  };

  const handleEmployeeSelected = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    setSelectedRole("");
    setAssessmentItems([{ skill_name: "", proficiency_level_id: "" }]);
  };

  const handleRoleSelected = (roleId: string) => {
    setSelectedRole(roleId);

    if (roleId) {
      const roleSkills = getSkillsForRole(roleId);
      if (roleSkills && roleSkills.length > 0) {
        // Auto-populate assessment items with role's required skills
        const items = roleSkills.map((rs: any) => ({
          skill_name: rs.skill_name,
          skill_id: rs.skill_id,
          proficiency_level_id: "",
          required_proficiency_level_id: rs.required_proficiency_level_id,
          required_level_name: rs.level_name,
        }));
        setAssessmentItems(items);
      } else {
        setAssessmentItems([{ skill_name: "", proficiency_level_id: "" }]);
      }
    } else {
      setAssessmentItems([{ skill_name: "", proficiency_level_id: "" }]);
    }
  };

  const handleCreateAssessment = async () => {
    try {
      if (!selectedEmployee) {
        setError("Please select an employee");
        return;
      }

      if (!selectedRole) {
        setError("Please select a role");
        return;
      }

      if (
        assessmentItems.some(
          (item) => !item.skill_name || !item.proficiency_level_id,
        )
      ) {
        setError("Please fill in all skill proficiencies");
        return;
      }

      const payload: CreateAssessmentRequest = {
        employee_id: parseInt(selectedEmployee),
        role_id: parseInt(selectedRole),
        date: assessmentDate,
        comments: comments || undefined,
        items: assessmentItems.map((item) => ({
          skill_name: item.skill_name,
          skill_id: item.skill_id,
          proficiency_level_id: parseInt(item.proficiency_level_id),
          required_proficiency_level_id: item.required_proficiency_level_id,
        })),
      };

      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create assessment");
      }

      await fetchData();
      resetForm();
      setOpenDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const resetForm = () => {
    setSelectedEmployee("");
    setSelectedRole("");
    setAssessmentDate(new Date().toISOString().split("T")[0]);
    setComments("");
    setAssessmentItems([{ skill_name: "", proficiency_level_id: "" }]);
    setError(null);
    setSkillSearchQuery("");
    setSearchResults([]);
    setShowSkillCreator(null);
    setNewSkillName("");
  };

  const handleDeleteAssessment = async (id: number) => {
    if (confirm("Are you sure you want to delete this assessment?")) {
      try {
        const response = await fetch(`/api/assessments/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete assessment");
        await fetchData();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Assessments</h1>
            <p className="text-muted-foreground">
              Create and view employee assessments against assigned roles
            </p>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Assessment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Assessment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Employee Selection */}
                <div>
                  <Label htmlFor="employee">
                    Employee <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={selectedEmployee}
                    onValueChange={handleEmployeeSelected}
                  >
                    <SelectTrigger id="employee">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Role Selection - Only shows roles assigned to the employee */}
                <div>
                  <Label htmlFor="role">
                    Role <span className="text-destructive">*</span>
                  </Label>
                  {selectedEmployee ? (
                    <Select
                      value={selectedRole}
                      onValueChange={handleRoleSelected}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableRolesForEmployee(selectedEmployee).length >
                        0 ? (
                          getAvailableRolesForEmployee(selectedEmployee).map(
                            (role) => (
                              <SelectItem
                                key={role.id}
                                value={role.id.toString()}
                              >
                                {role.name}
                              </SelectItem>
                            ),
                          )
                        ) : (
                          <SelectItem value="" disabled>
                            No roles assigned to this employee
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select>
                      <SelectTrigger id="role" disabled>
                        <SelectValue placeholder="Select employee first" />
                      </SelectTrigger>
                    </Select>
                  )}
                  {selectedEmployee &&
                    getAvailableRolesForEmployee(selectedEmployee).length ===
                      0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        This employee has no assigned roles. Assign roles in the
                        Employee Assignments page.
                      </p>
                    )}
                </div>

                <div>
                  <Label htmlFor="date">Assessment Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={assessmentDate}
                    onChange={(e) => setAssessmentDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="comments">Comments (Optional)</Label>
                  <Textarea
                    id="comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Add any comments about this assessment"
                    rows={2}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Assessment Items</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddItem}
                      disabled={!selectedRole}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {assessmentItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex gap-2 items-end p-3 border rounded-lg bg-muted/30"
                      >
                        <div className="flex-1">
                          <Label className="text-xs mb-1 block">Skill</Label>
                          {item.skill_name ? (
                            <div className="flex items-center gap-2 p-2 rounded bg-accent/20 border border-accent/30">
                              <CheckCircle className="h-4 w-4 text-accent" />
                              <div className="flex-1">
                                <span className="text-sm font-medium">
                                  {item.skill_name}
                                </span>
                                {item.required_level_name && (
                                  <p className="text-xs text-muted-foreground">
                                    Required: {item.required_level_name}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() =>
                                  handleUpdateItem(index, "skill_name", "")
                                }
                              >
                                ✕
                              </Button>
                            </div>
                          ) : showSkillCreator === index ? (
                            <div className="space-y-2">
                              <Input
                                value={newSkillName}
                                onChange={(e) =>
                                  setNewSkillName(e.target.value)
                                }
                                placeholder="Enter new skill name"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleCreateSkillInline(index)}
                                  className="flex-1"
                                >
                                  Create
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowSkillCreator(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Input
                                placeholder="Search or create skill"
                                value={skillSearchQuery}
                                onChange={(e) =>
                                  handleSearchSkills(e.target.value, index)
                                }
                              />
                              {skillSearchQuery && searchResults.length > 0 && (
                                <div className="border rounded-lg max-h-32 overflow-y-auto bg-white">
                                  {searchResults.map((skill) => (
                                    <button
                                      key={skill.id}
                                      onClick={() =>
                                        handleSelectSkill(index, skill)
                                      }
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                                    >
                                      {skill.name}
                                    </button>
                                  ))}
                                </div>
                              )}
                              {skillSearchQuery &&
                                searchResults.length === 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setShowSkillCreator(index)}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Create "{skillSearchQuery}"
                                  </Button>
                                )}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs mb-1 block">
                            Proficiency
                          </Label>
                          <Select
                            value={item.proficiency_level_id}
                            onValueChange={(value) =>
                              handleUpdateItem(
                                index,
                                "proficiency_level_id",
                                value,
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {levels.map((level) => (
                                <SelectItem
                                  key={level.id}
                                  value={level.id.toString()}
                                >
                                  {level.level_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpenDialog(false);
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateAssessment}>
                  Create Assessment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assessment History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : assessments.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <p>
                  No assessments yet. Create your first assessment to get
                  started.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {assessments.map((assessment) => (
                  <Card key={assessment.id} className="border-muted">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">
                              Employee
                            </p>
                            <p className="font-medium text-foreground">
                              {assessment.employee_name || "Unknown"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">
                              Role
                            </p>
                            <p className="font-medium text-foreground">
                              {assessment.role_name || "Unknown"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">
                              Date
                            </p>
                            <p className="font-medium text-foreground">
                              {new Date(assessment.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDeleteAssessment(assessment.id)
                            }
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      {assessment.comments && (
                        <p className="text-sm text-muted-foreground mb-3 p-2 bg-muted/30 rounded">
                          {assessment.comments}
                        </p>
                      )}

                      {assessment.items && assessment.items.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Skills Assessed:
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {assessment.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="text-xs p-2 rounded bg-accent/10 border border-accent/20"
                              >
                                <p className="font-medium">{item.skill_name}</p>
                                <p className="text-muted-foreground">
                                  Actual: {item.level_name}
                                </p>
                                {item.required_level_name && (
                                  <p className="text-muted-foreground">
                                    Required: {item.required_level_name}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
