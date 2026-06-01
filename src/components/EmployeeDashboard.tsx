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

const INITIAL_REQUESTS = 3;

const EmployeeDashboard = ({ email, highlightReqId }: Props) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(true);
  const [showAllRequests, setShowAllRequests] = useState(false);

  const balancesQuery = useQuery({
    queryKey: ["balances", email],
    queryFn: () => fetchData("balances", email),
  });

  const requestsQuery = useQuery({
    queryKey: ["requests", email],
    queryFn: () => fetchData("requests", email),
  });

  const isLoading = balancesQuery.isLoading || requestsQuery.isLoading;
  const isError = balancesQuery.isError || requestsQuery.isError;

  const refetchAll = () => {
    balancesQuery.refetch();
    requestsQuery.refetch();
  };

  const balances = balancesQuery.data?.balances || balancesQuery.data?.Balances || balancesQuery.data || [];
  const requests = requestsQuery.data?.requests || requestsQuery.data?.Requests || requestsQuery.data || [];
  const balanceList = Array.isArray(balances) ? balances : [];
  const requestList = Array.isArray(requests)
    ? [...requests].sort((a, b) => {
        const dateA = new Date(a["Start Date"] || a["Start_Date"] || a.start_date || 0);
        const dateB = new Date(b["Start Date"] || b["Start_Date"] || b.start_date || 0);
        return dateB.getTime() - dateA.getTime();
      })
    : [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading your data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-sm text-destructive font-medium">Failed to load data. The server may be slow or unavailable.</p>
        <Button variant="outline" size="sm" onClick={refetchAll}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
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
              const type = b["Leave Type"] || b.leave_type || b.leaveType || b.type || "Leave";
              const entitlement = b.Entitlement ?? b.entitlement ?? b.Total ?? b.total ?? 0;
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
          <>
            <Card className="shadow-sm overflow-hidden border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(showAllRequests ? requestList : requestList.slice(0, INITIAL_REQUESTS)).map((r: any, i: number) => {
                    const reqId = r["Request_ID"] || r.requestId || r.id || "";
                    const isHighlighted = highlightReqId && String(reqId) === String(highlightReqId);
                    const fmtDate = (val: any) => {
                      if (!val) return "-";
                      const d = new Date(val);
                      return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
                    };
                    return (
                      <TableRow
                        key={i}
                        id={isHighlighted ? "highlighted-request" : undefined}
                        className={isHighlighted ? "bg-primary/10 ring-2 ring-primary/30" : ""}
                      >
                        <TableCell className="font-medium">{r["Leave Type"] || r["Leave_Type"] || r.leave_type || r.leaveType || "-"}</TableCell>
                        <TableCell>{fmtDate(r["Start Date"] || r["Start_Date"] || r.start_date || r.startDate)}</TableCell>
                        <TableCell>{fmtDate(r["End Date"] || r["End_Date"] || r.end_date || r.endDate)}</TableCell>
                        <TableCell>{r["Days_Requested"] || r.Days_Requested || r.Days || r.days || "-"}</TableCell>
                        <TableCell><StatusBadge status={r.Status || r.status || ""} /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
            {requestList.length > INITIAL_REQUESTS && (
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => setShowAllRequests(prev => !prev)}
              >
                {showAllRequests
                  ? "Show less"
                  : `Show ${requestList.length - INITIAL_REQUESTS} more request${requestList.length - INITIAL_REQUESTS === 1 ? "" : "s"}`}
              </Button>
            )}
          </>
        )}
      </section>

      {/* Request Leave Modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (open) setFormLoading(true);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Leave</DialogTitle>
          </DialogHeader>
          {formLoading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading form...</p>
            </div>
          )}
          <iframe
            src="https://docs.google.com/forms/d/e/1FAIpQLSeQzQ3LqqZiuJUCyoO_Pk1aahEq_RImtCdpM4G06hGO0mPXww/viewform?embedded=true"
            width="100%"
            height="700"
            style={{ border: "none", display: formLoading ? "none" : "block" }}
            title="Leave Request Form"
            onLoad={() => setFormLoading(false)}
          />
          <Button onClick={() => { setModalOpen(false); refetchAll(); }} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Done — Close & Refresh
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeDashboard;
