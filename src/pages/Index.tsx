import { Palmtree, Stethoscope, User, Bell } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import LeaveBalanceCard from "@/components/LeaveBalanceCard";
import LeaveRequestForm from "@/components/LeaveRequestForm";
import LeaveHistory from "@/components/LeaveHistory";

const Index = () => {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">Good morning, John 👋</h1>
              <p className="text-muted-foreground text-sm mt-1">Here's your leave overview for 2026</p>
            </div>
            <button className="relative w-10 h-10 rounded-lg bg-card border flex items-center justify-center hover:bg-secondary transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">2</span>
            </button>
          </div>

          {/* Leave Balances */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <LeaveBalanceCard
              title="Annual Leave"
              used={5}
              total={21}
              icon={<Palmtree className="w-5 h-5" />}
              colorClass="bg-primary"
            />
            <LeaveBalanceCard
              title="Sick Leave"
              used={3}
              total={10}
              icon={<Stethoscope className="w-5 h-5" />}
              colorClass="bg-info"
            />
            <LeaveBalanceCard
              title="Personal Leave"
              used={1}
              total={5}
              icon={<User className="w-5 h-5" />}
              colorClass="bg-accent"
            />
          </div>

          {/* Request + History */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
              <LeaveRequestForm />
            </div>
            <div className="lg:col-span-3">
              <LeaveHistory />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
