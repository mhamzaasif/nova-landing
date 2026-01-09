import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Plus, Trash2, Clock, CheckCircle2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import type {
  Employee,
  Certification,
  Training,
  EmployeeCertification,
  EmployeeTraining,
  EmployeeRole,
  Role,
} from "@shared/api";
import { toast } from "sonner";

interface EmployeeCertWithDetails extends EmployeeCertification {
  cert_name?: string;
  is_critical?: boolean;
}

interface EmployeeTrainWithDetails extends EmployeeTraining {
  training_name?: string;
  provider?: string;
  duration_hours?: number;
}

interface EmployeeRoleWithDetails extends EmployeeRole {
  role_name?: string;
}

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [roles, setRoles] = useState<EmployeeRoleWithDetails[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [employeeCerts, setEmployeeCerts] = useState<EmployeeCertWithDetails[]>([]);
  const [employeeTrainings, setEmployeeTrainings] = useState<EmployeeTrainWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCertAssignOpen, setIsCertAssignOpen] = useState(false);
  const [isTrainAssignOpen, setIsTrainAssignOpen] = useState(false);
  const [isTrainProgressOpen, setIsTrainProgressOpen] = useState(false);
  const [isCertDeleteOpen, setIsCertDeleteOpen] = useState(false);
  const [isTrainDeleteOpen, setIsTrainDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [certForm, setCertForm] = useState({
    certification_id: "",
    issue_date: new Date().toISOString().split("T")[0],
    expiry_date: "",
  });

  const [trainForm, setTrainForm] = useState({
    training_id: "",
    notes: "",
  });

  const [trainProgressForm, setTrainProgressForm] = useState({
    status: "" as "pending" | "in_progress" | "completed",
    completed_date: "",
    notes: "",
  });

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [empRes, rolesRes, certRes, trainRes, empCertRes, empTrainRes] =
        await Promise.all([
          fetch(`/api/employees`),
          fetch(`/api/employee-roles`),
          fetch("/api/certifications"),
          fetch("/api/trainings"),
          fetch(`/api/employee-certifications?employeeId=${id}`),
          fetch(`/api/employee-training/${id}`),
        ]);

      if (
        !empRes.ok ||
        !rolesRes.ok ||
        !certRes.ok ||
        !trainRes.ok ||
        !empCertRes.ok ||
        !empTrainRes.ok
      ) {
        throw new Error("Failed to fetch data");
      }

      const allEmployees = await empRes.json();
      const currentEmployee = allEmployees.find(
        (e: Employee) => e.id === parseInt(id!)
      );

      if (!currentEmployee) {
        setError("Employee not found");
        return;
      }

      setEmployee(currentEmployee);

      const allRoles = await rolesRes.json();
      const employeeRoles = allRoles.filter(
        (r: EmployeeRoleWithDetails) => r.employee_id === currentEmployee.id
      );
      setRoles(employeeRoles);

      setCertifications(await certRes.json());
      setTrainings(await trainRes.json());
      setEmployeeCerts(await empCertRes.json());
      setEmployeeTrainings(await empTrainRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCert = async () => {
    if (!certForm.certification_id || !certForm.issue_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch("/api/employee-certifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: parseInt(id!),
          certification_id: parseInt(certForm.certification_id),
          issue_date: certForm.issue_date,
          expiry_date: certForm.expiry_date || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to assign certification");

      toast.success("Certification assigned successfully");
      setCertForm({
        certification_id: "",
        issue_date: new Date().toISOString().split("T")[0],
        expiry_date: "",
      });
      setIsCertAssignOpen(false);
      fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to assign certification"
      );
    }
  };

  const handleAssignTrain = async () => {
    if (!trainForm.training_id) {
      toast.error("Please select a training");
      return;
    }

    try {
      const response = await fetch("/api/employee-training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: parseInt(id!),
          training_id: parseInt(trainForm.training_id),
          status: "pending",
          notes: trainForm.notes || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to assign training");

      toast.success("Training assigned successfully");
      setTrainForm({ training_id: "", notes: "" });
      setIsTrainAssignOpen(false);
      fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to assign training"
      );
    }
  };

  const handleUpdateTrainProgress = async () => {
    if (!selectedId || !trainProgressForm.status) {
      toast.error("Please select a status");
      return;
    }

    try {
      const response = await fetch(`/api/employee-training/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: trainProgressForm.status,
          completed_date:
            trainProgressForm.status === "completed"
              ? trainProgressForm.completed_date ||
                new Date().toISOString().split("T")[0]
              : null,
          notes: trainProgressForm.notes || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to update training");

      toast.success("Training progress updated successfully");
      setIsTrainProgressOpen(false);
      setTrainProgressForm({ status: "", completed_date: "", notes: "" });
      fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update training"
      );
    }
  };

  const handleDeleteCert = async () => {
    if (!selectedId) return;

    try {
      const response = await fetch(`/api/employee-certifications/${selectedId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to remove certification");

      toast.success("Certification removed successfully");
      setIsCertDeleteOpen(false);
      setSelectedId(null);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove certification");
    }
  };

  const handleDeleteTrain = async () => {
    if (!selectedId) return;

    try {
      const response = await fetch(`/api/employee-training/${selectedId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to remove training");

      toast.success("Training removed successfully");
      setIsTrainDeleteOpen(false);
      setSelectedId(null);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove training");
    }
  };

  const isExpired = (expiryDate: string | null | undefined) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const isExpiring = (expiryDate: string | null | undefined) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expiry <= thirtyDaysFromNow && expiry > now;
  };

  const openTrainProgressDialog = (item: EmployeeTrainWithDetails) => {
    setSelectedId(item.id);
    setTrainProgressForm({
      status: item.status,
      completed_date: item.completed_date || "",
      notes: item.notes || "",
    });
    setIsTrainProgressOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (error) {
    return (
      <AppLayout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6">
          <Skeleton className="h-12 w-full mb-6" />
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!employee) {
    return (
      <AppLayout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Employee not found</AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  const completedTrainings = employeeTrainings.filter(
    (t) => t.status === "completed"
  ).length;
  const pendingTrainings = employeeTrainings.filter(
    (t) => t.status === "pending"
  ).length;
  const validCerts = employeeCerts.filter(
    (c) => !isExpired(c.expiry_date)
  ).length;

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/employees")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Employees
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{employee.name}</h1>
              <p className="text-muted-foreground">{employee.email}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Department: {employee.department}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Assigned Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{roles.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valid Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{validCerts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                of {employeeCerts.length} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed Trainings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {completedTrainings}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                of {employeeTrainings.length} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Trainings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {pendingTrainings}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="roles" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="roles">Assigned Roles</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
            <TabsTrigger value="trainings">Trainings</TabsTrigger>
          </TabsList>

          {/* Roles Tab */}
          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <CardTitle>Assigned Roles</CardTitle>
              </CardHeader>
              <CardContent>
                {roles.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground">
                    <p>No roles assigned</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Role Name</TableHead>
                          <TableHead>Assigned Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {roles.map((role) => (
                          <TableRow key={role.id}>
                            <TableCell className="font-semibold">
                              {role.role_name}
                            </TableCell>
                            <TableCell>
                              {new Date(role.assigned_date).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certifications Tab */}
          <TabsContent value="certifications">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Certifications</CardTitle>
                <Dialog open={isCertAssignOpen} onOpenChange={setIsCertAssignOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Assign Certification
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign Certification</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="cert">Certification *</Label>
                        <Select
                          value={certForm.certification_id}
                          onValueChange={(value) =>
                            setCertForm({ ...certForm, certification_id: value })
                          }
                        >
                          <SelectTrigger id="cert">
                            <SelectValue placeholder="Select a certification" />
                          </SelectTrigger>
                          <SelectContent>
                            {certifications.map((cert) => (
                              <SelectItem key={cert.id} value={cert.id.toString()}>
                                {cert.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="cert_issue">Issue Date *</Label>
                        <Input
                          id="cert_issue"
                          type="date"
                          value={certForm.issue_date}
                          onChange={(e) =>
                            setCertForm({
                              ...certForm,
                              issue_date: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="cert_expiry">Expiry Date</Label>
                        <Input
                          id="cert_expiry"
                          type="date"
                          value={certForm.expiry_date}
                          onChange={(e) =>
                            setCertForm({
                              ...certForm,
                              expiry_date: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button onClick={handleAssignCert}>
                        Assign Certification
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {employeeCerts.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground">
                    <p>No certifications assigned</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Certification</TableHead>
                          <TableHead className="text-center">Issue Date</TableHead>
                          <TableHead className="text-center">Expiry Date</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employeeCerts.map((cert) => (
                          <TableRow key={cert.id}>
                            <TableCell className="font-semibold">
                              <div className="flex items-center gap-2">
                                {cert.cert_name}
                                {cert.is_critical && (
                                  <Badge variant="destructive">Critical</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {new Date(cert.issue_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-center">
                              {cert.expiry_date
                                ? new Date(cert.expiry_date).toLocaleDateString()
                                : "—"}
                            </TableCell>
                            <TableCell className="text-center">
                              {isExpired(cert.expiry_date) ? (
                                <Badge variant="destructive">Expired</Badge>
                              ) : isExpiring(cert.expiry_date) ? (
                                <Badge
                                  variant="outline"
                                  className="text-yellow-600 border-yellow-600"
                                >
                                  Expiring Soon
                                </Badge>
                              ) : (
                                <Badge variant="default">Valid</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedId(cert.id);
                                  setIsCertDeleteOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trainings Tab */}
          <TabsContent value="trainings">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Trainings</CardTitle>
                <Dialog open={isTrainAssignOpen} onOpenChange={setIsTrainAssignOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Assign Training
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign Training</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="train">Training *</Label>
                        <Select
                          value={trainForm.training_id}
                          onValueChange={(value) =>
                            setTrainForm({ ...trainForm, training_id: value })
                          }
                        >
                          <SelectTrigger id="train">
                            <SelectValue placeholder="Select a training" />
                          </SelectTrigger>
                          <SelectContent>
                            {trainings.map((train) => (
                              <SelectItem
                                key={train.id}
                                value={train.id.toString()}
                              >
                                {train.name} ({train.duration_hours}h)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="train_notes">Notes</Label>
                        <Textarea
                          id="train_notes"
                          placeholder="Add any notes about this training"
                          value={trainForm.notes}
                          onChange={(e) =>
                            setTrainForm({
                              ...trainForm,
                              notes: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button onClick={handleAssignTrain}>
                        Assign Training
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {employeeTrainings.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground">
                    <p>No trainings assigned</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Training</TableHead>
                          <TableHead className="text-center">Duration</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-center">
                            Completed Date
                          </TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employeeTrainings.map((train) => (
                          <TableRow key={train.id}>
                            <TableCell className="font-semibold">
                              {train.training_name}
                            </TableCell>
                            <TableCell className="text-center">
                              {train.duration_hours}h
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={getStatusColor(train.status)}>
                                <span className="flex items-center gap-1">
                                  {train.status === "completed" ? (
                                    <CheckCircle2 className="h-3 w-3" />
                                  ) : train.status === "in_progress" ? (
                                    <Clock className="h-3 w-3" />
                                  ) : null}
                                  {train.status.replace("_", " ")}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {train.completed_date
                                ? new Date(
                                    train.completed_date
                                  ).toLocaleDateString()
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    openTrainProgressDialog(train)
                                  }
                                  title="Update progress"
                                >
                                  <Clock className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedId(train.id);
                                    setIsTrainDeleteOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <Dialog open={isTrainProgressOpen} onOpenChange={setIsTrainProgressOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Training Progress</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="progress_status">Status *</Label>
                <Select
                  value={trainProgressForm.status}
                  onValueChange={(value) =>
                    setTrainProgressForm({
                      ...trainProgressForm,
                      status: value as
                        | "pending"
                        | "in_progress"
                        | "completed",
                    })
                  }
                >
                  <SelectTrigger id="progress_status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {trainProgressForm.status === "completed" && (
                <div>
                  <Label htmlFor="progress_date">Completion Date</Label>
                  <Input
                    id="progress_date"
                    type="date"
                    value={trainProgressForm.completed_date}
                    onChange={(e) =>
                      setTrainProgressForm({
                        ...trainProgressForm,
                        completed_date: e.target.value,
                      })
                    }
                  />
                </div>
              )}
              <div>
                <Label htmlFor="progress_notes">Notes</Label>
                <Textarea
                  id="progress_notes"
                  placeholder="Add notes about training progress"
                  value={trainProgressForm.notes}
                  onChange={(e) =>
                    setTrainProgressForm({
                      ...trainProgressForm,
                      notes: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleUpdateTrainProgress}>
                Update Progress
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isCertDeleteOpen} onOpenChange={setIsCertDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogTitle>Remove Certification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this certification?
            </AlertDialogDescription>
            <div className="flex justify-end gap-2">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCert}
                className="bg-destructive hover:bg-destructive/90"
              >
                Remove
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isTrainDeleteOpen} onOpenChange={setIsTrainDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogTitle>Remove Training</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this training?
            </AlertDialogDescription>
            <div className="flex justify-end gap-2">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTrain}
                className="bg-destructive hover:bg-destructive/90"
              >
                Remove
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
