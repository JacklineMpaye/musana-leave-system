import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, LogOut } from "lucide-react";
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

const Dashboard = ({ email, onLogout, highlightReqId }: DashboardProps) => {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", email],
    queryFn: () => fetchData("dashboard", email),
  });

  const role: string = dashboardQuery.data?.role || dashboardQuery.data?.Role || "Employee";
  const normalizedRole = role.toLowerCase().trim();

  // Scroll to highlighted request after data loads
  useEffect(() => {
    if (highlightReqId && !dashboardQuery.isLoading) {
      setTimeout(() => {
        document.getElementById("highlighted-request")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 500);
    }
  }, [highlightReqId, dashboardQuery.isLoading]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-card border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">Musana Leave System</h1>
          <div className="flex items-center gap-3">
            {!dashboardQuery.isLoading && (
              <Badge variant="secondary" className="hidden sm:flex">
                <Shield className="w-3 h-3 mr-1" />
                {role}
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
        {dashboardQuery.isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : normalizedRole === "hr" ? (
          <HRDashboard email={email} highlightReqId={highlightReqId} />
        ) : normalizedRole === "dept head" || normalizedRole === "department head" ? (
          <DeptHeadDashboard email={email} highlightReqId={highlightReqId} />
        ) : (
          <EmployeeDashboard email={email} highlightReqId={highlightReqId} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
