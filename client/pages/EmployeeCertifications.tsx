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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Plus, Trash2, Calendar } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import type { Employee, Certification, EmployeeCertification } from "@shared/api";
import { toast } from "sonner";

interface EmployeeCertWithDetails extends EmployeeCertification {
  cert_name?: string;
  is_critical?: boolean;
  employee_name?: string;
}

export default function EmployeeCertifications() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [employeeCerts, setEmployeeCerts] = useState<EmployeeCertWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    employee_id: "",
    certification_id: "",
    issue_date: new Date().toISOString().split("T")[0],
    expiry_date: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [empRes, certRes, assignRes] = await Promise.all([
        fetch("/api/employees"),
        fetch("/api/certifications"),
        fetch("/api/employee-certifications"),
      ]);

      if (!empRes.ok || !certRes.ok || !assignRes.ok) {
        throw new Error("Failed to fetch data");
      }

      setEmployees(await empRes.json());
      setCertifications(await certRes.json());
      setEmployeeCerts(await assignRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!formData.employee_id || !formData.certification_id || !formData.issue_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch("/api/employee-certifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: parseInt(formData.employee_id),
          certification_id: parseInt(formData.certification_id),
          issue_date: formData.issue_date,
          expiry_date: formData.expiry_date || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast.success("Certification assigned successfully");
      setFormData({
        employee_id: "",
        certification_id: "",
        issue_date: new Date().toISOString().split("T")[0],
        expiry_date: "",
      });
      setIsAssignOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign certification");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      const response = await fetch(`/api/employee-certifications/${selectedId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to remove certification");

      toast.success("Certification removed successfully");
      setIsDeleteOpen(false);
      setSelectedId(null);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove certification");
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

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Employee Certifications</h1>
            <p className="text-muted-foreground">
              Assign and manage employee certifications
            </p>
          </div>
          <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Assign Certification
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Certification to Employee</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="employee">Employee *</Label>
                  <Select
                    value={formData.employee_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, employee_id: value })
                    }
                  >
                    <SelectTrigger id="employee">
                      <SelectValue placeholder="Select an employee" />
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
                  <Label htmlFor="certification">Certification *</Label>
                  <Select
                    value={formData.certification_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, certification_id: value })
                    }
                  >
                    <SelectTrigger id="certification">
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
                  <Label htmlFor="issue_date">Issue Date *</Label>
                  <Input
                    id="issue_date"
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) =>
                      setFormData({ ...formData, issue_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="expiry_date">Expiry Date</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) =>
                      setFormData({ ...formData, expiry_date: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleAssign}>Assign Certification</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee Certifications</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : employeeCerts.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>No certifications assigned yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Certification</TableHead>
                      <TableHead className="text-center">Issue Date</TableHead>
                      <TableHead className="text-center">Expiry Date</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeCerts.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold">
                          {item.employee_name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.cert_name}
                            {item.is_critical && (
                              <Badge variant="destructive">Critical</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {new Date(item.issue_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.expiry_date
                            ? new Date(item.expiry_date).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {isExpired(item.expiry_date) ? (
                            <Badge variant="destructive">Expired</Badge>
                          ) : isExpiring(item.expiry_date) ? (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
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
                              setSelectedId(item.id);
                              setIsDeleteOpen(true);
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

        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogTitle>Remove Certification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this certification from the employee? This action
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
