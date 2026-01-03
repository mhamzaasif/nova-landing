import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/layout/AppLayout";
import { Home, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <AppLayout>
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-destructive/10 p-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground">404</h1>
          <p className="text-xl text-muted-foreground">Page not found</p>
          <p className="text-sm text-muted-foreground max-w-md">
            The page you're looking for doesn't exist. Please navigate back to
            the dashboard or use the menu.
          </p>
          <div className="pt-4">
            <Link to="/">
              <Button className="gap-2">
                <Home className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
