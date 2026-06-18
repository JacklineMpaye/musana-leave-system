import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, CheckCircle, XCircle, Users, Clock, CalendarCheck,
  RefreshCw, History, Search, LayoutDashboard, UsersRound,
} from "lucide-react";
import { fetchData, approveRejectHR } from "@/lib/api";
import { toast } from "sonner";
import StatusBadge from "@/components/StatusBadge";
import EmployeeDashboard from "@/components/EmployeeDashboard";
import HREmployeePage from "@/components/HREmployeePage";

interface Props {
  email: string;
  highlightReqId?: string | null;
}

const fmtDate = (val: any) => {
  if (!val) return "-";
  const d = new Date(val);
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const TABS = [
  { id: "overview",  label: "Overview",            icon: LayoutDashboard },
  { id: "employees", label: "Employee Management", icon: UsersRound },
] as const;
type TabId = typeof TABS[number]["id"];

const HRDashboard = ({ email, highlightReqId }: Props) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const [confirmAction, setConfirmAction] = useState<{ reqId: string; action: "approve" | "reject" } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [searchPending, setSearchPending] = useState("");

  const pendingQuery  = useQuery({ queryKey: ["hrPending"],  queryFn: () => fetchData("hrPending") });
  const overviewQuery = useQuery({ queryKey: ["hrOverview"], queryFn: () => fetchData("hrOverview") });
  const hrHistoryQuery = useQuery({
    queryKey: ["hrHistory"],
    queryFn:  () => fetchData("hrHistory"),
    enabled:  showHistory,
  });

  const actionMutation = useMutation({
    mutationFn: (p: { requestId: string; action: "approve" | "reject"; reason?: string }) =>
      approveRejectHR(p.requestId, p.action, p.reason),
    onSuccess: () => {
      toast.success("Action completed successfully");
      queryClient.invalidateQueries({ queryKey: ["hrPending"] });
      queryClient.invalidateQueries({ queryKey: ["hrHistory"] });
      queryClient.invalidateQueries({ queryKey: ["hrOverview"] });
      setConfirmAction(null);
      setRejectReason("");
    },
    onError: () => toast.error("Action failed."),
  });

  // ── derived ─────────────────────────────────────────────────
  const pending = pendingQuery.data?.requests || pendingQuery.data?.pending || pendingQuery.data || [];
  const pendingList: any[] = Array.isArray(pending)
    ? [...pending].sort((a, b) =>
        new Date(b["Start Date"] || b["Start_Date"] || 0).getTime() -
        new Date(a["Start Date"] || a["Start_Date"] || 0).getTime()
      )
    : [];

  const filteredPending = searchPending.trim()
    ? pendingList.filter(r =>
        [r.Email, r.email, r["Leave Type"], r["Leave_Type"], r.Full_Name, r.full_name]
          .some(v => (v || "").toLowerCase().includes(searchPending.toLowerCase()))
      )
    : pendingList;

  const overview          = overviewQuery.data || {};
  const totalEmployees    = overview.totalEmployees    ?? overview["Total Employees"]    ?? "-";
  const totalPending      = overview.totalPending      ?? overview["Total Pending"]      ?? "-";
  const approvedThisMonth = overview.approvedThisMonth ?? overview["Approved This Month"] ?? "-";

  const historyList: any[] = hrHistoryQuery.data?.requests || [];

  return (
    <div className="space-y-6">

      {/* Tab navigation */}
      <div className="flex gap-1 border-b">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── Employees tab ─────────────────────────────────────── */}
      {activeTab === "employees" && <HREmployeePage hrEmail={email} />}

      {/* ── Overview tab ──────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-8">

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Total Employees",     value: totalEmployees,    icon: Users,         color: "text-primary" },
              { label: "Total Pending",       value: totalPending,      icon: Clock,         color: "text-warning" },
              { label: "Approved This Month", value: approvedThisMonth, icon: CalendarCheck, color: "text-success" },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label} className="shadow-sm border">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pending HR Approvals */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">Pending HR Approvals</h3>
                {pendingList.length > 0 && (
                  <Badge variant="destructive" className="rounded-full px-2.5">{pendingList.length}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search…"
                    value={searchPending}
                    onChange={e => setSearchPending(e.target.value)}
                    className="pl-8 h-8 w-40 text-sm"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => pendingQuery.refetch()} disabled={pendingQuery.isFetching}>
                  <RefreshCw className={`w-4 h-4 mr-1.5 ${pendingQuery.isFetching ? "animate-spin" : ""}`} /> Refresh
                </Button>
              </div>
            </div>

            {pendingQuery.isLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : pendingQuery.isError ? (
              <Card className="shadow-sm border">
                <CardContent className="p-8 text-center space-y-3">
                  <p className="text-sm text-destructive">Failed to load pending requests.</p>
                  <Button variant="outline" size="sm" onClick={() => pendingQuery.refetch()}>Retry</Button>
                </CardContent>
              </Card>
            ) : filteredPending.length === 0 ? (
              <Card className="shadow-sm border">
                <CardContent className="p-8 text-center text-muted-foreground">
                  {searchPending ? "No matching requests." : "No pending HR requests."}
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-sm overflow-hidden border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPending.map((r: any, i: number) => {
                      const reqId = r["Request_ID"] || r.Request_ID || r.requestId || r.id || "";
                      const isHighlighted = highlightReqId && reqId && String(reqId) === String(highlightReqId);
                      return (
                        <TableRow
                          key={i}
                          id={isHighlighted ? "highlighted-request" : undefined}
                          className={isHighlighted ? "bg-primary/10 ring-2 ring-primary/30" : ""}
                        >
                          <TableCell>
                            <p className="font-medium">{r.Full_Name || r.full_name || r.Email || r.email || "-"}</p>
                            {(r.Full_Name || r.full_name) && (r.Email || r.email) && (
                              <p className="text-xs text-muted-foreground">{r.Email || r.email}</p>
                            )}
                          </TableCell>
                          <TableCell>{r["Leave Type"] || r["Leave_Type"] || r.leave_type || "-"}</TableCell>
                          <TableCell className="text-sm">
                            {fmtDate(r["Start Date"] || r["Start_Date"] || r.start_date)} — {fmtDate(r["End Date"] || r["End_Date"] || r.end_date)}
                          </TableCell>
                          <TableCell>{r["Days_Requested"] || r.Days_Requested || r.Days || r.days || "-"}</TableCell>
                          <TableCell><StatusBadge status={r.Status || r.status || "Pending"} /></TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm" variant="outline"
                              className="text-success border-success/30 hover:bg-success/10"
                              disabled={!reqId}
                              onClick={() => setConfirmAction({ reqId, action: "approve" })}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm" variant="outline"
                              className="text-destructive border-destructive/30 hover:bg-destructive/10"
                              disabled={!reqId}
                              onClick={() => setConfirmAction({ reqId, action: "reject" })}
                            >
                              <XCircle className="w-4 h-4 mr-1" /> Reject
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}
          </section>

          {/* All Requests History */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">All Requests History</h3>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowHistory(prev => !prev)}>
                {showHistory ? "Hide History" : "Show History"}
              </Button>
            </div>

            {showHistory && (
              hrHistoryQuery.isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : hrHistoryQuery.isError ? (
                <Card className="border shadow-sm">
                  <CardContent className="p-6 text-center space-y-3">
                    <p className="text-sm text-destructive">Failed to load history.</p>
                    <Button variant="outline" size="sm" onClick={() => hrHistoryQuery.refetch()}>Retry</Button>
                  </CardContent>
                </Card>
              ) : historyList.length === 0 ? (
                <Card className="border shadow-sm">
                  <CardContent className="p-8 text-center text-muted-foreground text-sm">No completed requests found.</CardContent>
                </Card>
              ) : (
                <Card className="border shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyList.map((r: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell>
                            <p className="font-medium">{r.Full_Name || r["Full_Name"] || r.Email || "-"}</p>
                            {(r.Full_Name || r["Full_Name"]) && r.Email && (
                              <p className="text-xs text-muted-foreground">{r.Email}</p>
                            )}
                          </TableCell>
                          <TableCell>{r["Leave Type"] || "-"}</TableCell>
                          <TableCell>{fmtDate(r["Start Date"])}</TableCell>
                          <TableCell>{fmtDate(r["End Date"])}</TableCell>
                          <TableCell>{r.Days_Requested || "-"}</TableCell>
                          <TableCell><StatusBadge status={r.Status || ""} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )
            )}
          </section>

          {/* My Leave */}
          <section>
            <h3 className="text-lg font-semibold mb-4">My Leave</h3>
            <EmployeeDashboard email={email} highlightReqId={highlightReqId} />
          </section>

          {/* Approve / Reject Confirm Dialog */}
          <Dialog
            open={!!confirmAction}
            onOpenChange={open => { if (!open) { setConfirmAction(null); setRejectReason(""); } }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm {confirmAction?.action === "approve" ? "Approval" : "Rejection"}</DialogTitle>
                <DialogDescription>Are you sure? This action cannot be undone.</DialogDescription>
              </DialogHeader>
              {confirmAction?.action === "reject" && (
                <div className="my-4">
                  <Label htmlFor="reject-reason" className="block text-sm font-medium mb-2">
                    Reason for Rejection <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="reject-reason"
                    placeholder="Please provide a reason for rejecting this request"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              )}
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => { setConfirmAction(null); setRejectReason(""); }}>Cancel</Button>
                <Button
                  variant={confirmAction?.action === "approve" ? "default" : "destructive"}
                  disabled={actionMutation.isPending || (confirmAction?.action === "reject" && !rejectReason.trim())}
                  onClick={() => {
                    if (!confirmAction) return;
                    if (confirmAction.action === "reject" && !rejectReason.trim()) {
                      toast.error("Please provide a reason for rejection");
                      return;
                    }
                    actionMutation.mutate({
                      requestId: confirmAction.reqId,
                      action: confirmAction.action,
                      reason: confirmAction.action === "reject" ? rejectReason : undefined,
                    });
                  }}
                >
                  {actionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {confirmAction?.action === "approve" ? "Approve" : "Reject"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      )}

    </div>
  );
};

export default HRDashboard;
