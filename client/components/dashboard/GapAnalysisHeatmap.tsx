import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { GapAnalysis } from "@shared/api";

interface HeatmapCell {
  role: string;
  skill: string;
  avgGap: number;
  maxGap: number;
  minGap: number;
  employeeCount: number;
}

export default function GapAnalysisHeatmap() {
  const [data, setData] = useState<HeatmapCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGapData();
  }, []);

  const fetchGapData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/dashboard/gap-analysis");
      if (!response.ok) throw new Error("Failed to fetch gap analysis");
      const gapData: GapAnalysis[] = await response.json();
      
      const cells = gapData.map((item) => ({
        role: item.role_name,
        skill: item.skill_name,
        avgGap: parseFloat(item.avg_gap.toString()),
        maxGap: parseFloat(item.max_gap.toString()),
        minGap: parseFloat(item.min_gap.toString()),
        employeeCount: item.employee_count,
      }));
      
      setData(cells);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getHeatmapColor = (gap: number, maxGap: number) => {
    if (gap <= 0) return "bg-green-100 dark:bg-green-900";
    const intensity = Math.min(gap / (maxGap || 5), 1);
    if (intensity < 0.33) return "bg-yellow-100 dark:bg-yellow-900";
    if (intensity < 0.66) return "bg-orange-100 dark:bg-orange-900";
    return "bg-red-100 dark:bg-red-900";
  };

  const getTextColor = (gap: number, maxGap: number) => {
    if (gap <= 0) return "text-green-700 dark:text-green-300";
    const intensity = Math.min(gap / (maxGap || 5), 1);
    if (intensity < 0.33) return "text-yellow-700 dark:text-yellow-300";
    if (intensity < 0.66) return "text-orange-700 dark:text-orange-300";
    return "text-red-700 dark:text-red-300";
  };

  const roles = Array.from(new Set(data.map((d) => d.role))).sort();
  const skills = Array.from(new Set(data.map((d) => d.skill))).sort();
  const maxGap = Math.max(...data.map((d) => d.avgGap), 0);

  const getCellData = (role: string, skill: string) => {
    return data.find((d) => d.role === role && d.skill === skill);
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Skills Gap Analysis</CardTitle>
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
        <CardTitle>Skills Gap Analysis</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Average proficiency gaps across roles and skills. Red indicates larger gaps.
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No gap analysis data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-border bg-muted p-2 text-left font-semibold">
                    Skill
                  </th>
                  {roles.map((role) => (
                    <th
                      key={role}
                      className="border border-border bg-muted p-2 text-center font-semibold max-w-xs"
                    >
                      <div className="font-semibold text-xs break-words">{role}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {skills.map((skill) => (
                  <tr key={skill}>
                    <td className="border border-border bg-muted/50 p-2 font-medium sticky left-0 z-10 max-w-xs">
                      <div className="break-words">{skill}</div>
                    </td>
                    {roles.map((role) => {
                      const cell = getCellData(role, skill);
                      return (
                        <td
                          key={`${role}-${skill}`}
                          className={`border border-border p-2 text-center transition-colors ${
                            cell ? getHeatmapColor(cell.avgGap, maxGap) : "bg-muted/30"
                          }`}
                        >
                          {cell ? (
                            <div className="flex flex-col items-center gap-1">
                              <div
                                className={`font-bold text-sm ${getTextColor(
                                  cell.avgGap,
                                  maxGap
                                )}`}
                              >
                                {cell.avgGap.toFixed(2)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ({cell.employeeCount} emp.)
                              </div>
                            </div>
                          ) : (
                            <div className="text-muted-foreground text-xs">—</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        {!loading && data.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 dark:bg-green-900 border border-border" />
              <span>No Gap (≤ 0)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900 border border-border" />
              <span>Small Gap</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-100 dark:bg-orange-900 border border-border" />
              <span>Medium Gap</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 dark:bg-red-900 border border-border" />
              <span>Large Gap</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
