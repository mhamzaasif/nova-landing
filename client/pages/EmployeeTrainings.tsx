import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { AlertCircle, Plus, Trash2, CheckCircle2, Clock } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import type { Employee, Training, EmployeeTraining } from "@shared/api";
import { toast } from "sonner";

interface EmployeeTrainingWithDetails extends EmployeeTraining {
  training_name?: string;
  provider?: string;
  duration_hours?: number;
  employee_name?: string;
}

export default function EmployeeTrainings() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [employeeTrainings, setEmployeeTrainings] = useState<EmployeeTrainingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [assignForm, setAssignForm] = useState({
    employee_id: "",
    training_id: "",
    notes: "",
  });

  const [progressForm, setProgressForm] = useState({
    status: "" as "pending" | "in_progress" | "completed",
    completed_date: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [empRes, trainRes, assignRes] = await Promise.all([
        fetch("/api/employees"),
        fetch("/api/trainings"),
        fetch("/api/employee-training"),
      ]);

      if (!empRes.ok || !trainRes.ok || !assignRes.ok) {
        throw new Error("Failed to fetch data");
      }

      setEmployees(await empRes.json());
      setTrainings(await trainRes.json());
      setEmployeeTrainings(await assignRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assignForm.employee_id || !assignForm.training_id) {
      toast.error("Please select an employee and training");
      return;
    }

    try {
      const response = await fetch("/api/employee-training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: parseInt(assignForm.employee_id),
          training_id: parseInt(assignForm.training_id),
          status: "pending",
          notes: assignForm.notes || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast.success("Training assigned successfully");
      setAssignForm({ employee_id: "", training_id: "", notes: "" });
      setIsAssignOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign training");
    }
  };

  const handleUpdateProgress = async () => {
    if (!selectedId || !progressForm.status) {
      toast.error("Please select a status");
      return;
    }

    try {
      const response = await fetch(`/api/employee-training/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: progressForm.status,
          completed_date:
            progressForm.status === "completed"
              ? progressForm.completed_date || new Date().toISOString().split("T")[0]
              : null,
          notes: progressForm.notes || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to update training");

      toast.success("Training progress updated successfully");
      setIsProgressOpen(false);
      setProgressForm({ status: "", completed_date: "", notes: "" });
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update training");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      const response = await fetch(`/api/employee-training/${selectedId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to remove training");

      toast.success("Training removed successfully");
      setIsDeleteOpen(false);
      setSelectedId(null);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove training");
    }
  };

  const openProgressDialog = (item: EmployeeTrainingWithDetails) => {
    setSelectedId(item.id);
    setProgressForm({
      status: item.status,
      completed_date: item.completed_date || "",
      notes: item.notes || "",
    });
    setIsProgressOpen(true);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      default:
        return null;
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

  const pendingCount = employeeTrainings.filter((t) => t.status === "pending").length;
  const inProgressCount = employeeTrainings.filter((t) => t.status === "in_progress").length;
  const completedCount = employeeTrainings.filter((t) => t.status === "completed").length;

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Employee Trainings</h1>
            <p className="text-muted-foreground">
              Assign trainings and track employee progress
            </p>
          </div>
          <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Assign Training
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Training to Employee</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="employee">Employee *</Label>
                  <Select
                    value={assignForm.employee_id}
                    onValueChange={(value) =>
                      setAssignForm({ ...assignForm, employee_id: value })
                    }
                  >
                    <SelectTrigger id="employee">
                      <SelectValue placeholder="Select an employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.name} ({emp.department})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="training">Training *</Label>
                  <Select
                    value={assignForm.training_id}
                    onValueChange={(value) =>
                      setAssignForm({ ...assignForm, training_id: value })
                    }
                  >
                    <SelectTrigger id="training">
                      <SelectValue placeholder="Select a training" />
                    </SelectTrigger>
                    <SelectContent>
                      {trainings.map((train) => (
                        <SelectItem key={train.id} value={train.id.toString()}>
                          {train.name} ({train.duration_hours}h)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about this training assignment"
                    value={assignForm.notes}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, notes: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleAssign}>Assign Training</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{inProgressCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{completedCount}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee Training Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : employeeTrainings.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>No trainings assigned yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Training</TableHead>
                      <TableHead className="text-center">Duration</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Completed Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeTrainings.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold">
                          {item.employee_name}
                        </TableCell>
                        <TableCell>{item.training_name}</TableCell>
                        <TableCell className="text-center">
                          {item.duration_hours}h
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={getStatusColor(item.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(item.status)}
                              {item.status.replace("_", " ")}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.completed_date
                            ? new Date(item.completed_date).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openProgressDialog(item)}
                              title="Update progress"
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedId(item.id);
                                setIsDeleteOpen(true);
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

        {/* Update Progress Dialog */}
        <Dialog open={isProgressOpen} onOpenChange={setIsProgressOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Training Progress</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={progressForm.status}
                  onValueChange={(value) =>
                    setProgressForm({
                      ...progressForm,
                      status: value as "pending" | "in_progress" | "completed",
                    })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {progressForm.status === "completed" && (
                <div>
                  <Label htmlFor="completed_date">Completion Date</Label>
                  <Input
                    id="completed_date"
                    type="date"
                    value={progressForm.completed_date}
                    onChange={(e) =>
                      setProgressForm({ ...progressForm, completed_date: e.target.value })
                    }
                  />
                </div>
              )}
              <div>
                <Label htmlFor="progress_notes">Notes</Label>
                <Textarea
                  id="progress_notes"
                  placeholder="Add notes about training progress"
                  value={progressForm.notes}
                  onChange={(e) =>
                    setProgressForm({ ...progressForm, notes: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleUpdateProgress}>Update Progress</Button>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogTitle>Remove Training</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this training from the employee? This action
              cannot be undone.
            </AlertDialogDescription>
            <div className="flex justify-end gap-2">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
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
