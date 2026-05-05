import { useState } from "react";
import { ROLES, RoleKey } from "@/lib/mock-data";
import { LayoutDashboard, ClipboardList, Cpu, Truck, Settings, ChevronDown, Bell, UserCircle2, CalendarDays, PanelLeftClose, PanelLeftOpen } from "lucide-react";

const NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Übersicht": LayoutDashboard,
  "Wochenplan": CalendarDays,
  "Auftragsplanung": ClipboardList,
  "Maschinen": Cpu,
  "Versand": Truck,
  "Einstellungen": Settings,
};

interface SidebarProps {
  role: RoleKey;
  onRoleChange: (r: RoleKey) => void;
  activeNav: string;
  onNavChange: (n: string) => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ role, onRoleChange, activeNav, onNavChange, collapsed = false, onToggle }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const current = ROLES.find((r) => r.key === role)!;

  return (
    <aside
      className="relative flex h-screen shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-all duration-200"
      style={{ width: collapsed ? 56 : 256 }}
    >
      {/* Header — user identity card */}
      <div className="border-b border-sidebar-border">
        {collapsed ? (
          <div className="flex justify-center py-4">
            <UserCircle2 className="h-7 w-7 text-sidebar-foreground/70" />
          </div>
        ) : (
          <div className="flex items-center justify-between px-5 py-4">
            <div className="leading-tight">
              <div className="text-sm font-bold">{current.person}</div>
              <div className="text-[11px] text-sidebar-foreground/70">{current.name}</div>
            </div>
            <UserCircle2 className="h-7 w-7 shrink-0 text-sidebar-foreground/60" />
          </div>
        )}
      </div>

      {/* Role switcher — hidden when collapsed */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-2">
          <button
            onClick={() => setOpen(!open)}
            className="w-full flex items-center gap-2 rounded-xl hover:bg-sidebar-accent/50 transition px-2 py-1.5 text-left"
          >
            <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60 flex-1">Rolle wechseln</div>
            <ChevronDown className={`h-3.5 w-3.5 text-sidebar-foreground/60 transition ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="mt-1 rounded-2xl bg-sidebar-accent/60 p-1 fade-swap">
              {ROLES.map((r) => (
                <button
                  key={r.key}
                  onClick={() => { onRoleChange(r.key); setOpen(false); }}
                  className={`w-full rounded-xl px-3 py-2 text-left text-xs hover:bg-sidebar-accent transition ${
                    r.key === role ? "bg-sidebar-accent text-sidebar-primary-foreground" : ""
                  }`}
                >
                  <div className="font-medium">{r.name}</div>
                  <div className="text-[10px] text-sidebar-foreground/75">{r.person}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {current.nav.filter(item => ["Übersicht", "Wochenplan"].includes(item)).map((item) => {
          const Icon = NAV_ICONS[item] ?? LayoutDashboard;
          const active = item === activeNav;
          return (
            <button
              key={item}
              onClick={() => onNavChange(item)}
              title={collapsed ? item : undefined}
              className={`w-full flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition ${
                active
                  ? "bg-sidebar-accent text-sidebar-foreground font-semibold"
                  : "text-sidebar-foreground/85 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && item}
              {!collapsed && active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary glow-blue" />}
            </button>
          );
        })}
      </nav>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center gap-2 px-3 py-3 border-t border-sidebar-border text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition text-[11px]"
      >
        {collapsed
          ? <PanelLeftOpen className="h-4 w-4" />
          : <><PanelLeftClose className="h-4 w-4" /><span className="whitespace-nowrap">Einklappen</span></>
        }
      </button>
    </aside>
  );
}

export function TopBar(_: { roleName: string; person: string }) {
  const now = new Date();
  const date = now.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const time = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card/80 backdrop-blur px-6">
      <div>
        <div className="text-sm font-semibold capitalize">{date}</div>
        <div className="text-[11px] text-muted-foreground">Aktuell · {time} Uhr</div>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative rounded-xl p-2 hover:bg-muted transition">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center px-1">2</span>
        </button>
      </div>
    </header>
  );
}
