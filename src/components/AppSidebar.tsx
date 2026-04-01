import { CalendarDays, LayoutDashboard, ClipboardList, Settings, Users, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: CalendarDays, label: "My Leaves", active: false },
  { icon: ClipboardList, label: "Approvals", active: false },
  { icon: Users, label: "Team", active: false },
  { icon: Settings, label: "Settings", active: false },
];

const AppSidebar = () => {
  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col min-h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight text-sidebar-primary">Musana</h1>
        <p className="text-xs text-sidebar-foreground/60 mt-0.5">Leave Management</p>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              item.active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-3 mt-auto">
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-sidebar-accent/50">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-xs font-bold">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">John Doe</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">john@musana.com</p>
          </div>
          <LogOut className="w-4 h-4 text-sidebar-foreground/50 shrink-0 cursor-pointer hover:text-sidebar-foreground" />
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
