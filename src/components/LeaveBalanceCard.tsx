import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LeaveBalanceCardProps {
  title: string;
  used: number;
  total: number;
  icon: React.ReactNode;
  colorClass?: string;
}

const LeaveBalanceCard = ({ title, used, total, icon, colorClass = "bg-primary" }: LeaveBalanceCardProps) => {
  const remaining = total - used;
  const percentage = (used / total) * 100;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold mt-1">{remaining}</p>
            <p className="text-xs text-muted-foreground">days remaining</p>
          </div>
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-primary-foreground", colorClass)}>
            {icon}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{used} used</span>
            <span>{total} total</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", colorClass)}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaveBalanceCard;
