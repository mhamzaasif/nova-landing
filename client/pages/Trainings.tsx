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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import type { Training, CreateTrainingRequest, Skill } from "@shared/api";
import { toast } from "sonner";

interface TrainingWithSkill extends Training {
  skill_name?: string;
}

export default function Trainings() {
  const [trainings, setTrainings] = useState<TrainingWithSkill[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [formData, setFormData] = useState<CreateTrainingRequest>({
    name: "",
    description: "",
    provider: "",
    duration_hours: 0,
    skill_id: undefined,
  });

  useEffect(() => {
    fetchTrainings();
    fetchSkills();
  }, []);

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/trainings");
      if (!response.ok) throw new Error("Failed to fetch trainings");
      const data = await response.json();
      setTrainings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await fetch("/api/skills");
      if (!response.ok) throw new Error("Failed to fetch skills");
      const data = await response.json();
      setSkills(data);
    } catch (err) {
      console.error("Error fetching skills:", err);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.provider || !formData.duration_hours) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch("/api/trainings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast.success("Training created successfully");
      setFormData({
        name: "",
        description: "",
        provider: "",
        duration_hours: 0,
        skill_id: undefined,
      });
      setIsCreateOpen(false);
      fetchTrainings();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create training");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      const response = await fetch(`/api/trainings/${selectedId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete training");

      toast.success("Training deleted successfully");
      setIsDeleteOpen(false);
      setSelectedId(null);
      fetchTrainings();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete training");
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
            <h1 className="text-3xl font-bold text-foreground">Trainings</h1>
            <p className="text-muted-foreground">
              Manage training programs for skill development
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Training
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Training</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Training Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Advanced React Development"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="provider">Provider *</Label>
                  <Input
                    id="provider"
                    placeholder="e.g., Udemy, Coursera"
                    value={formData.provider}
                    onChange={(e) =>
                      setFormData({ ...formData, provider: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (hours) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="e.g., 40"
                    value={formData.duration_hours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration_hours: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="skill">Related Skill</Label>
                  <Select
                    value={formData.skill_id?.toString() || ""}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        skill_id: value ? parseInt(value) : undefined,
                      })
                    }
                  >
                    <SelectTrigger id="skill">
                      <SelectValue placeholder="Select a skill" />
                    </SelectTrigger>
                    <SelectContent>
                      {skills.map((skill) => (
                        <SelectItem key={skill.id} value={skill.id.toString()}>
                          {skill.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Training details and objectives"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleCreate}>Create Training</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Trainings</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : trainings.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>No trainings yet. Create one to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Training Name</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead className="text-center">Duration (hours)</TableHead>
                      <TableHead>Related Skill</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trainings.map((training) => (
                      <TableRow key={training.id}>
                        <TableCell className="font-semibold">{training.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {training.provider}
                        </TableCell>
                        <TableCell className="text-center">
                          {training.duration_hours}
                        </TableCell>
                        <TableCell>{training.skill_name || "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedId(training.id);
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
            <AlertDialogTitle>Delete Training</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this training? This action cannot be undone.
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
