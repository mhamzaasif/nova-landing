import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TeamCapability } from "@shared/api";

export default function TeamCapabilityHeatmap() {
  const [data, setData] = useState<TeamCapability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  useEffect(() => {
    fetchTeamCapability();
  }, [selectedDepartment]);

  const fetchTeamCapability = async () => {
    try {
      setLoading(true);
      setError(null);
      const url =
        selectedDepartment === "all"
          ? "/api/dashboard/team-capability"
          : `/api/dashboard/team-capability?department=${selectedDepartment}`;
      const response = await fetch(url);
      if (!response.ok)
        throw new Error("Failed to fetch team capability");
      const capability: TeamCapability[] = await response.json();
      setData(capability);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const departments = Array.from(
    new Set(data.map((item) => item.department))
  ).sort();

  const getReadinessColor = (readiness: number) => {
    if (readiness >= 90) return "bg-green-100 dark:bg-green-900";
    if (readiness >= 70) return "bg-blue-100 dark:bg-blue-900";
    if (readiness >= 50) return "bg-yellow-100 dark:bg-yellow-900";
    return "bg-red-100 dark:bg-red-900";
  };

  const getReadinessTextColor = (readiness: number) => {
    if (readiness >= 90) return "text-green-700 dark:text-green-300";
    if (readiness >= 70) return "text-blue-700 dark:text-blue-300";
    if (readiness >= 50) return "text-yellow-700 dark:text-yellow-300";
    return "text-red-700 dark:text-red-300";
  };

  // Group by department
  const groupedByDepartment = data.reduce(
    (acc, item) => {
      if (!acc[item.department]) {
        acc[item.department] = [];
      }
      acc[item.department].push(item);
      return acc;
    },
    {} as Record<string, TeamCapability[]>
  );

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Capability Heat Map</CardTitle>
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
        <CardTitle>Team Capability Heat Map</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Team and department-level capability overview by role
        </p>
      </CardHeader>
      <CardContent>
        {/* Department Filter */}
        <div className="mb-6">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No team capability data available</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByDepartment).map(([dept, items]) => (
              <div key={dept} className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">{dept}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-4 border rounded-lg ${getReadinessColor(
                        Number(item.avg_readiness || 0)
                      )}`}
                    >
                      <div className="mb-3">
                        <h4 className="font-semibold mb-1">{item.role_name}</h4>
                        <div className="text-sm text-muted-foreground">
                          {item.total_employees} employee(s)
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">
                              Avg Readiness
                            </span>
                            <span
                              className={`text-sm font-bold ${getReadinessTextColor(
                                Number(item.avg_readiness || 0)
                              )}`}
                            >
                              {Number(item.avg_readiness || 0).toFixed(1)}%
                            </span>
                          </div>
                          <Progress
                            value={Number(item.avg_readiness || 0)}
                            className="h-2"
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Ready: {item.ready_count}
                            </Badge>
                          </div>
                          <div>
                            <Badge
                              variant="outline"
                              className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300"
                            >
                              Not Ready: {item.not_ready_count}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {!loading && data.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                Total Teams
              </p>
              <p className="text-2xl font-bold text-foreground">
                {Object.keys(groupedByDepartment).length}
              </p>
            </div>
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
                {data.reduce((sum, item) => sum + item.total_employees, 0)}
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

