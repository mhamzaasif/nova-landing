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
import type { InitialAssessment } from "@shared/api";

export default function InitialCompetencyAssessment() {
  const [data, setData] = useState<InitialAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialAssessments();
  }, []);

  const fetchInitialAssessments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/dashboard/initial-assessments");
      if (!response.ok) throw new Error("Failed to fetch initial assessments");
      const assessments: InitialAssessment[] = await response.json();
      setData(assessments);
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

  const getProficiencyLabel = (proficiency: number) => {
    if (proficiency >= 4) return "Advanced";
    if (proficiency >= 3) return "Proficient";
    if (proficiency >= 2) return "Intermediate";
    if (proficiency >= 1) return "Beginner";
    return "Novice";
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Initial Competency Assessment</CardTitle>
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
        <CardTitle>Initial Competency Assessment</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          First competency assessment recorded for each employee-role combination
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No initial assessments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-center">Assessment Date</TableHead>
                  <TableHead className="text-center">Skills Assessed</TableHead>
                  <TableHead className="text-center">Avg Proficiency</TableHead>
                  <TableHead className="text-center">Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-semibold">
                      {item.employee_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.department || "—"}
                    </TableCell>
                    <TableCell>{item.role_name}</TableCell>
                    <TableCell className="text-center">
                      {new Date(item.assessment_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{item.total_skills_assessed}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Progress
                          value={(Number(item.avg_proficiency) / 5) * 100}
                          className="w-24"
                        />
                        <span className="text-sm font-semibold">
                          {Number(item.avg_proficiency || 0).toFixed(2)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={getProficiencyColor(
                          Number(item.avg_proficiency || 0)
                        )}
                      >
                        {getProficiencyLabel(Number(item.avg_proficiency || 0))}
                      </Badge>
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
                Total Assessments
              </p>
              <p className="text-2xl font-bold text-foreground">{data.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                Avg Skills Assessed
              </p>
              <p className="text-2xl font-bold text-foreground">
                {(
                  data.reduce((sum, item) => sum + item.total_skills_assessed, 0) /
                  data.length
                ).toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                Overall Avg Proficiency
              </p>
              <p className="text-2xl font-bold text-foreground">
                {(
                  data.reduce(
                    (sum, item) => sum + Number(item.avg_proficiency || 0),
                    0
                  ) / data.length
                ).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                Unique Employees
              </p>
              <p className="text-2xl font-bold text-foreground">
                {new Set(data.map((item) => item.employee_id)).size}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

