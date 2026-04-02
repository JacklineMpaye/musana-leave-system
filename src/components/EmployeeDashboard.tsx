import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Mail, Shield, RefreshCw } from "lucide-react";
import { fetchData } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";

interface Props {
  email: string;
  highlightReqId?: string | null;
}

const EmployeeDashboard = ({ email, highlightReqId }: Props) => {
  const [modalOpen, setModalOpen] = useState(false);

  const balancesQuery = useQuery({
    queryKey: ["balances", email],
    queryFn: () => fetchData("balances", email),
  });

  const requestsQuery = useQuery({
    queryKey: ["requests", email],
    queryFn: () => fetchData("requests", email),
  });

  const isLoading = balancesQuery.isLoading || requestsQuery.isLoading;

  const refetchAll = () => {
    balancesQuery.refetch();
    requestsQuery.refetch();
  };

  const balances = balancesQuery.data?.balances || balancesQuery.data?.Balances || balancesQuery.data || [];
  const requests = requestsQuery.data?.requests || requestsQuery.data?.Requests || requestsQuery.data || [];
  const balanceList = Array.isArray(balances) ? balances : [];
  const requestList = Array.isArray(requests) ? requests : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="shadow-sm border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium">My Email</p>
              <p className="text-sm font-semibold truncate">{email}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">My Role</p>
              <p className="text-sm font-semibold">Employee</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Balances */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Leave Balance</h2>
          <Button onClick={() => setModalOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Request Leave</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
        {balanceList.length === 0 ? (
          <Card className="shadow-sm"><CardContent className="p-8 text-center text-muted-foreground">No leave balance records found.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {balanceList.map((b: any, i: number) => {
              const type = b["Leave Type"] || b.leaveType || b.type || "Leave";
              const entitlement = b.Entitlement ?? b.entitlement ?? b.total ?? 0;
              const used = b.Used ?? b.used ?? 0;
              const remaining = b.Remaining ?? b.remaining ?? (entitlement - used);
              return (
                <Card key={i} className="shadow-sm border">
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
          <Card className="shadow-sm"><CardContent className="p-8 text-center text-muted-foreground">No leave requests found.</CardContent></Card>
        ) : (
          <Card className="shadow-sm overflow-hidden border">
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
                {requestList.map((r: any, i: number) => {
                  const reqId = r.requestId || r.id || "";
                  const isHighlighted = highlightReqId && String(reqId) === String(highlightReqId);
                  return (
                    <TableRow
                      key={i}
                      id={isHighlighted ? "highlighted-request" : undefined}
                      className={isHighlighted ? "bg-primary/10 ring-2 ring-primary/30" : ""}
                    >
                      <TableCell className="font-medium">{r["Leave Type"] || r.leaveType || r.type || "-"}</TableCell>
                      <TableCell>{r["Start Date"] || r.startDate || r.start || "-"}</TableCell>
                      <TableCell>{r["End Date"] || r.endDate || r.end || "-"}</TableCell>
                      <TableCell><StatusBadge status={r.Status || r.status || ""} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </section>

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
          <Button onClick={() => { setModalOpen(false); refetchAll(); }} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Close & Refresh
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeDashboard;
