import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Edit2, Trash2, X, CheckCircle, Search } from "lucide-react";
import type {
  Role,
  CreateRoleRequest,
  Skill,
  ProficiencyLevel,
} from "@shared/api";
import AppLayout from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";

interface RoleFormState extends CreateRoleRequest {
  skills: {
    skill_id: number;
    skill_name: string;
    required_proficiency_level_id: number;
    level_name?: string;
  }[];
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [proficiencyLevels, setProficiencyLevels] = useState<
    ProficiencyLevel[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<RoleFormState>({
    name: "",
    description: "",
    skills: [],
  });
  const [skillSearchQuery, setSkillSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Skill[]>([]);
  const [showSkillCreator, setShowSkillCreator] = useState<boolean>(false);
  const [newSkillName, setNewSkillName] = useState<string>("");
  const [selectedSkillIndex, setSelectedSkillIndex] = useState<number | null>(
    null,
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, skillsRes, levelsRes] = await Promise.all([
        fetch("/api/roles"),
        fetch("/api/skills"),
        fetch("/api/proficiency-levels"),
      ]);

      if (!rolesRes.ok || !skillsRes.ok || !levelsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const [rolesData, skillsData, levelsData] = await Promise.all([
        rolesRes.json(),
        skillsRes.json(),
        levelsRes.json(),
      ]);

      setRoles(rolesData);
      setSkills(skillsData);
      setProficiencyLevels(levelsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSkills = async (query: string, skillIndex: number) => {
    setSelectedSkillIndex(skillIndex);
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

  const handleSelectSkill = (skill: Skill) => {
    if (selectedSkillIndex !== null) {
      const newSkills = [...formData.skills];
      newSkills[selectedSkillIndex] = {
        skill_id: skill.id,
        skill_name: skill.name,
        required_proficiency_level_id: 0,
      };
      setFormData({ ...formData, skills: newSkills });
      setSearchResults([]);
      setSkillSearchQuery("");
      setShowSkillCreator(false);
    }
  };

  const handleCreateSkillInline = async () => {
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

      // Update the form with the new skill
      if (selectedSkillIndex !== null) {
        const newSkills = [...formData.skills];
        newSkills[selectedSkillIndex] = {
          skill_id: newSkill.id,
          skill_name: newSkill.name,
          required_proficiency_level_id: 0,
        };
        setFormData({ ...formData, skills: newSkills });
      }

      // Refresh skills list
      await fetchData();

      // Reset UI
      setNewSkillName("");
      setShowSkillCreator(false);
      setSearchResults([]);
      setSkillSearchQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create skill");
    }
  };

  const handleAddSkill = () => {
    const newSkills = [
      ...formData.skills,
      {
        skill_id: 0,
        skill_name: "",
        required_proficiency_level_id: 0,
      },
    ];
    setFormData({ ...formData, skills: newSkills });
  };

  const handleRemoveSkill = (index: number) => {
    const newSkills = formData.skills.filter((_, i) => i !== index);
    setFormData({ ...formData, skills: newSkills });
  };

  const handleUpdateSkillLevel = (index: number, levelId: number) => {
    const newSkills = [...formData.skills];
    newSkills[index] = {
      ...newSkills[index],
      required_proficiency_level_id: levelId,
    };
    setFormData({ ...formData, skills: newSkills });
  };

  const handleSave = async () => {
    try {
      if (!formData.name) {
        setError("Name is required");
        return;
      }

      // Validate skills
      for (let i = 0; i < formData.skills.length; i++) {
        const skill = formData.skills[i];
        if (!skill.skill_id || skill.skill_id === 0) {
          setError(`Skill at index ${i + 1} is not selected`);
          return;
        }
        if (
          !skill.required_proficiency_level_id ||
          skill.required_proficiency_level_id === 0
        ) {
          setError(
            `Proficiency level for "${skill.skill_name}" is not selected`,
          );
          return;
        }
      }

      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/roles/${editingId}` : "/api/roles";

      const payload: CreateRoleRequest = {
        name: formData.name,
        description: formData.description,
        skills: formData.skills.map((s) => ({
          skill_id: s.skill_id,
          required_proficiency_level_id: s.required_proficiency_level_id,
        })),
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save role");
      }

      await fetchData();
      setOpenDialog(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this role?")) {
      try {
        const response = await fetch(`/api/roles/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete role");
        await fetchData();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    }
  };

  const handleEdit = (role: Role) => {
    setFormData({
      name: role.name,
      description: role.description || "",
      skills: (role.skills || []).map((rs: any) => ({
        skill_id: rs.skill_id,
        skill_name: rs.skill_name,
        required_proficiency_level_id: rs.required_proficiency_level_id,
        level_name: rs.level_name,
      })),
    });
    setEditingId(role.id);
    setOpenDialog(true);
  };

  const handleOpenDialog = () => {
    resetForm();
    setOpenDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      skills: [],
    });
    setEditingId(null);
    setError(null);
    setSkillSearchQuery("");
    setSearchResults([]);
    setShowSkillCreator(false);
    setNewSkillName("");
    setSelectedSkillIndex(null);
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Roles</h1>
            <p className="text-muted-foreground">
              Define the roles and their required skills in your organization
            </p>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Edit Role" : "Add New Role"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Role Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Senior Engineer"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe the role and its responsibilities"
                    rows={3}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Required Skills</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddSkill}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Skill
                    </Button>
                  </div>

                  {formData.skills.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-3 border border-dashed rounded">
                      No skills added yet. Click "Add Skill" to add required
                      skills for this role.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.skills.map((skill, index) => (
                        <div
                          key={index}
                          className="flex gap-2 items-end p-3 border rounded-lg bg-muted/30"
                        >
                          <div className="flex-1">
                            <Label className="text-xs mb-1 block">Skill</Label>
                            {skill.skill_name ? (
                              <div className="flex items-center gap-2 p-2 rounded bg-accent/20 border border-accent/30">
                                <CheckCircle className="h-4 w-4 text-accent" />
                                <span className="text-sm font-medium">
                                  {skill.skill_name}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="ml-auto h-6 w-6 p-0"
                                  onClick={() => {
                                    const newSkills = [...formData.skills];
                                    newSkills[index].skill_id = 0;
                                    newSkills[index].skill_name = "";
                                    setFormData({
                                      ...formData,
                                      skills: newSkills,
                                    });
                                  }}
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : showSkillCreator &&
                              selectedSkillIndex === index ? (
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
                                    onClick={handleCreateSkillInline}
                                    className="flex-1"
                                  >
                                    Create
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setShowSkillCreator(false);
                                      setSelectedSkillIndex(null);
                                    }}
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
                                {skillSearchQuery &&
                                  selectedSkillIndex === index &&
                                  searchResults.length > 0 && (
                                    <div className="border rounded-lg max-h-32 overflow-y-auto bg-white">
                                      {searchResults.map((s) => (
                                        <button
                                          key={s.id}
                                          onClick={() => handleSelectSkill(s)}
                                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                                        >
                                          <Search className="h-3 w-3" />
                                          {s.name}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                {skillSearchQuery &&
                                  selectedSkillIndex === index &&
                                  searchResults.length === 0 && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full"
                                      onClick={() => {
                                        setShowSkillCreator(true);
                                      }}
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Create "{skillSearchQuery}"
                                    </Button>
                                  )}
                              </div>
                            )}
                          </div>

                          <div className="w-48">
                            <Label className="text-xs mb-1 block">
                              Required Level
                            </Label>
                            <Select
                              value={
                                skill.required_proficiency_level_id?.toString() ||
                                ""
                              }
                              onValueChange={(value) =>
                                handleUpdateSkillLevel(index, parseInt(value))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                              <SelectContent>
                                {proficiencyLevels.map((level) => (
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
                            onClick={() => handleRemoveSkill(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
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
                <Button onClick={handleSave}>
                  {editingId ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Roles List</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : roles.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <p>No roles yet. Create your first role to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {roles.map((role) => (
                  <Card key={role.id} className="border-muted">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{role.name}</h3>
                          {role.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {role.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(role)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(role.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      {role.skills && role.skills.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Required Skills:
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {role.skills.map((roleSkill: any, idx) => (
                              <div
                                key={idx}
                                className="text-sm p-2 rounded bg-accent/10 border border-accent/20"
                              >
                                <p className="font-medium">
                                  {roleSkill.skill_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Level: {roleSkill.level_name}
                                </p>
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
