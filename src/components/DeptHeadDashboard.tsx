import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { fetchData, postData } from "@/lib/api";
import { toast } from "sonner";
import StatusBadge from "@/components/StatusBadge";
import EmployeeDashboard from "@/components/EmployeeDashboard";

interface Props {
  email: string;
  highlightReqId?: string | null;
}

const DeptHeadDashboard = ({ email, highlightReqId }: Props) => {
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<{ reqId: string; action: "approve" | "reject" } | null>(null);

  const pendingQuery = useQuery({
    queryKey: ["deptPending", email],
    queryFn: () => fetchData("deptPending", email),
  });

  const actionMutation = useMutation({
    mutationFn: (params: { requestId: string; action: string }) =>
      postData("approveReject", { ...params, email, role: "Dept Head" }),
    onSuccess: () => {
      toast.success("Action completed successfully");
      queryClient.invalidateQueries({ queryKey: ["deptPending"] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      setConfirmAction(null);
    },
    onError: () => toast.error("Action failed. Please try again."),
  });

  const pending = pendingQuery.data?.requests || pendingQuery.data?.pending || pendingQuery.data || [];
  const pendingList = Array.isArray(pending) ? pending : [];

  return (
    <div className="space-y-8">
      {/* Pending Approvals */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Department Leave Approvals</h2>
        {pendingQuery.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : pendingList.length === 0 ? (
          <Card className="shadow-sm border">
            <CardContent className="p-8 text-center text-muted-foreground">No pending department requests.</CardContent>
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
                {pendingList.map((r: any, i: number) => {
                  const reqId = r.requestId || r.id || String(i);
                  const isHighlighted = highlightReqId && String(reqId) === String(highlightReqId);
                  return (
                    <TableRow
                      key={i}
                      id={isHighlighted ? "highlighted-request" : undefined}
                      className={isHighlighted ? "bg-primary/10 ring-2 ring-primary/30" : ""}
                    >
                      <TableCell className="font-medium">{r.Employee || r.employee || r.email || "-"}</TableCell>
                      <TableCell>{r["Leave Type"] || r.leaveType || "-"}</TableCell>
                      <TableCell className="text-sm">
                        {r["Start Date"] || r.startDate || "-"} — {r["End Date"] || r.endDate || "-"}
                      </TableCell>
                      <TableCell>{r.Days || r.days || "-"}</TableCell>
                      <TableCell><StatusBadge status={r.Status || r.status || "Pending"} /></TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-success border-success/30 hover:bg-success/10"
                          onClick={() => setConfirmAction({ reqId, action: "approve" })}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
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

      {/* Own leave section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">My Own Leave</h2>
        <EmployeeDashboard email={email} highlightReqId={highlightReqId} />
      </section>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {confirmAction?.action === "approve" ? "Approval" : "Rejection"}</DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirmAction?.action} this leave request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button
              variant={confirmAction?.action === "approve" ? "default" : "destructive"}
              disabled={actionMutation.isPending}
              onClick={() => {
                if (confirmAction) {
                  actionMutation.mutate({ requestId: confirmAction.reqId, action: confirmAction.action });
                }
              }}
            >
              {actionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {confirmAction?.action === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeptHeadDashboard;
