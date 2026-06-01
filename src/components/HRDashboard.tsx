import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle, XCircle, Users, Clock, CalendarCheck, UserPlus } from "lucide-react";
import { fetchData, addEmployee, approveRejectHR } from "@/lib/api";
import { toast } from "sonner";
import StatusBadge from "@/components/StatusBadge";

interface Props {
  email: string;
  highlightReqId?: string | null;
}

const HRDashboard = ({ highlightReqId }: Props) => {
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<{ reqId: string; action: "approve" | "reject"; reason?: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ fullName: "", email: "", department: "", role: "Employee", deptHeadEmail: "" });

  const pendingQuery = useQuery({ queryKey: ["hrPending"], queryFn: () => fetchData("hrPending") });
  const overviewQuery = useQuery({ queryKey: ["hrOverview"], queryFn: () => fetchData("hrOverview") });
  const allBalancesQuery = useQuery({ queryKey: ["allBalances"], queryFn: () => fetchData("allBalances") });

  const actionMutation = useMutation({
    mutationFn: (params: { requestId: string; action: "approve" | "reject"; reason?: string }) =>
      approveRejectHR(params.requestId, params.action, params.reason),
    onSuccess: () => {
      toast.success("Action completed successfully");
      queryClient.invalidateQueries({ queryKey: ["hrPending"] });
      setConfirmAction(null);
      setRejectReason("");
    },
    onError: () => toast.error("Action failed."),
  });

  const addEmployeeMutation = useMutation({
    mutationFn: (data: typeof newEmployee) => addEmployee(data as Record<string, string>),
    onSuccess: () => {
      toast.success("Employee added/updated successfully");
      queryClient.invalidateQueries({ queryKey: ["allBalances"] });
      queryClient.invalidateQueries({ queryKey: ["hrOverview"] });
      setAddEmployeeOpen(false);
      setNewEmployee({ fullName: "", email: "", department: "", role: "Employee", deptHeadEmail: "" });
    },
    onError: () => toast.error("Failed to add employee."),
  });

  const fmtDate = (val: any) => {
    if (!val) return "-";
    const d = new Date(val);
    return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const pending = pendingQuery.data?.requests || pendingQuery.data?.pending || pendingQuery.data || [];
  const pendingList = Array.isArray(pending)
    ? [...pending].sort((a, b) => {
        const dateA = new Date(a["Start Date"] || a["Start_Date"] || a.start_date || 0);
        const dateB = new Date(b["Start Date"] || b["Start_Date"] || b.start_date || 0);
        return dateB.getTime() - dateA.getTime();
      })
    : [];

  const overview = overviewQuery.data || {};
  const totalEmployees = overview.totalEmployees ?? overview["Total Employees"] ?? "-";
  const totalPending = overview.totalPending ?? overview["Total Pending"] ?? "-";
  const approvedThisMonth = overview.approvedThisMonth ?? overview["Approved This Month"] ?? "-";

  const allBal = allBalancesQuery.data?.balances || allBalancesQuery.data || [];
  const allBalList = Array.isArray(allBal) ? allBal : [];

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">HR Management</h2>

      {/* Org Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Employees", value: totalEmployees, icon: Users, color: "text-primary" },
          { label: "Total Pending", value: totalPending, icon: Clock, color: "text-warning" },
          { label: "Approved This Month", value: approvedThisMonth, icon: CalendarCheck, color: "text-success" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="shadow-sm border">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center`}>
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
        <h3 className="text-lg font-semibold mb-3">Pending HR Approvals</h3>
        {pendingQuery.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : pendingList.length === 0 ? (
          <Card className="shadow-sm border"><CardContent className="p-8 text-center text-muted-foreground">No pending HR requests.</CardContent></Card>
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
                {pendingList.map((r: any, i: number) => {
                  const reqId = r["Request_ID"] || r.Request_ID || r.requestId || r.id || "";
                  const isHighlighted = highlightReqId && reqId && String(reqId) === String(highlightReqId);
                  return (
                    <TableRow key={i} id={isHighlighted ? "highlighted-request" : undefined} className={isHighlighted ? "bg-primary/10 ring-2 ring-primary/30" : ""}>
                      <TableCell className="font-medium">{r.Email || r.email || r.Employee || r.employee || "-"}</TableCell>
                      <TableCell>{r["Leave Type"] || r["Leave_Type"] || r.leave_type || r.leaveType || "-"}</TableCell>
                      <TableCell className="text-sm">
                        {fmtDate(r["Start Date"] || r["Start_Date"] || r.start_date)} — {fmtDate(r["End Date"] || r["End_Date"] || r.end_date)}
                      </TableCell>
                      <TableCell>{r["Days_Requested"] || r.Days_Requested || r.Days || r.days || "-"}</TableCell>
                      <TableCell><StatusBadge status={r.Status || r.status || "Pending"} /></TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" className="text-success border-success/30 hover:bg-success/10" disabled={!reqId} onClick={() => setConfirmAction({ reqId, action: "approve" })}>
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" disabled={!reqId} onClick={() => setConfirmAction({ reqId, action: "reject" })}>
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

      {/* Employee Management */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Employee Management</h3>
          <Button size="sm" onClick={() => setAddEmployeeOpen(true)}>
            <UserPlus className="w-4 h-4 mr-1" /> Add Employee
          </Button>
        </div>
      </section>

      {/* Leave Balance Overview */}
      <section>
        <h3 className="text-lg font-semibold mb-3">Leave Balance Overview</h3>
        {allBalancesQuery.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : allBalList.length === 0 ? (
          <Card className="shadow-sm border"><CardContent className="p-8 text-center text-muted-foreground">No employee balance data.</CardContent></Card>
        ) : (
          <Card className="shadow-sm overflow-hidden border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Entitlement</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Remaining</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allBalList.map((b: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{b.full_name || b.Full_Name || b.Employee || b.employee || b.email || "-"}</TableCell>
                    <TableCell>{b["Leave Type"] || b["Leave_Type"] || b.leave_type || b.leaveType || b.type || "-"}</TableCell>
                    <TableCell>{b.Entitlement ?? b.entitlement ?? b.total ?? "-"}</TableCell>
                    <TableCell>{b.Used ?? b.used ?? "-"}</TableCell>
                    <TableCell className="font-semibold text-primary">{b.Remaining ?? b.remaining ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </section>

      {/* Confirm Dialog */}
      <Dialog 
        open={!!confirmAction} 
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {confirmAction?.action === "approve" ? "Approval" : "Rejection"}</DialogTitle>
            <DialogDescription>Are you sure? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          {confirmAction?.action === "reject" && (
            <div className="my-4">
              <label htmlFor="reject-reason" className="block text-sm font-medium mb-2">
                Reason for Rejection <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="reject-reason"
                placeholder="Please provide a reason for rejecting this request"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setConfirmAction(null);
              setRejectReason("");
            }}>
              Cancel
            </Button>
            <Button 
              variant={confirmAction?.action === "approve" ? "default" : "destructive"} 
              disabled={actionMutation.isPending || (confirmAction?.action === "reject" && !rejectReason.trim())} 
              onClick={() => { 
                if (confirmAction) {
                  if (confirmAction.action === "reject") {
                    if (!rejectReason.trim()) {
                      toast.error("Please provide a reason for rejection");
                      return;
                    }
                    actionMutation.mutate({ 
                      requestId: confirmAction.reqId, 
                      action: confirmAction.action,
                      reason: rejectReason
                    });
                  } else {
                    actionMutation.mutate({ 
                      requestId: confirmAction.reqId, 
                      action: confirmAction.action 
                    });
                  }
                }
              }}
            >
              {actionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {confirmAction?.action === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Employee Dialog */}
      <Dialog open={addEmployeeOpen} onOpenChange={setAddEmployeeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
            <DialogDescription>Add a new employee or update an existing one by email.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newEmployee.fullName.trim() || !newEmployee.email.trim() || !newEmployee.department.trim()) {
                toast.error("Please fill all required fields.");
                return;
              }
              addEmployeeMutation.mutate(newEmployee);
            }}
          >
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input value={newEmployee.fullName} onChange={(e) => setNewEmployee({ ...newEmployee, fullName: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={newEmployee.email} onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Department *</Label>
              <Input value={newEmployee.department} onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newEmployee.role} onValueChange={(v) => setNewEmployee({ ...newEmployee, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Employee">Employee</SelectItem>
                  <SelectItem value="Dept Head">Dept Head</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dept Head Email</Label>
              <Input type="email" value={newEmployee.deptHeadEmail} onChange={(e) => setNewEmployee({ ...newEmployee, deptHeadEmail: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={addEmployeeMutation.isPending} className="w-full">
                {addEmployeeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Employee
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HRDashboard;
