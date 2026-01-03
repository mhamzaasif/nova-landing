import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  Settings,
  ClipboardList,
  Zap,
  Tag,
  Menu,
  X,
  UserCheck,
} from "lucide-react";
import { useState } from "react";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigationItems = [
    { path: "/", label: "Dashboard", icon: BarChart3 },
    { path: "/employees", label: "Employees", icon: Users },
    { path: "/roles", label: "Roles", icon: Settings },
    { path: "/skills", label: "Skills", icon: Tag },
    { path: "/proficiency-levels", label: "Proficiency Levels", icon: Zap },
    { path: "/employee-assignments", label: "Employee Assignments", icon: UserCheck },
    { path: "/assessments", label: "Assessments", icon: ClipboardList },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-sidebar transition-all duration-300 md:static md:z-auto",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between border-b border-sidebar-border px-6 py-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <BarChart3 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-sidebar-foreground">MatrixPro</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden"
            >
              <X className="h-5 w-5 text-sidebar-foreground" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                    isActive(item.path)
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-sidebar-border px-3 py-4">
            <p className="text-xs text-sidebar-foreground/60">
              Compatibility Matrix v1.0
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="font-bold text-foreground">MatrixPro</h1>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 hover:bg-muted rounded-lg"
            >
              <Menu className="h-5 w-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="animate-fade-in">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
