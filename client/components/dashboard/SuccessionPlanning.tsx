import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Users, TrendingUp } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SuccessionCandidate } from "@shared/api";

export default function SuccessionPlanning() {
  const [data, setData] = useState<SuccessionCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [minReadiness, setMinReadiness] = useState<string>("50");

  useEffect(() => {
    fetchSuccessionCandidates();
  }, [selectedRole, minReadiness]);

  const fetchSuccessionCandidates = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (selectedRole !== "all") {
        params.append("roleId", selectedRole);
      }
      params.append("minReadiness", minReadiness);
      const response = await fetch(
        `/api/dashboard/succession-candidates?${params.toString()}`,
      );
      if (!response.ok)
        throw new Error("Failed to fetch succession candidates");
      const candidates: SuccessionCandidate[] = await response.json();
      setData(candidates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const roles = Array.from(new Set(data.map((item) => item.role_id))).sort();
  const roleNames = data.reduce(
    (acc, item) => {
      if (!acc[item.role_id]) {
        acc[item.role_id] = item.role_name;
      }
      return acc;
    },
    {} as Record<number, string>,
  );

  const getPotentialColor = (rating: string) => {
    switch (rating) {
      case "high":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  // Group by role
  const groupedByRole = data.reduce(
    (acc, item) => {
      if (!acc[item.role_id]) {
        acc[item.role_id] = [];
      }
      acc[item.role_id].push(item);
      return acc;
    },
    {} as Record<number, SuccessionCandidate[]>,
  );

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Succession Planning Support</CardTitle>
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
          <Users className="h-5 w-5" />
          Succession Planning Support
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Identify potential successors for roles based on readiness and skill
          coverage
        </p>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map((roleId) => (
                <SelectItem key={roleId} value={roleId.toString()}>
                  {roleNames[roleId]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={minReadiness} onValueChange={setMinReadiness}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Min readiness" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">Min 50%</SelectItem>
              <SelectItem value="60">Min 60%</SelectItem>
              <SelectItem value="70">Min 70%</SelectItem>
              <SelectItem value="80">Min 80%</SelectItem>
              <SelectItem value="90">Min 90%</SelectItem>
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
            <p>No succession candidates found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByRole).map(([roleId, candidates]) => (
              <div key={roleId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">
                    {candidates[0].role_name}
                  </h3>
                  <Badge variant="outline">
                    {candidates.length} candidate(s)
                  </Badge>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-center">Readiness</TableHead>
                        <TableHead className="text-center">
                          Skill Coverage
                        </TableHead>
                        <TableHead className="text-center">Potential</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {candidates
                        .sort(
                          (a, b) =>
                            Number(b.readiness_index || 0) -
                            Number(a.readiness_index || 0),
                        )
                        .map((candidate, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-semibold">
                              {candidate.employee_name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {candidate.department || "—"}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Progress
                                  value={Number(candidate.readiness_index || 0)}
                                  className="w-24"
                                />
                                <span className="text-sm font-semibold">
                                  {Number(
                                    candidate.readiness_index || 0,
                                  ).toFixed(1)}
                                  %
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-sm font-semibold">
                                  {candidate.key_skills_covered} /{" "}
                                  {candidate.total_skills_required}
                                </span>
                                <Progress
                                  value={candidate.coverage_percentage}
                                  className="w-24"
                                />
                                <span className="text-xs text-muted-foreground">
                                  {candidate.coverage_percentage.toFixed(1)}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                className={getPotentialColor(
                                  candidate.potential_rating,
                                )}
                              >
                                {candidate.potential_rating.toUpperCase()}
                              </Badge>
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

        {/* Summary Stats */}
        {!loading && data.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                Total Candidates
              </p>
              <p className="text-2xl font-bold text-foreground">
                {data.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                High Potential
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {data.filter((c) => c.potential_rating === "high").length}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                Roles with Candidates
              </p>
              <p className="text-2xl font-bold text-foreground">
                {Object.keys(groupedByRole).length}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                Avg Readiness
              </p>
              <p className="text-2xl font-bold text-foreground">
                {(
                  data.reduce((sum, c) => sum + c.readiness_index, 0) /
                  data.length
                ).toFixed(1)}
                %
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
