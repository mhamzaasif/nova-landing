import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Plus, Edit2, Trash2, Badge } from "lucide-react";
import type {
  ProficiencyLevel,
  CreateProficiencyLevelRequest,
} from "@shared/api";
import AppLayout from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProficiencyLevelsPage() {
  const [levels, setLevels] = useState<ProficiencyLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CreateProficiencyLevelRequest>({
    level_name: "",
    numeric_value: 1,
  });

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/proficiency-levels");
      if (!response.ok) throw new Error("Failed to fetch proficiency levels");
      const data = await response.json();
      setLevels(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.level_name || !formData.numeric_value) {
        setError("All fields are required");
        return;
      }

      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `/api/proficiency-levels/${editingId}`
        : "/api/proficiency-levels";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save proficiency level");

      await fetchLevels();
      setOpenDialog(false);
      setFormData({ level_name: "", numeric_value: 1 });
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this proficiency level?")) {
      try {
        const response = await fetch(`/api/proficiency-levels/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete proficiency level");
        await fetchLevels();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    }
  };

  const handleEdit = (level: ProficiencyLevel) => {
    setFormData({
      level_name: level.level_name,
      numeric_value: level.numeric_value,
    });
    setEditingId(level.id);
    setOpenDialog(true);
  };

  const handleOpenDialog = () => {
    setFormData({ level_name: "", numeric_value: 1 });
    setEditingId(null);
    setOpenDialog(true);
  };

  const getColorForLevel = (value: number) => {
    const colors = [
      "bg-red-100 text-red-800",
      "bg-orange-100 text-orange-800",
      "bg-yellow-100 text-yellow-800",
      "bg-green-100 text-green-800",
      "bg-blue-100 text-blue-800",
    ];
    return colors[Math.max(0, Math.min(value - 1, colors.length - 1))];
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Proficiency Levels
            </h1>
            <p className="text-muted-foreground">
              Define proficiency scales for assessments
            </p>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Level
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingId
                    ? "Edit Proficiency Level"
                    : "Add New Proficiency Level"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="level_name">Level Name</Label>
                  <Input
                    id="level_name"
                    value={formData.level_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        level_name: e.target.value,
                      })
                    }
                    placeholder="Beginner"
                  />
                </div>
                <div>
                  <Label htmlFor="numeric_value">Numeric Value (1-5)</Label>
                  <Input
                    id="numeric_value"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.numeric_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numeric_value: Math.max(
                          1,
                          Math.min(5, parseInt(e.target.value) || 1)
                        ),
                      })
                    }
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpenDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingId ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Proficiency Levels</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : levels.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <p>
                  No proficiency levels yet. Create your first level to get
                  started.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Level Name</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {levels
                      .sort((a, b) => a.numeric_value - b.numeric_value)
                      .map((level) => (
                        <TableRow key={level.id}>
                          <TableCell className="font-medium">
                            {level.level_name}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Badge
                                variant="secondary"
                                className={getColorForLevel(
                                  level.numeric_value
                                )}
                              >
                                {level.numeric_value}/5
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(level)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(level.id)}
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
      </div>
    </AppLayout>
  );
}
