import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import type { SkillsInventory } from "@shared/api";

export default function SkillsInventoryDashboard() {
  const [data, setData] = useState<SkillsInventory[]>([]);
  const [filteredData, setFilteredData] = useState<SkillsInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchSkillsInventory();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredData(data);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredData(
        data.filter(
          (skill) =>
            skill.skill_name.toLowerCase().includes(query) ||
            skill.departments.some((dept) =>
              dept.toLowerCase().includes(query)
            )
        )
      );
    }
  }, [searchQuery, data]);

  const fetchSkillsInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/dashboard/skills-inventory");
      if (!response.ok)
        throw new Error("Failed to fetch skills inventory");
      const inventory: SkillsInventory[] = await response.json();
      setData(inventory);
      setFilteredData(inventory);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getProficiencyColor = (proficiency: number) => {
    if (proficiency >= 4) return "text-green-600 dark:text-green-400";
    if (proficiency >= 3) return "text-blue-600 dark:text-blue-400";
    if (proficiency >= 2) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Skills Inventory Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills Inventory Dashboard</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Comprehensive view of all skills across the organization with employee distribution
        </p>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Search skills or departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No skills found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Skill</TableHead>
                  <TableHead className="text-center">Total Employees</TableHead>
                  <TableHead className="text-center">Avg Proficiency</TableHead>
                  <TableHead className="text-center">Proficiency Distribution</TableHead>
                  <TableHead>Departments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-semibold">
                      {item.skill_name}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{item.total_employees}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Progress
                          value={(Number(item.avg_proficiency) / 5) * 100}
                          className="w-24"
                        />
                        <span
                          className={`text-sm font-semibold ${getProficiencyColor(
                            Number(item.avg_proficiency || 0)
                          )}`}
                        >
                          {Number(item.avg_proficiency || 0).toFixed(2)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-xs">
                        {[1, 2, 3, 4, 5].map((level) => {
                          const count = item.employees_by_level[level] || 0;
                          return (
                            <div
                              key={level}
                              className="flex flex-col items-center px-1"
                            >
                              <span className="text-muted-foreground">
                                L{level}
                              </span>
                              <span className="font-semibold">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.departments.length > 0 ? (
                          item.departments.slice(0, 3).map((dept, dIdx) => (
                            <Badge key={dIdx} variant="secondary" className="text-xs">
                              {dept}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                        {item.departments.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{item.departments.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Summary Stats */}
        {!loading && data.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                Total Skills
              </p>
              <p className="text-2xl font-bold text-foreground">{data.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                Skills with Employees
              </p>
              <p className="text-2xl font-bold text-foreground">
                {data.filter((s) => s.total_employees > 0).length}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                Total Skill Assignments
              </p>
              <p className="text-2xl font-bold text-foreground">
                {data.reduce((sum, s) => sum + s.total_employees, 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                Overall Avg Proficiency
              </p>
              <p className="text-2xl font-bold text-foreground">
                {(
                  data
                    .filter((s) => s.total_employees > 0)
                    .reduce(
                      (sum, s) => sum + Number(s.avg_proficiency || 0),
                      0
                    ) /
                  data.filter((s) => s.total_employees > 0).length || 0
                ).toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

