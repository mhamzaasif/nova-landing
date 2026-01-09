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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import type { Certification, CreateCertificationRequest } from "@shared/api";
import { toast } from "sonner";

export default function Certifications() {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [formData, setFormData] = useState<CreateCertificationRequest>({
    name: "",
    description: "",
    issuing_body: "",
    is_critical: false,
    renewal_period_months: undefined,
  });

  useEffect(() => {
    fetchCertifications();
  }, []);

  const fetchCertifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/certifications");
      if (!response.ok) throw new Error("Failed to fetch certifications");
      const data = await response.json();
      setCertifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.issuing_body) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch("/api/certifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast.success("Certification created successfully");
      setFormData({
        name: "",
        description: "",
        issuing_body: "",
        is_critical: false,
        renewal_period_months: undefined,
      });
      setIsCreateOpen(false);
      fetchCertifications();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create certification");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      const response = await fetch(`/api/certifications/${selectedId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete certification");

      toast.success("Certification deleted successfully");
      setIsDeleteOpen(false);
      setSelectedId(null);
      fetchCertifications();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete certification");
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

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Certifications</h1>
            <p className="text-muted-foreground">
              Manage certifications required for your organization
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Certification
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Certification</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Certification Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., AWS Solutions Architect"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="issuing_body">Issuing Body *</Label>
                  <Input
                    id="issuing_body"
                    placeholder="e.g., Amazon Web Services"
                    value={formData.issuing_body}
                    onChange={(e) =>
                      setFormData({ ...formData, issuing_body: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Certification details and requirements"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="renewal_period">Renewal Period (months)</Label>
                  <Input
                    id="renewal_period"
                    type="number"
                    placeholder="e.g., 36"
                    value={formData.renewal_period_months || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        renewal_period_months: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_critical"
                    checked={formData.is_critical || false}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_critical: checked as boolean })
                    }
                  />
                  <Label htmlFor="is_critical" className="font-normal cursor-pointer">
                    Mark as critical for role requirements
                  </Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleCreate}>Create Certification</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Certifications</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : certifications.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>No certifications yet. Create one to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Certification Name</TableHead>
                      <TableHead>Issuing Body</TableHead>
                      <TableHead>Renewal Period</TableHead>
                      <TableHead className="text-center">Critical</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certifications.map((cert) => (
                      <TableRow key={cert.id}>
                        <TableCell className="font-semibold">{cert.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {cert.issuing_body}
                        </TableCell>
                        <TableCell>
                          {cert.renewal_period_months
                            ? `${cert.renewal_period_months} months`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {cert.is_critical ? (
                            <Badge variant="destructive">Yes</Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedId(cert.id);
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
            <AlertDialogTitle>Delete Certification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this certification? This action cannot be
              undone.
            </AlertDialogDescription>
            <div className="flex justify-end gap-2">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
