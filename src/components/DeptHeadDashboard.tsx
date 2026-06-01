import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle, XCircle, RefreshCw, Clock, CalendarDays, User, UserPlus, ChevronDown, ChevronUp, History } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchData, approveRejectDept, addEmployee } from "@/lib/api";
import { toast } from "sonner";
import StatusBadge from "@/components/StatusBadge";
import EmployeeDashboard from "@/components/EmployeeDashboard";

interface Props {
  email: string;
  highlightReqId?: string | null;
}

const INITIAL_SHOW = 4;

const fmtDate = (val: any) => {
  if (!val) return "-";
  const d = new Date(val);
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const emptyEmployee = (deptHeadEmail: string) => ({
  fullName: "",
  email: "",
  department: "",
  role: "Employee",
  jobTitle: "",
  dutyStation: "",
  startDate: "",
  deptHeadEmail,
});

const DeptHeadDashboard = ({ email, highlightReqId }: Props) => {
  const queryClient = useQueryClient();

  const [confirmAction, setConfirmAction] = useState<{
    reqId: string; action: "approve" | "reject"; employeeName: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState(emptyEmployee(email));

  const [showAll, setShowAll] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedReqId, setExpandedReqId] = useState<string | null>(null);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

  const pendingQuery = useQuery({
    queryKey: ["deptPending", email],
    queryFn: () => fetchData("deptPending", email),
  });

  const balanceQuery = useQuery({
    queryKey: ["balances", expandedEmail],
    queryFn: () => fetchData("balances", expandedEmail!),
    enabled: !!expandedEmail,
  });

  const historyQuery = useQuery({
    queryKey: ["deptHistory", email],
    queryFn: () => fetchData("deptHistory", email),
    enabled: showHistory,
  });

  const actionMutation = useMutation({
    mutationFn: (params: { requestId: string; action: "approve" | "reject"; reason?: string }) =>
      approveRejectDept(params.requestId, params.action, params.reason),
    onSuccess: (_, vars) => {
      toast.success(vars.action === "approve"
        ? "Request forwarded to HR for final approval."
        : "Request rejected.");
      queryClient.invalidateQueries({ queryKey: ["deptPending", email] });
      queryClient.invalidateQueries({ queryKey: ["requests", email] });
      setConfirmAction(null);
      setRejectReason("");
      setExpandedReqId(null);
      setExpandedEmail(null);
    },
    onError: () => toast.error("Action failed. Please try again."),
  });

  const addEmployeeMutation = useMutation({
    mutationFn: (data: typeof newEmployee) => addEmployee(data as Record<string, string>),
    onSuccess: () => {
      toast.success("Employee added successfully.");
      setAddOpen(false);
      setNewEmployee(emptyEmployee(email));
    },
    onError: (err: any) => toast.error(err?.message || "Failed to add employee."),
  });

  const pending = pendingQuery.data?.requests || pendingQuery.data?.pending || pendingQuery.data || [];
  const pendingList = Array.isArray(pending)
    ? [...pending].sort((a, b) => {
        const dateA = new Date(a["Start Date"] || a["Start_Date"] || a.start_date || 0);
        const dateB = new Date(b["Start Date"] || b["Start_Date"] || b.start_date || 0);
        return dateB.getTime() - dateA.getTime();
      })
    : [];

  const visibleList = showAll ? pendingList : pendingList.slice(0, INITIAL_SHOW);
  const hiddenCount = pendingList.length - INITIAL_SHOW;

  const field = (key: keyof typeof newEmployee) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setNewEmployee(prev => ({ ...prev, [key]: e.target.value }));

  const toggleExpand = (reqId: string, empEmail: string) => {
    if (expandedReqId === reqId) {
      setExpandedReqId(null);
      setExpandedEmail(null);
    } else {
      setExpandedReqId(reqId);
      setExpandedEmail(empEmail);
    }
  };

  return (
    <div className="space-y-10">

      {/* ── Pending Approvals ─────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">Pending Approvals</h2>
            {pendingList.length > 0 && (
              <Badge variant="destructive" className="rounded-full px-2.5">
                {pendingList.length}
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => pendingQuery.refetch()}
            disabled={pendingQuery.isFetching}
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${pendingQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {pendingQuery.isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : pendingQuery.isError ? (
          <Card className="border shadow-sm">
            <CardContent className="p-8 text-center space-y-3">
              <p className="text-sm text-destructive font-medium">Failed to load pending requests.</p>
              <Button variant="outline" size="sm" onClick={() => pendingQuery.refetch()}>Retry</Button>
            </CardContent>
          </Card>
        ) : pendingList.length === 0 ? (
          <Card className="border shadow-sm">
            <CardContent className="p-10 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <p className="font-medium text-foreground">All caught up!</p>
              <p className="text-sm text-muted-foreground">No pending leave requests from your team.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {visibleList.map((r: any, i: number) => {
              const reqId = r["Request_ID"] || r.Request_ID || r.requestId || r.id || "";
              const isHighlighted = highlightReqId && reqId && String(reqId) === String(highlightReqId);
              const isExpanded = expandedReqId === reqId;
              const employeeName = r.Full_Name || r.full_name || r.Email || r.email || "-";
              const employeeEmail = r.Email || r.email || "";
              const leaveType = r["Leave Type"] || r["Leave_Type"] || r.leave_type || r.leaveType || "-";
              const startDate = fmtDate(r["Start Date"] || r["Start_Date"] || r.start_date);
              const endDate = fmtDate(r["End Date"] || r["End_Date"] || r.end_date);
              const days = r["Days_Requested"] || r.Days_Requested || r.Days || r.days || "-";

              const expandedBalances: any[] = balanceQuery.data?.balances || [];

              return (
                <Card
                  key={i}
                  id={isHighlighted ? "highlighted-request" : undefined}
                  className={`border shadow-sm transition-all cursor-pointer select-none ${
                    isHighlighted ? "ring-2 ring-primary border-primary/40 bg-primary/5" :
                    isExpanded ? "ring-1 ring-primary/30 shadow-md" : "hover:shadow-md"
                  }`}
                  onClick={() => employeeEmail && toggleExpand(reqId, employeeEmail)}
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="space-y-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{employeeName}</p>
                            {employeeEmail && employeeEmail !== employeeName && (
                              <p className="text-xs text-muted-foreground truncate">{employeeEmail}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="font-medium">{leaveType}</Badge>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{days} {Number(days) === 1 ? "day" : "days"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarDays className="w-4 h-4 shrink-0" />
                          <span>{startDate} — {endDate}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {isExpanded
                            ? <><ChevronUp className="w-3.5 h-3.5" /> Hide balance</>
                            : <><ChevronDown className="w-3.5 h-3.5" /> View balance</>
                          }
                        </div>
                      </div>
                      <div
                        className="flex sm:flex-col gap-2 sm:items-end justify-end shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          className="bg-success hover:bg-success/90 text-white gap-1.5 flex-1 sm:flex-none sm:w-28"
                          disabled={!reqId || actionMutation.isPending}
                          onClick={() => setConfirmAction({ reqId, action: "approve", employeeName })}
                        >
                          <CheckCircle className="w-4 h-4" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5 flex-1 sm:flex-none sm:w-28"
                          disabled={!reqId || actionMutation.isPending}
                          onClick={() => setConfirmAction({ reqId, action: "reject", employeeName })}
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </Button>
                      </div>
                    </div>

                    {/* ── Expanded: employee leave balance ── */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t" onClick={(e) => e.stopPropagation()}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                          {employeeName}'s Leave Balance
                        </p>
                        {balanceQuery.isLoading ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading balance…
                          </div>
                        ) : balanceQuery.isError ? (
                          <p className="text-xs text-destructive">Failed to load balance.</p>
                        ) : expandedBalances.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No balance records found.</p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                            {expandedBalances.map((b: any, bi: number) => {
                              const bType = b["Leave Type"] || b.leave_type || b.leaveType || b.type || "Leave";
                              const entitlement = b.Entitlement ?? b.entitlement ?? b.Total ?? b.total ?? 0;
                              const used = b.Used ?? b.used ?? 0;
                              const remaining = b.Remaining ?? b.remaining ?? (entitlement - used);
                              return (
                                <div key={bi} className="bg-muted/60 rounded-lg p-3 text-center">
                                  <p className="text-xs text-muted-foreground truncate mb-1">{bType}</p>
                                  <p className="text-2xl font-bold text-primary leading-none">{remaining}</p>
                                  <p className="text-xs text-muted-foreground mt-1">of {entitlement} days</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {/* ── Show More / Show Less ── */}
            {pendingList.length > INITIAL_SHOW && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowAll(prev => !prev)}
              >
                {showAll
                  ? "Show less"
                  : `Show ${hiddenCount} more request${hiddenCount === 1 ? "" : "s"}`
                }
              </Button>
            )}
          </div>
        )}
      </section>

      {/* ── Team Management ───────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Team Management</h2>
          <Button size="sm" onClick={() => { setNewEmployee(emptyEmployee(email)); setAddOpen(true); }}>
            <UserPlus className="w-4 h-4 mr-1.5" /> Add Employee
          </Button>
        </div>
        <Card className="border shadow-sm">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Use the <strong>Add Employee</strong> button to register a new team member. They will be added
            under your department and can log in immediately.
          </CardContent>
        </Card>
      </section>

      {/* ── Team Request History ──────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Team Request History</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(prev => !prev)}
          >
            {showHistory ? "Hide History" : "Show History"}
          </Button>
        </div>

        {showHistory && (
          historyQuery.isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : historyQuery.isError ? (
            <Card className="border shadow-sm">
              <CardContent className="p-6 text-center space-y-3">
                <p className="text-sm text-destructive">Failed to load history.</p>
                <Button variant="outline" size="sm" onClick={() => historyQuery.refetch()}>Retry</Button>
              </CardContent>
            </Card>
          ) : (historyQuery.data?.requests || []).length === 0 ? (
            <Card className="border shadow-sm">
              <CardContent className="p-8 text-center text-muted-foreground text-sm">
                No historical requests found for your team.
              </CardContent>
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
                  {(historyQuery.data?.requests || []).map((r: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell>
                        <p className="font-medium truncate max-w-[160px]">{r.Full_Name || r.Email || "-"}</p>
                        {r.Full_Name && r.Email && (
                          <p className="text-xs text-muted-foreground truncate max-w-[160px]">{r.Email}</p>
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

      {/* ── My Own Leave ──────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold mb-4">My Leave</h2>
        <EmployeeDashboard email={email} highlightReqId={highlightReqId} />
      </section>

      {/* ── Approve / Reject Confirmation ─────────────────── */}
      <Dialog
        open={!!confirmAction}
        onOpenChange={(open) => { if (!open) { setConfirmAction(null); setRejectReason(""); } }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmAction?.action === "approve"
                ? <><CheckCircle className="w-5 h-5 text-success" /> Approve Leave Request</>
                : <><XCircle className="w-5 h-5 text-destructive" /> Reject Leave Request</>}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.action === "approve"
                ? "Approving will forward this request to HR for final review."
                : `Please provide a reason so ${confirmAction?.employeeName} knows why their request was declined.`}
            </DialogDescription>
          </DialogHeader>
          {confirmAction?.action === "reject" && (
            <div className="space-y-2">
              <Label>Reason <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="e.g. Team is short-staffed during that period..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[100px]"
                autoFocus
              />
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setConfirmAction(null); setRejectReason(""); }}>
              Cancel
            </Button>
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
              {confirmAction?.action === "approve" ? "Yes, Approve" : "Yes, Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Employee Dialog ────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) setNewEmployee(emptyEmployee(email)); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> Add Team Member
            </DialogTitle>
            <DialogDescription>
              The employee will be registered under your department and can log in right away.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newEmployee.fullName.trim() || !newEmployee.email.trim() || !newEmployee.department.trim()) {
                toast.error("Full name, email and department are required.");
                return;
              }
              addEmployeeMutation.mutate(newEmployee);
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-2">
                <Label>Full Name <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. Jane Doe" value={newEmployee.fullName} onChange={field("fullName")} required />
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Email <span className="text-destructive">*</span></Label>
                <Input type="email" placeholder="e.g. jane@musana.org" value={newEmployee.email} onChange={field("email")} required />
              </div>

              <div className="space-y-2">
                <Label>Department <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. Finance" value={newEmployee.department} onChange={field("department")} required />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newEmployee.role} onValueChange={(v) => setNewEmployee(prev => ({ ...prev, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Employee">Employee</SelectItem>
                    <SelectItem value="Dept Head">Dept Head</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input placeholder="e.g. Accountant" value={newEmployee.jobTitle} onChange={field("jobTitle")} />
              </div>

              <div className="space-y-2">
                <Label>Duty Station</Label>
                <Input placeholder="e.g. Kampala" value={newEmployee.dutyStation} onChange={field("dutyStation")} />
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={newEmployee.startDate} onChange={field("startDate")} />
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Your Email (Dept Head)</Label>
                <Input value={newEmployee.deptHeadEmail} disabled className="bg-muted text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Auto-filled — links this employee to your department.</p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={addEmployeeMutation.isPending}>
                {addEmployeeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Employee
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default DeptHeadDashboard;
