import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Loader2, Search, UserPlus, Pencil, UserX, Bell,
  ChevronDown, ChevronUp, Mail, Building2, MapPin, Briefcase,
} from "lucide-react";
import { fetchData, addEmployee, updateEmployee, deactivateEmployee, sendCustomNotification } from "@/lib/api";
import { toast } from "sonner";

interface Props { hrEmail: string; }

const emptyEmp = () => ({
  fullName: "", email: "", department: "", role: "Employee",
  jobTitle: "", dutyStation: "", startDate: "", deptHeadEmail: "",
});
const emptyNotify = () => ({ to: "", subject: "", message: "" });

const initials = (name: string) =>
  name.trim().split(/\s+/).map(n => n[0] ?? "").join("").toUpperCase().slice(0, 2) || "?";

const roleColor = (role: string) => {
  const r = (role || "").toLowerCase();
  if (r === "hr") return "bg-purple-100 text-purple-700 border-purple-200";
  if (r.includes("head")) return "bg-blue-100 text-blue-700 border-blue-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
};

const HREmployeePage = ({ hrEmail }: Props) => {
  const qc = useQueryClient();

  const [search, setSearch]               = useState("");
  const [expandedEmail, setExpanded]      = useState<string | null>(null);
  const [editTarget, setEditTarget]       = useState<any | null>(null);
  const [editForm, setEditForm]           = useState(emptyEmp());
  const [notifyTarget, setNotifyTarget]   = useState<any | null>(null);
  const [notifyForm, setNotifyForm]       = useState(emptyNotify());
  const [deactivateTarget, setDeactTarget]= useState<any | null>(null);
  const [addOpen, setAddOpen]             = useState(false);
  const [newEmp, setNewEmp]               = useState(emptyEmp());

  // ── queries ──────────────────────────────────────────────
  const empQuery = useQuery({
    queryKey: ["hrEmployees"],
    queryFn:  () => fetchData("hrEmployees"),
  });

  const balQuery = useQuery({
    queryKey: ["balances", expandedEmail],
    queryFn:  () => fetchData("balances", expandedEmail!),
    enabled:  !!expandedEmail,
  });

  // ── mutations ─────────────────────────────────────────────
  const updateMut = useMutation({
    mutationFn: (d: Record<string, string>) => updateEmployee(d),
    onSuccess: () => {
      toast.success("Employee updated.");
      qc.invalidateQueries({ queryKey: ["hrEmployees"] });
      setEditTarget(null);
    },
    onError: (e: any) => toast.error(e?.message || "Failed to update employee."),
  });

  const deactMut = useMutation({
    mutationFn: (email: string) => deactivateEmployee(email),
    onSuccess: () => {
      toast.success("Employee removed.");
      qc.invalidateQueries({ queryKey: ["hrEmployees"] });
      qc.invalidateQueries({ queryKey: ["hrOverview"] });
      setDeactTarget(null);
    },
    onError: (e: any) => toast.error(e?.message || "Failed to remove employee."),
  });

  const notifyMut = useMutation({
    mutationFn: (d: { to: string; subject: string; message: string }) =>
      sendCustomNotification(d.to, d.subject, d.message, hrEmail),
    onSuccess: () => {
      toast.success("Message sent.");
      setNotifyTarget(null);
      setNotifyForm(emptyNotify());
    },
    onError: () => toast.error("Failed to send message."),
  });

  const addMut = useMutation({
    mutationFn: (d: typeof newEmp) => addEmployee(d as Record<string, string>),
    onSuccess: () => {
      toast.success("Employee added.");
      qc.invalidateQueries({ queryKey: ["hrEmployees"] });
      qc.invalidateQueries({ queryKey: ["hrOverview"] });
      setAddOpen(false);
      setNewEmp(emptyEmp());
    },
    onError: (e: any) => toast.error(e?.message || "Failed to add employee."),
  });

  // ── derived ───────────────────────────────────────────────
  const employees: any[] = empQuery.data?.employees || [];
  const filtered = search.trim()
    ? employees.filter(e =>
        [e.Full_Name, e.full_name, e.Email, e.email, e.Department, e.department,
         e.Duty_Station, e.duty_station, e.Role, e.role]
          .some(v => (v || "").toLowerCase().includes(search.toLowerCase()))
      )
    : employees;

  const balances: any[] = balQuery.data?.balances || [];

  const openEdit = (emp: any) => {
    setEditForm({
      fullName:     emp.Full_Name      || emp.full_name      || "",
      email:        emp.Email          || emp.email          || "",
      department:   emp.Department     || emp.department     || "",
      role:         emp.Role           || emp.role           || "Employee",
      jobTitle:     emp["Job Title"]   || emp.job_title      || emp.jobTitle     || "",
      dutyStation:  emp.Duty_Station   || emp.duty_station   || emp.dutyStation  || "",
      startDate:    emp.Start_Date     || emp.start_date     || emp.startDate    || "",
      deptHeadEmail:emp.DeptHead_Email || emp.deptHead_Email || emp.deptHeadEmail|| "",
    });
    setEditTarget(emp);
  };

  const ef  = (k: keyof ReturnType<typeof emptyEmp>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setEditForm(p => ({ ...p, [k]: e.target.value }));
  const nf  = (k: keyof ReturnType<typeof emptyEmp>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setNewEmp(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Employee Management</h2>
          {!empQuery.isLoading && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {filtered.length} of {employees.length} employee{employees.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Name, email, department…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9 w-56 text-sm"
            />
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <UserPlus className="w-4 h-4 mr-1.5" /> Add Employee
          </Button>
        </div>
      </div>

      {/* List */}
      {empQuery.isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : empQuery.isError ? (
        <Card className="border shadow-sm">
          <CardContent className="p-8 text-center space-y-3">
            <p className="text-sm text-destructive">Failed to load employees.</p>
            <Button variant="outline" size="sm" onClick={() => empQuery.refetch()}>Retry</Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border shadow-sm">
          <CardContent className="p-10 text-center text-muted-foreground">
            {search ? "No employees match your search." : "No employees yet. Use Add Employee to get started."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((emp: any, i: number) => {
            const email     = emp.Email          || emp.email          || "";
            const name      = emp.Full_Name      || emp.full_name      || email;
            const dept      = emp.Department     || emp.department     || "";
            const station   = emp.Duty_Station   || emp.duty_station   || "";
            const role      = emp.Role           || emp.role           || "Employee";
            const jobTitle  = emp["Job Title"]   || emp.job_title      || "";
            const deptHead  = emp.DeptHead_Email || emp.deptHead_Email || "";
            const status    = String(emp.Status  || emp.status || "Active");
            const isActive  = status.toLowerCase() !== "inactive";
            const isExpanded= expandedEmail === email;

            return (
              <Card
                key={i}
                className={`border shadow-sm transition-all ${isExpanded ? "ring-1 ring-primary/30 shadow-md" : "hover:shadow-md"} ${!isActive ? "opacity-60" : ""}`}
              >
                <CardContent className="p-5">
                  {/* Top row */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">

                    {/* Avatar + info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-semibold text-primary text-sm select-none">
                        {initials(name)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        {/* Name + badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-foreground">{name}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${roleColor(role)}`}>{role}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        {/* Email */}
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{email}</span>
                        </div>
                        {/* Department / station / title */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          {dept && <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5 shrink-0" />{dept}</span>}
                          {station && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 shrink-0" />{station}</span>}
                          {jobTitle && <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 shrink-0" />{jobTitle}</span>}
                        </div>
                        {/* Dept head */}
                        {deptHead && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Dept Head:</span> {deptHead}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => openEdit(emp)}>
                        <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setNotifyTarget(emp); setNotifyForm({ to: email, subject: "", message: "" }); }}>
                        <Bell className="w-3.5 h-3.5 mr-1" /> Notify
                      </Button>
                      {isActive && (
                        <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setDeactTarget(emp)}>
                          <UserX className="w-3.5 h-3.5 mr-1" /> Remove
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expand toggle */}
                  <button
                    className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setExpanded(isExpanded ? null : email)}
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {isExpanded ? "Hide leave balances" : "View leave balances"}
                  </button>

                  {/* Leave balances (expanded) */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                        Leave Balances — {name}
                      </p>
                      {balQuery.isLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                        </div>
                      ) : balQuery.isError ? (
                        <p className="text-xs text-destructive">Failed to load balances.</p>
                      ) : balances.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No balance data found for this employee.</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                          {balances.map((b: any, bi: number) => {
                            const bType     = b["Leave Type"] || b.leave_type || b.type || "Leave";
                            const total     = Number(b.Total     ?? b.total     ?? b.Entitlement ?? b.entitlement ?? 0);
                            const used      = Number(b.Used      ?? b.used      ?? 0);
                            const remaining = Number(b.Remaining ?? b.remaining ?? Math.max(0, total - used));
                            const pct       = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
                            const color     = remaining === 0 ? "text-destructive"
                                            : pct >= 80       ? "text-warning"
                                            :                   "text-primary";
                            const barColor  = pct >= 80 ? "bg-destructive" : pct >= 50 ? "bg-warning" : "bg-success";
                            return (
                              <div key={bi} className="bg-muted/60 rounded-lg p-3 text-center">
                                <p className="text-xs text-muted-foreground truncate mb-1" title={bType}>{bType}</p>
                                <p className={`text-2xl font-bold leading-none ${color}`}>{remaining}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">of {total} days</p>
                                <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{used} used</p>
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
        </div>
      )}

      {/* ── Edit Dialog ────────────────────────────────────── */}
      <Dialog open={!!editTarget} onOpenChange={open => { if (!open) setEditTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update details for {editForm.fullName || editForm.email}.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); updateMut.mutate(editForm as Record<string,string>); }}>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Full Name</Label>
                <Input value={editForm.fullName} onChange={ef("fullName")} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Email</Label>
                <Input value={editForm.email} disabled className="bg-muted text-muted-foreground cursor-not-allowed" />
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Input value={editForm.department} onChange={ef("department")} />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={editForm.role} onValueChange={v => setEditForm(p => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Employee">Employee</SelectItem>
                    <SelectItem value="Dept Head">Dept Head</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Job Title</Label>
                <Input value={editForm.jobTitle} onChange={ef("jobTitle")} />
              </div>
              <div className="space-y-1.5">
                <Label>Duty Station / Region</Label>
                <Input value={editForm.dutyStation} onChange={ef("dutyStation")} />
              </div>
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" value={editForm.startDate} onChange={ef("startDate")} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Dept Head Email</Label>
                <Input type="email" value={editForm.deptHeadEmail} onChange={ef("deptHeadEmail")} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button type="submit" disabled={updateMut.isPending}>
                {updateMut.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Notify Dialog ──────────────────────────────────── */}
      <Dialog open={!!notifyTarget} onOpenChange={open => { if (!open) { setNotifyTarget(null); setNotifyForm(emptyNotify()); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
            <DialogDescription>
              Send a custom message to {notifyTarget?.Full_Name || notifyTarget?.full_name || notifyTarget?.Email || "this employee"}.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={e => {
              e.preventDefault();
              if (!notifyForm.subject.trim() || !notifyForm.message.trim()) {
                toast.error("Subject and message are required.");
                return;
              }
              notifyMut.mutate(notifyForm);
            }}
          >
            <div className="space-y-1.5">
              <Label>To</Label>
              <Input
                type="email"
                value={notifyForm.to}
                onChange={e => setNotifyForm(p => ({ ...p, to: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Subject <span className="text-destructive">*</span></Label>
              <Input
                value={notifyForm.subject}
                onChange={e => setNotifyForm(p => ({ ...p, subject: e.target.value }))}
                placeholder="e.g. Leave Policy Reminder"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Message <span className="text-destructive">*</span></Label>
              <Textarea
                value={notifyForm.message}
                onChange={e => setNotifyForm(p => ({ ...p, message: e.target.value }))}
                placeholder="Type your message here…"
                className="min-h-[130px]"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setNotifyTarget(null); setNotifyForm(emptyNotify()); }}>Cancel</Button>
              <Button type="submit" disabled={notifyMut.isPending}>
                {notifyMut.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                Send Message
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Deactivate Confirm ─────────────────────────────── */}
      <AlertDialog open={!!deactivateTarget} onOpenChange={open => { if (!open) setDeactTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Employee</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate{" "}
              <strong>{deactivateTarget?.Full_Name || deactivateTarget?.full_name || deactivateTarget?.Email}</strong>.
              They will no longer be able to log in or submit leave requests.
              You can re-activate them by editing their status in the spreadsheet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deactMut.mutate(deactivateTarget?.Email || deactivateTarget?.email || "")}
            >
              {deactMut.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Yes, Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Add Employee Dialog ────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={open => { setAddOpen(open); if (!open) setNewEmp(emptyEmp()); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
            <DialogDescription>Register a new employee in the system.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={e => {
              e.preventDefault();
              if (!newEmp.fullName.trim() || !newEmp.email.trim() || !newEmp.department.trim()) {
                toast.error("Name, email and department are required.");
                return;
              }
              addMut.mutate(newEmp);
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Full Name <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. Jane Doe" value={newEmp.fullName} onChange={nf("fullName")} required />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Email <span className="text-destructive">*</span></Label>
                <Input type="email" placeholder="jane@musana.org" value={newEmp.email} onChange={nf("email")} required />
              </div>
              <div className="space-y-1.5">
                <Label>Department <span className="text-destructive">*</span></Label>
                <Input value={newEmp.department} onChange={nf("department")} required />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={newEmp.role} onValueChange={v => setNewEmp(p => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Employee">Employee</SelectItem>
                    <SelectItem value="Dept Head">Dept Head</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Job Title</Label>
                <Input placeholder="e.g. Accountant" value={newEmp.jobTitle} onChange={nf("jobTitle")} />
              </div>
              <div className="space-y-1.5">
                <Label>Duty Station</Label>
                <Input placeholder="e.g. Kampala" value={newEmp.dutyStation} onChange={nf("dutyStation")} />
              </div>
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" value={newEmp.startDate} onChange={nf("startDate")} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Dept Head Email</Label>
                <Input type="email" placeholder="head@musana.org" value={newEmp.deptHeadEmail} onChange={nf("deptHeadEmail")} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={addMut.isPending}>
                {addMut.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                Add Employee
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HREmployeePage;
