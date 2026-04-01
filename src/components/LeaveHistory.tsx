import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface LeaveRecord {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: "approved" | "pending" | "rejected";
  reason: string;
}

const leaveRecords: LeaveRecord[] = [
  { id: 1, type: "Annual", startDate: "2026-03-20", endDate: "2026-03-24", days: 3, status: "approved", reason: "Family vacation" },
  { id: 2, type: "Sick", startDate: "2026-03-10", endDate: "2026-03-11", days: 2, status: "approved", reason: "Medical appointment" },
  { id: 3, type: "Personal", startDate: "2026-04-05", endDate: "2026-04-05", days: 1, status: "pending", reason: "Personal errand" },
  { id: 4, type: "Annual", startDate: "2026-04-15", endDate: "2026-04-18", days: 4, status: "pending", reason: "Travel" },
  { id: 5, type: "Sick", startDate: "2026-02-14", endDate: "2026-02-14", days: 1, status: "rejected", reason: "Feeling unwell" },
];

const statusStyles = {
  approved: "bg-success/15 text-success border-success/20",
  pending: "bg-warning/15 text-warning border-warning/20",
  rejected: "bg-destructive/15 text-destructive border-destructive/20",
};

const LeaveHistory = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Leave History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaveRecords.map((record) => (
            <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{record.type} Leave</span>
                  <Badge variant="outline" className={statusStyles[record.status]}>
                    {record.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{record.reason}</p>
              </div>
              <div className="text-right ml-4 shrink-0">
                <p className="text-sm font-medium">{record.days} {record.days === 1 ? "day" : "days"}</p>
                <p className="text-xs text-muted-foreground">{record.startDate}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaveHistory;
