import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RoleReadiness } from "@shared/api";

interface ReadinessData extends RoleReadiness {
  statusColor: string;
  statusLabel: string;
}

export default function RoleReadinessOverview() {
  const [data, setData] = useState<ReadinessData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReadinessData();
  }, []);

  const fetchReadinessData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/dashboard/overview");
      if (!response.ok) throw new Error("Failed to fetch readiness data");
      const readinessData: RoleReadiness[] = await response.json();

      const enriched = readinessData.map((item) => {
        const readiness = item.readiness_index;
        let statusColor = "text-red-600 dark:text-red-400";
        let statusLabel = "Not Ready";

        if (readiness >= 90) {
          statusColor = "text-green-600 dark:text-green-400";
          statusLabel = "Ready";
        } else if (readiness >= 70) {
          statusColor = "text-blue-600 dark:text-blue-400";
          statusLabel = "Mostly Ready";
        } else if (readiness >= 50) {
          statusColor = "text-yellow-600 dark:text-yellow-400";
          statusLabel = "Partially Ready";
        }

        return {
          ...item,
          statusColor,
          statusLabel,
        };
      });

      setData(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (readiness: number) => {
    if (readiness >= 90) return "bg-green-500";
    if (readiness >= 70) return "bg-blue-500";
    if (readiness >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Role Readiness Overview</CardTitle>
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

  // Group by role
  const groupedByRole = data.reduce(
    (acc, item) => {
      if (!acc[item.role_id]) {
        acc[item.role_id] = {
          role_name: item.role_name || "Unknown",
          employees: [],
        };
      }
      acc[item.role_id].employees.push(item);
      return acc;
    },
    {} as Record<number, { role_name: string; employees: ReadinessData[] }>,
  );

  const roleStats = Object.values(groupedByRole).map((role) => {
    const avgReadiness =
      role.employees.reduce(
        (sum, emp) => sum + Number(emp?.readiness_index || 0),
        0,
      ) / role.employees.length;
    const readyCount = role.employees.filter(
      (emp) => Number(emp?.readiness_index || 0) >= 90,
    ).length;

    return {
      role_name: role.role_name,
      avgReadiness,
      readyCount,
      totalCount: role.employees.length,
      employees: role.employees,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Readiness Overview</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Employee readiness scores for assigned roles (0-100%)
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No readiness data available</p>
          </div>
        ) : (
          <div className="space-y-8">
            {roleStats.map((role, idx) => (
              <div
                key={idx}
                className="border-b last:border-b-0 pb-6 last:pb-0"
              >
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{role.role_name}</h3>
                    <div className="text-sm text-muted-foreground">
                      {role.readyCount}/{role.totalCount} ready
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress
                      value={role.avgReadiness}
                      className="flex-1 bg-transparent border-2 border-primary"
                    />
                    <span
                      className={`text-sm font-semibold ${role.avgReadiness >= 90 ? "text-green-600 dark:text-green-400" : role.avgReadiness >= 70 ? "text-blue-600 dark:text-blue-400" : role.avgReadiness >= 50 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {role.avgReadiness.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Employee breakdown for this role */}
                <div className="overflow-x-auto">
                  <Table className="text-sm">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Readiness</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {role.employees
                        .sort((a, b) => b.readiness_index - a.readiness_index)
                        .map((emp) => (
                          <TableRow key={`${emp.employee_id}-${emp.role_id}`}>
                            <TableCell className="font-medium">
                              {emp.employee_name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {emp.department || "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Progress
                                  value={Number(emp?.readiness_index || 0)}
                                  className="w-24 bg-transparent border-2 border-primary"
                                />
                                <span className="text-xs font-semibold">
                                  {Number(emp?.readiness_index || 0).toFixed(1)}
                                  %
                                </span>
                              </div>
                            </TableCell>
                            <TableCell
                              className={`text-right font-semibold ${emp.statusColor}`}
                            >
                              {emp.statusLabel}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
