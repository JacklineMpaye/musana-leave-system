import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchData } from "@/lib/api";
import EmployeeDashboard from "@/components/EmployeeDashboard";
import DeptHeadDashboard from "@/components/DeptHeadDashboard";
import HRDashboard from "@/components/HRDashboard";

interface DashboardProps {
  email: string;
  onLogout: () => void;
  highlightReqId?: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  department_head: "Dept Head",
  employee:        "Employee",
  hr:              "HR",
};

const Dashboard = ({ email, onLogout, highlightReqId }: DashboardProps) => {
  const loginQuery = useQuery({
    queryKey: ["login", email],
    queryFn:  () => fetchData("login", email),
    retry:    1,
  });

  const role           = loginQuery.data?.role || "employee";
  const roleLabel      = ROLE_LABELS[role] || role;
  const loginError     = loginQuery.isError
    ? (loginQuery.error as any)?.message || "Failed to load"
    : null;

  useEffect(() => {
    if (highlightReqId && !loginQuery.isLoading) {
      setTimeout(() => {
        document.getElementById("highlighted-request")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 500);
    }
  }, [highlightReqId, loginQuery.isLoading]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-card border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">Musana Leave System</h1>
          <div className="flex items-center gap-3">
            {!loginQuery.isLoading && (
              <Badge variant="secondary" className="hidden sm:flex">
                <Shield className="w-3 h-3 mr-1" />
                {roleLabel}
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {loginQuery.isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
          </div>
        ) : loginError ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-sm text-destructive font-medium text-center max-w-sm">
              {loginQuery.data?.error || "Could not load your profile. Make sure you are registered in the system."}
            </p>
            <Button variant="outline" size="sm" onClick={() => loginQuery.refetch()}>
              Retry
            </Button>
          </div>
        ) : role === "hr" ? (
          <HRDashboard email={email} highlightReqId={highlightReqId} />
        ) : role === "department_head" ? (
          <DeptHeadDashboard email={email} highlightReqId={highlightReqId} />
        ) : (
          <EmployeeDashboard email={email} highlightReqId={highlightReqId} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
