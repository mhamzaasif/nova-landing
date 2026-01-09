import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TrainingMetrics {
  totalTrainings: number;
  totalAssignments: number;
  completedCount: number;
  pendingCount: number;
  inProgressCount: number;
}

export default function TrainingMetrics() {
  const [metrics, setMetrics] = useState<TrainingMetrics>({
    totalTrainings: 0,
    totalAssignments: 0,
    completedCount: 0,
    pendingCount: 0,
    inProgressCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [trainingRes, assignRes] = await Promise.all([
        fetch("/api/trainings"),
        fetch("/api/employee-training"),
      ]);

      if (!trainingRes.ok || !assignRes.ok) {
        throw new Error("Failed to fetch metrics");
      }

      const trainings = await trainingRes.json();
      const assignments = await assignRes.json();

      const completedCount = assignments.filter((a: any) => a.status === "completed").length;
      const pendingCount = assignments.filter((a: any) => a.status === "pending").length;
      const inProgressCount = assignments.filter((a: any) => a.status === "in_progress").length;

      setMetrics({
        totalTrainings: trainings.length,
        totalAssignments: assignments.length,
        completedCount,
        pendingCount,
        inProgressCount,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Training Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Training Overview</CardTitle>
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

  const completionRate =
    metrics.totalAssignments > 0
      ? Math.round((metrics.completedCount / metrics.totalAssignments) * 100)
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Training Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Trainings</p>
              <p className="text-3xl font-bold">{metrics.totalTrainings}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Assignments</p>
              <p className="text-3xl font-bold">{metrics.totalAssignments}</p>
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground mb-3">Assignment Status</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">
                Completed: {metrics.completedCount}
              </Badge>
              <Badge variant="secondary">
                In Progress: {metrics.inProgressCount}
              </Badge>
              <Badge variant="outline">
                Pending: {metrics.pendingCount}
              </Badge>
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">Completion Rate</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <span className="text-sm font-semibold">{completionRate}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
