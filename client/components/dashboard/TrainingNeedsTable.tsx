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
import type { TrainingNeed } from "@shared/api";

export default function TrainingNeedsTable() {
  const [data, setData] = useState<TrainingNeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrainingNeeds();
  }, []);

  const fetchTrainingNeeds = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/dashboard/training-needs?minGap=0");
      if (!response.ok) throw new Error("Failed to fetch training needs");
      const trainingData: TrainingNeed[] = await response.json();

      // Sort by total gap (descending) to show highest priority first
      const sorted = trainingData.sort((a, b) => b.total_gap - a.total_gap);
      setData(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (avgGap: number) => {
    if (avgGap <= 0)
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (avgGap < 1)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    if (avgGap < 2)
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  const getSeverityLabel = (avgGap: number) => {
    if (avgGap <= 0) return "On Track";
    if (avgGap < 1) return "Minor Gap";
    if (avgGap < 2) return "Moderate Gap";
    return "Critical Gap";
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Training Needs</CardTitle>
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
        <CardTitle>Training Needs</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Employees with skill gaps in their assigned roles, sorted by priority
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
            <p>No training needs identified - all employees are on track!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-center">Skills with Gap</TableHead>
                  <TableHead className="text-center">Total Gap</TableHead>
                  <TableHead className="text-center">Avg Gap/Skill</TableHead>
                  <TableHead className="text-center">Priority</TableHead>
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
                      <Badge variant="outline">{item.skills_with_gap}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {Number(item.total_gap || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      {Number(item.avg_gap || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={getSeverityColor(Number(item.avg_gap || 0))}
                      >
                        {getSeverityLabel(Number(item.avg_gap || 0))}
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
                Total Employees
              </p>
              <p className="text-2xl font-bold text-foreground">
                {data.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                Total Skills with Gap
              </p>
              <p className="text-2xl font-bold text-foreground">
                {data.reduce((sum, item) => sum + item.skills_with_gap, 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                Avg Gap/Employee
              </p>
              <p className="text-2xl font-bold text-foreground">
                {(
                  data.reduce(
                    (sum, item) => sum + Number(item.total_gap || 0),
                    0,
                  ) / data.length
                ).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                Critical Gaps
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {data.filter((item) => Number(item.avg_gap || 0) >= 2).length}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
