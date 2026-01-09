import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { AnalyticsTrends } from "@shared/api";
import AppLayout from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import GapAnalysisHeatmap from "@/components/dashboard/GapAnalysisHeatmap";
import RoleReadinessOverview from "@/components/dashboard/RoleReadinessOverview";
import TrainingNeedsTable from "@/components/dashboard/TrainingNeedsTable";
import CertificationMetrics from "@/components/dashboard/CertificationMetrics";
import TrainingMetrics from "@/components/dashboard/TrainingMetrics";
import InitialCompetencyAssessment from "@/components/dashboard/InitialCompetencyAssessment";
import CertificationTrackingDashboard from "@/components/dashboard/CertificationTrackingDashboard";
import LearningPathRecommendations from "@/components/dashboard/LearningPathRecommendations";
import SkillsInventoryDashboard from "@/components/dashboard/SkillsInventoryDashboard";
import TeamCapabilityHeatmap from "@/components/dashboard/TeamCapabilityHeatmap";
import SuccessionPlanning from "@/components/dashboard/SuccessionPlanning";
import ResourceAllocationOptimization from "@/components/dashboard/ResourceAllocationOptimization";

export default function Dashboard() {
  const [trends, setTrends] = useState<AnalyticsTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/assessments/analytics/trends");
      if (!response.ok) throw new Error("Failed to fetch trends");
      const data = await response.json();
      setTrends(data);
      // Show first 3 employees by default
      const employeeIds = Object.keys(data.employees).slice(0, 3);
      setSelectedEmployees(employeeIds.map(Number));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <AppLayout>
        <div className="p-6">
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-destructive">Error: {error}</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Competency Dashboard</h1>
          <p className="text-muted-foreground">
            View skills assessment, gaps analysis, and training needs across your organization
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {trends ? Object.keys(trends.employees).length : "-"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Assessments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {trends ? trends.general.length : "-"}
              </div>
            </CardContent>
          </Card>

          {/* <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Proficiency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {trends && trends.general.length > 0
                  ? (
                      trends.general.reduce((sum, item) => sum + item.proficiency, 0) /
                      trends.general.length
                    ).toFixed(1)
                  : "-"}%
              </div>
            </CardContent>
          </Card> */}

          <CertificationMetrics />
          <TrainingMetrics />
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="gaps" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            {/* <TabsTrigger value="assessment">Assessment</TabsTrigger> */}
            <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
            <TabsTrigger value="readiness">Readiness</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="capacity">Capacity</TabsTrigger>
            <TabsTrigger value="planning">Planning</TabsTrigger>
          </TabsList>

          {/* Skills Assessment & Tracking Tab */}
          <TabsContent value="assessment" className="space-y-6">
            <div className="space-y-6">
              {/* Overall Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Overall Proficiency Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-96 flex items-center justify-center">
                      <Skeleton className="h-96 w-full" />
                    </div>
                  ) : trends && trends.general.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trends.general}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="proficiency"
                          stroke="hsl(200 100% 40%)"
                          dot={{ fill: "hsl(200 100% 40%)" }}
                          name="Average Proficiency (%)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-96 text-muted-foreground">
                      <p>No assessment data available yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Individual Employee Trends */}
              {trends && Object.keys(trends.employees).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="mb-4">Individual Employee Trends</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(trends.employees).map(([empId, data]) => (
                        <button
                          key={empId}
                          onClick={() =>
                            setSelectedEmployees((prev) =>
                              prev.includes(Number(empId))
                                ? prev.filter((id) => id !== Number(empId))
                                : [...prev, Number(empId)]
                            )
                          }
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            selectedEmployees.includes(Number(empId))
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {data.employee.name}
                        </button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedEmployees.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                          data={trends.general.map((item) => ({
                            ...item,
                            ...selectedEmployees.reduce(
                              (acc, empId) => {
                                const empData = trends.employees[empId];
                                const empTrend = empData.trends.find(
                                  (t) => t.date === item.date
                                );
                                if (empTrend) {
                                  acc[empData.employee.name] =
                                    empTrend.proficiency;
                                }
                                return acc;
                              },
                              {} as Record<string, number>
                            ),
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Legend />
                          {selectedEmployees.map((empId, index) => {
                            const empName = trends.employees[empId].employee.name;
                            const colors = [
                              "hsl(280 85% 52%)",
                              "hsl(200 100% 50%)",
                              "hsl(45 93% 47%)",
                              "hsl(0 84% 60%)",
                            ];
                            return (
                              <Line
                                key={empId}
                                type="monotone"
                                dataKey={empName}
                                stroke={colors[index % colors.length]}
                                dot={{
                                  fill: colors[index % colors.length],
                                }}
                              />
                            );
                          })}
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-96 text-muted-foreground">
                        <p>Select employees to view their trends</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Initial Competency Assessment */}
              <InitialCompetencyAssessment />

              {/* Certification Tracking */}
              <CertificationTrackingDashboard />

              {/* Learning Path Recommendations */}
              <LearningPathRecommendations />
            </div>
          </TabsContent>

          {/* Gap Analysis Tab */}
          <TabsContent value="gaps">
            <GapAnalysisHeatmap />
          </TabsContent>

          {/* Role Readiness Tab */}
          <TabsContent value="readiness">
            <RoleReadinessOverview />
          </TabsContent>

          {/* Training Needs Tab */}
          <TabsContent value="training" className="space-y-6">
            <TrainingNeedsTable />
            <LearningPathRecommendations />
          </TabsContent>

          {/* Team Capacity Planning Tab */}
          <TabsContent value="capacity" className="space-y-6">
            <SkillsInventoryDashboard />
            <TeamCapabilityHeatmap />
          </TabsContent>

          {/* Planning Tab */}
          <TabsContent value="planning" className="space-y-6">
            <SuccessionPlanning />
            <ResourceAllocationOptimization />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
