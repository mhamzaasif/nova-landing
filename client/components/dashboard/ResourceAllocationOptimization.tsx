import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Target, Lightbulb } from "lucide-react";
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
import type { ResourceAllocation } from "@shared/api";

export default function ResourceAllocationOptimization() {
  const [data, setData] = useState<ResourceAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResourceAllocation();
  }, []);

  const fetchResourceAllocation = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/dashboard/resource-allocation");
      if (!response.ok)
        throw new Error("Failed to fetch resource allocation");
      const allocation: ResourceAllocation[] = await response.json();
      setData(allocation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getReadinessColor = (readiness: number) => {
    if (readiness >= 90) return "text-green-600 dark:text-green-400";
    if (readiness >= 70) return "text-blue-600 dark:text-blue-400";
    if (readiness >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getGapColor = (gap: number) => {
    if (gap === 0) return "text-green-600 dark:text-green-400";
    if (gap > 0) return "text-yellow-600 dark:text-yellow-400";
    return "text-blue-600 dark:text-blue-400";
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resource Allocation Optimization</CardTitle>
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
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Resource Allocation Optimization
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Optimize resource allocation across roles with actionable recommendations
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
            <p>No resource allocation data available</p>
          </div>
        ) : (
          <div className="space-y-6">
            {data.map((item, idx) => (
              <Card key={idx} className="border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{item.role_name}</CardTitle>
                    <Badge variant="outline">
                      {item.current_employees} employee(s)
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">
                        Current Employees
                      </p>
                      <p className="text-2xl font-bold">{item.current_employees}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">
                        Required Employees
                      </p>
                      <p className="text-2xl font-bold">{item.required_employees}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">
                        Avg Readiness
                      </p>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={Number(item.avg_readiness || 0)}
                          className="flex-1"
                        />
                        <span
                          className={`text-lg font-bold ${getReadinessColor(
                            Number(item.avg_readiness || 0)
                          )}`}
                        >
                          {Number(item.avg_readiness || 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {item.critical_skills_gaps &&
                  item.critical_skills_gaps.length > 0 ? (
                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                      <p className="text-sm font-semibold mb-2 text-yellow-800 dark:text-yellow-200">
                        Critical Skills Gaps:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {item.critical_skills_gaps.map((gap, gIdx) => (
                          <Badge
                            key={gIdx}
                            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          >
                            {gap.skill_name} ({gap.employees_needed} needed)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {item.recommended_actions &&
                  item.recommended_actions.length > 0 ? (
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="h-4 w-4 text-primary" />
                        <p className="text-sm font-semibold">
                          Recommended Actions:
                        </p>
                      </div>
                      <ul className="space-y-2">
                        {item.recommended_actions.map((action, aIdx) => (
                          <li key={aIdx} className="text-sm flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {!loading && data.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                Total Roles
              </p>
              <p className="text-2xl font-bold text-foreground">{data.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                Total Employees
              </p>
              <p className="text-2xl font-bold text-foreground">
                {data.reduce((sum, item) => sum + item.current_employees, 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                Roles Needing Attention
              </p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {
                  data.filter(
                    (item) =>
                      item.recommended_actions &&
                      item.recommended_actions.length > 0
                  ).length
                }
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                Overall Avg Readiness
              </p>
              <p className="text-2xl font-bold text-foreground">
                {(
                  data.reduce(
                    (sum, item) => sum + Number(item.avg_readiness || 0),
                    0
                  ) / data.length || 0
                ).toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

