import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Trash2, User, Briefcase } from "lucide-react";
import type {
  Employee,
  Role,
  EmployeeRole,
  CreateEmployeeRoleRequest,
} from "@shared/api";
import AppLayout from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";

export default function EmployeeAssignmentsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [employeeRoles, setEmployeeRoles] = useState<EmployeeRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [assignedDate, setAssignedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [employeesRes, rolesRes, assignmentsRes] = await Promise.all([
        fetch("/api/employees"),
        fetch("/api/roles"),
        fetch("/api/employee-roles"),
      ]);

      if (!employeesRes.ok || !rolesRes.ok || !assignmentsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const [employeesData, rolesData, assignmentsData] = await Promise.all([
        employeesRes.json(),
        rolesRes.json(),
        assignmentsRes.json(),
      ]);

      setEmployees(employeesData);
      setRoles(rolesData);
      setEmployeeRoles(assignmentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeRolesForEmployee = (employeeId: number) => {
    return employeeRoles.filter((er) => er.employee_id === employeeId);
  };

  const getRoleDetails = (roleId: number) => {
    return roles.find((r) => r.id === roleId);
  };

  const getAvailableRoles = (employeeId: number) => {
    const assignedRoleIds = getEmployeeRolesForEmployee(employeeId).map(
      (er) => er.role_id
    );
    return roles.filter((r) => !assignedRoleIds.includes(r.id));
  };

  const handleAssignRole = async () => {
    try {
      if (!selectedEmployee || !selectedRole) {
        setError("Please select both employee and role");
        return;
      }

      const payload: CreateEmployeeRoleRequest = {
        employee_id: parseInt(selectedEmployee),
        role_id: parseInt(selectedRole),
        assigned_date: assignedDate,
      };

      const response = await fetch("/api/employee-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to assign role");
      }

      await fetchData();
      resetForm();
      setOpenDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleUnassignRole = async (id: number) => {
    if (confirm("Are you sure you want to unassign this role?")) {
      try {
        const response = await fetch(`/api/employee-roles/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to unassign role");
        await fetchData();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    }
  };

  const resetForm = () => {
    setSelectedEmployee("");
    setSelectedRole("");
    setAssignedDate(new Date().toISOString().split("T")[0]);
    setError(null);
  };

  const handleOpenDialog = () => {
    resetForm();
    setOpenDialog(true);
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Employee Assignments</h1>
            <p className="text-muted-foreground">
              Assign roles to employees in your organization
            </p>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Assign Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Role to Employee</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="employee">Employee</Label>
                  <Select
                    value={selectedEmployee}
                    onValueChange={setSelectedEmployee}
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

                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={selectedRole}
                    onValueChange={setSelectedRole}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedEmployee
                        ? getAvailableRoles(parseInt(selectedEmployee)).map(
                            (role) => (
                              <SelectItem
                                key={role.id}
                                value={role.id.toString()}
                              >
                                {role.name}
                              </SelectItem>
                            )
                          )
                        : roles.map((role) => (
                            <SelectItem
                              key={role.id}
                              value={role.id.toString()}
                            >
                              {role.name}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="date">Assigned Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={assignedDate}
                    onChange={(e) => setAssignedDate(e.target.value)}
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpenDialog(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleAssignRole}>Assign Role</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Employee Assignments List */}
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : employees.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <p>No employees found. Create employees first.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            employees.map((employee) => {
              const empRoles = getEmployeeRolesForEmployee(employee.id);
              return (
                <Card key={employee.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{employee.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {employee.email} • {employee.department}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {empRoles.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No roles assigned yet
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {empRoles.map((empRole) => {
                          const roleDetails = getRoleDetails(empRole.role_id);
                          return (
                            <div
                              key={empRole.id}
                              className="p-3 rounded-lg border border-muted bg-muted/30 flex items-start justify-between"
                            >
                              <div className="flex items-start gap-2 flex-1">
                                <Briefcase className="h-4 w-4 text-muted-foreground mt-1" />
                                <div className="flex-1">
                                  <p className="font-medium text-sm">
                                    {roleDetails?.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {roleDetails?.skills
                                      ? `${roleDetails.skills.length} skills`
                                      : "No skills defined"}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Assigned: {new Date(empRole.assigned_date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnassignRole(empRole.id)}
                                className="h-6 w-6 p-0 ml-2"
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
