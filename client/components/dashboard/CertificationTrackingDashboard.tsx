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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CertificationTracking } from "@shared/api";

export default function CertificationTrackingDashboard() {
  const [data, setData] = useState<CertificationTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchCertifications();
  }, [filter]);

  const fetchCertifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = filter === "all" ? undefined : filter;
      const url = status
        ? `/api/dashboard/certification-tracking?status=${status}`
        : "/api/dashboard/certification-tracking";
      const response = await fetch(url);
      if (!response.ok)
        throw new Error("Failed to fetch certification tracking");
      const certifications: CertificationTracking[] = await response.json();
      setData(certifications);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "expired":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            Expired
          </Badge>
        );
      case "expiring_soon":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Expiring Soon
          </Badge>
        );
      case "valid":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Valid
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const expired = data.filter((c) => c.status === "expired");
  const expiringSoon = data.filter((c) => c.status === "expiring_soon");
  const valid = data.filter((c) => c.status === "valid");
  const critical = data.filter((c) => c.is_critical);

  const renderTable = (tableData: CertificationTracking[]) => {
    if (loading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      );
    }
    if (tableData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <p>No certifications found</p>
        </div>
      );
    }
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Certification</TableHead>
              <TableHead className="text-center">Critical</TableHead>
              <TableHead className="text-center">Issue Date</TableHead>
              <TableHead className="text-center">Expiry Date</TableHead>
              <TableHead className="text-center">Days Until Expiry</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-semibold">
                  {item.employee_name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.department || "—"}
                </TableCell>
                <TableCell>{item.cert_name}</TableCell>
                <TableCell className="text-center">
                  {item.is_critical ? (
                    <Badge variant="destructive">Critical</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {new Date(item.issue_date).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-center">
                  {item.expiry_date
                    ? new Date(item.expiry_date).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell className="text-center">
                  {item.days_until_expiry !== null &&
                  item.days_until_expiry !== undefined ? (
                    <span
                      className={
                        item.days_until_expiry < 0
                          ? "text-red-600 dark:text-red-400 font-semibold"
                          : item.days_until_expiry <= 30
                          ? "text-yellow-600 dark:text-yellow-400 font-semibold"
                          : "text-muted-foreground"
                      }
                    >
                      {item.days_until_expiry < 0
                        ? `Expired ${Math.abs(item.days_until_expiry)} days ago`
                        : `${item.days_until_expiry} days`}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {getStatusBadge(item.status)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Certification Tracking</CardTitle>
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
        <CardTitle>Certification Tracking</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Track employee certifications, expiry dates, and compliance status
        </p>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 border rounded-lg">
              <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">
                Total Certifications
              </p>
              <p className="text-2xl font-bold">{data.length}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">
                Valid
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {valid.length}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">
                Expiring Soon
              </p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {expiringSoon.length}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">
                Expired
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {expired.length}
              </p>
            </div>
          </div>
        )}

        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All ({data.length})</TabsTrigger>
            <TabsTrigger value="valid">Valid ({valid.length})</TabsTrigger>
            <TabsTrigger value="expiring_soon">
              Expiring Soon ({expiringSoon.length})
            </TabsTrigger>
            <TabsTrigger value="expired">Expired ({expired.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {renderTable(data)}
          </TabsContent>
          <TabsContent value="valid" className="mt-4">
            {renderTable(valid)}
          </TabsContent>
          <TabsContent value="expiring_soon" className="mt-4">
            {renderTable(expiringSoon)}
          </TabsContent>
          <TabsContent value="expired" className="mt-4">
            {renderTable(expired)}
          </TabsContent>
        </Tabs>

        {/* Critical Certifications Alert */}
        {!loading && critical.length > 0 && (
          <Alert className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Critical Certifications:</strong> {critical.length} critical
              certification(s) require attention. Ensure compliance is maintained.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

