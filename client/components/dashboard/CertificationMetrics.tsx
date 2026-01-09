import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CertMetrics {
  totalCertifications: number;
  criticalCount: number;
  totalAssignments: number;
  expiringCount: number;
}

export default function CertificationMetrics() {
  const [metrics, setMetrics] = useState<CertMetrics>({
    totalCertifications: 0,
    criticalCount: 0,
    totalAssignments: 0,
    expiringCount: 0,
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

      const [certRes, assignRes] = await Promise.all([
        fetch("/api/certifications"),
        fetch("/api/employee-certifications"),
      ]);

      if (!certRes.ok || !assignRes.ok) {
        throw new Error("Failed to fetch metrics");
      }

      const certs = await certRes.json();
      const assignments = await assignRes.json();

      const criticalCount = certs.filter((c: any) => c.is_critical).length;
      const now = new Date();
      const expiringCount = assignments.filter((a: any) => {
        if (!a.expiry_date) return false;
        const expiryDate = new Date(a.expiry_date);
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        return expiryDate <= thirtyDaysFromNow && expiryDate > now;
      }).length;

      setMetrics({
        totalCertifications: certs.length,
        criticalCount,
        totalAssignments: assignments.length,
        expiringCount,
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
          <CardTitle>Certification Overview</CardTitle>
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
          <CardTitle>Certification Overview</CardTitle>
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
        <CardTitle>Certification Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total Certifications</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold">{metrics.totalCertifications}</p>
              {metrics.criticalCount > 0 && (
                <Badge variant="destructive">{metrics.criticalCount} critical</Badge>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total Assignments</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold">{metrics.totalAssignments}</p>
              {metrics.expiringCount > 0 && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  {metrics.expiringCount} expiring
                </Badge>
              )}
            </div>
          </div>
        </div>
        {metrics.expiringCount > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ {metrics.expiringCount} certification(s) expiring within 30 days
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
