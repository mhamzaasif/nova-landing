import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, BookOpen, TrendingUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { LearningPathRecommendation } from "@shared/api";

export default function LearningPathRecommendations() {
  const [data, setData] = useState<LearningPathRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/dashboard/learning-paths");
      if (!response.ok)
        throw new Error("Failed to fetch learning path recommendations");
      const recommendations: LearningPathRecommendation[] =
        await response.json();
      setData(recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  // Group by employee
  const groupedByEmployee = data.reduce(
    (acc, item) => {
      const key = `${item.employee_id}-${item.role_id}`;
      if (!acc[key]) {
        acc[key] = {
          employee_id: item.employee_id,
          employee_name: item.employee_name,
          role_id: item.role_id,
          role_name: item.role_name,
          recommendations: [],
        };
      }
      acc[key].recommendations.push(item);
      return acc;
    },
    {} as Record<
      string,
      {
        employee_id: number;
        employee_name: string;
        role_id: number;
        role_name: string;
        recommendations: LearningPathRecommendation[];
      }
    >
  );

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Learning Path Recommendations</CardTitle>
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
          <TrendingUp className="h-5 w-5" />
          Continuous Learning Path Recommendations
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Personalized learning recommendations based on skill gaps and role requirements
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
            <p>No learning path recommendations available - all employees are on track!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              {Object.values(groupedByEmployee).map((group, idx) => (
                <AccordionItem key={idx} value={`employee-${group.employee_id}`}>
                  <AccordionTrigger>
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="text-left">
                        <div className="font-semibold">{group.employee_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {group.role_name} • {group.recommendations.length} skill(s) need improvement
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      {group.recommendations
                        .sort((a, b) => b.gap - a.gap)
                        .map((rec, recIdx) => (
                          <Card key={recIdx} className="border-l-4 border-l-primary">
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                    <h4 className="font-semibold">{rec.skill_name}</h4>
                                    <Badge className={getPriorityColor(rec.priority)}>
                                      {rec.priority.toUpperCase()} Priority
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground space-y-1">
                                    <p>
                                      Current Level: <span className="font-semibold text-foreground">{rec.current_level}</span> → Target Level: <span className="font-semibold text-foreground">{rec.target_level}</span>
                                    </p>
                                    <p>
                                      Gap: <span className="font-semibold text-foreground">{rec.gap.toFixed(1)}</span> levels
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {rec.recommended_trainings &&
                              rec.recommended_trainings.length > 0 ? (
                                <div className="mt-4 pt-4 border-t">
                                  <p className="text-sm font-semibold mb-2">
                                    Recommended Trainings:
                                  </p>
                                  <div className="space-y-2">
                                    {rec.recommended_trainings.map((training, tIdx) => (
                                      <div
                                        key={tIdx}
                                        className="p-3 bg-muted rounded-lg text-sm"
                                      >
                                        <div className="font-medium">
                                          {training.training_name}
                                        </div>
                                        <div className="text-muted-foreground text-xs mt-1">
                                          {training.provider} • {training.duration_hours} hours
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                                  No specific training recommendations available. Consider general skill development resources.
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}

        {/* Summary Stats */}
        {!loading && data.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                Total Recommendations
              </p>
              <p className="text-2xl font-bold text-foreground">{data.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                High Priority
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {data.filter((r) => r.priority === "high").length}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                Employees Needing Training
              </p>
              <p className="text-2xl font-bold text-foreground">
                {Object.keys(groupedByEmployee).length}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                Avg Gap
              </p>
              <p className="text-2xl font-bold text-foreground">
                {(
                  data.reduce((sum, r) => sum + r.gap, 0) / data.length
                ).toFixed(1)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

