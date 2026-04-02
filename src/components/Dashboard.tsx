import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Mail, Shield, RefreshCw } from "lucide-react";

const API_URL = "https://script.googleusercontent.com/a/macros/musana.org/echo?user_content_key=AWDtjMW-bMc_cnEHwHcdvEwAJIwh1kWqIpuATziuaFbTYP7mGeMvUlxEk2NAeUa1xnHf_VLgOMBX4VMKPAG56A5gzntLrR8-x_fpOt-btUhQmME4qCyOUdnvYChywxV7z9yOBe9W95cNcCut1NG17OxlI8krfjAokpV0EpE-ablHlqGijJO1afnRT8NP68aECloGMdymPZB58WqYBxR-1cdHf-EICoBtMp1VK4wVhthiBZwK2OdHN4YQKHa9WgXVggt0K243UJMjyjGtH2P0dBDa3gvaCubpOxuswFJQxevUYbxP6JhDqRbzyGzsakr1NqqgK5Ez1a1w&lib=M4EE4T2ANSJcEFgHrCPc03k0LTOfyky5F";

const fetchData = async (action: string, email: string) => {
  const res = await fetch(`${API_URL}&action=${action}&email=${encodeURIComponent(email)}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

interface DashboardProps {
  email: string;
}

const Dashboard = ({ email }: DashboardProps) => {
  const [modalOpen, setModalOpen] = useState(false);

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", email],
    queryFn: () => fetchData("dashboard", email),
  });

  const balancesQuery = useQuery({
    queryKey: ["balances", email],
    queryFn: () => fetchData("balances", email),
  });

  const requestsQuery = useQuery({
    queryKey: ["requests", email],
    queryFn: () => fetchData("requests", email),
  });

  const isLoading = dashboardQuery.isLoading || balancesQuery.isLoading || requestsQuery.isLoading;

  const refetchAll = () => {
    dashboardQuery.refetch();
    balancesQuery.refetch();
    requestsQuery.refetch();
  };

  const handleCloseRefresh = () => {
    setModalOpen(false);
    refetchAll();
  };

  const role = dashboardQuery.data?.role || dashboardQuery.data?.Role || "Employee";
  const balances = balancesQuery.data?.balances || balancesQuery.data?.Balances || balancesQuery.data || [];
  const requests = requestsQuery.data?.requests || requestsQuery.data?.Requests || requestsQuery.data || [];

  const balanceList = Array.isArray(balances) ? balances : [];
  const requestList = Array.isArray(requests) ? requests : [];

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "approved") return "bg-success text-success-foreground";
    if (s === "pending") return "bg-warning text-warning-foreground";
    if (s === "rejected") return "bg-destructive text-destructive-foreground";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-card border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-bold text-foreground">Musana Leave System</h1>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="hidden sm:flex">
              <Shield className="w-3 h-3 mr-1" />
              {role}
            </Badge>
            <Button onClick={() => setModalOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Request Leave</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* User Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="shadow-sm">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">My Email</p>
                    <p className="text-sm font-semibold truncate">{email}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">My Role</p>
                    <p className="text-sm font-semibold">{role}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Leave Balances */}
            <section>
              <h2 className="text-lg font-semibold mb-3">Leave Balance</h2>
              {balanceList.length === 0 ? (
                <Card className="shadow-sm">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No leave balance records found.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {balanceList.map((b: any, i: number) => {
                    const type = b["Leave Type"] || b.leaveType || b.type || "Leave";
                    const entitlement = b.Entitlement ?? b.entitlement ?? b.total ?? 0;
                    const used = b.Used ?? b.used ?? 0;
                    const remaining = b.Remaining ?? b.remaining ?? (entitlement - used);

                    return (
                      <Card key={i} className="shadow-sm">
                        <CardContent className="p-5">
                          <p className="text-sm text-muted-foreground font-medium mb-1">{type}</p>
                          <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-3xl font-bold text-primary">{remaining}</span>
                            <span className="text-xs text-muted-foreground">remaining</span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Entitlement: {entitlement}</span>
                            <span>Used: {used}</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Leave Requests */}
            <section>
              <h2 className="text-lg font-semibold mb-3">My Leave Requests</h2>
              {requestList.length === 0 ? (
                <Card className="shadow-sm">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No leave requests found.
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requestList.map((r: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">
                            {r["Leave Type"] || r.leaveType || r.type || "-"}
                          </TableCell>
                          <TableCell>
                            {r["Start Date"] || r.startDate || r.start || "-"}
                          </TableCell>
                          <TableCell>
                            {r["End Date"] || r.endDate || r.end || "-"}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(r.Status || r.status || "")}`}>
                              {r.Status || r.status || "-"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </section>
          </>
        )}
      </main>

      {/* Request Leave Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Leave</DialogTitle>
          </DialogHeader>
          <iframe
            src="https://docs.google.com/forms/d/e/1FAIpQLSeQzQ3LqqZiuJUCyoO_Pk1aahEq_RImtCdpM4G06hGO0mPXww/viewform?embedded=true"
            width="100%"
            height="700"
            style={{ border: "none" }}
            title="Leave Request Form"
          />
          <Button onClick={handleCloseRefresh} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Close & Refresh
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
