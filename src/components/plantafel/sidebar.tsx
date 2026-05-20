import { useState } from "react";
import { ROLES, RoleKey, MESSAGES } from "@/lib/mock-data";
import {
  LayoutDashboard, CalendarDays, Bell, UserCircle2,
  PanelLeftClose, PanelLeftOpen,
} from "lucide-react";

const NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Übersicht": LayoutDashboard,
  "Wochenplan": CalendarDays,
};

interface SidebarProps {
  role: RoleKey;
  activeNav: string;
  onNavChange: (n: string) => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ role, activeNav, onNavChange, collapsed = false, onToggle }: SidebarProps) {
  const current = ROLES.find((r) => r.key === role)!;

  return (
    <aside
      className="relative flex h-screen shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-all duration-200"
      style={{ width: collapsed ? 56 : 220 }}
    >
      {/* Identity */}
      <div className="border-b border-sidebar-border">
        {collapsed ? (
          <div className="flex justify-center py-4">
            <UserCircle2 className="h-6 w-6 text-sidebar-foreground/60" />
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sm font-bold">
              {current.person.charAt(0)}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="text-sm font-bold truncate">{current.person}</div>
              <div className="text-[11px] text-sidebar-foreground/60 truncate">{current.name}</div>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {current.nav.map((item) => {
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
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && item}
              {!collapsed && active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary glow-blue" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Brand */}
      {!collapsed && (
        <div className="px-4 pb-2">
          <div className="text-[9px] uppercase tracking-[0.22em] text-sidebar-foreground/30 font-semibold">
            Casciq · Plantafel
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center gap-2 px-3 py-3 border-t border-sidebar-border text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition text-[11px]"
      >
        {collapsed
          ? <PanelLeftOpen className="h-4 w-4" />
          : <><PanelLeftClose className="h-4 w-4" /><span className="whitespace-nowrap">Einklappen</span></>
        }
      </button>
    </aside>
  );
}

interface TopBarProps {
  role: RoleKey;
  onRoleChange: (r: RoleKey) => void;
}

export function TopBar({ role, onRoleChange }: TopBarProps) {
  const [bellOpen, setBellOpen] = useState(false);
  const now = new Date();
  const date = now.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const time = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  const unread = MESSAGES.filter((m) => m.unread).length;

  return (
    <header className="flex flex-col border-b border-border bg-card/90 backdrop-blur shrink-0">
      {/* Row 1: date + bell */}
      <div className="flex h-11 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold capitalize">{date}</span>
          <span className="text-[11px] text-muted-foreground">· {time} Uhr</span>
        </div>
        <div className="relative">
          <button
            onClick={() => setBellOpen((o) => !o)}
            className="relative rounded-xl p-2 hover:bg-muted transition"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center px-1">
                {unread}
              </span>
            )}
          </button>
          {bellOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-card border border-border shadow-xl z-50 overflow-hidden fade-swap">
              <div className="px-4 py-3 border-b border-border">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nachrichten</div>
              </div>
              <div className="divide-y divide-border">
                {MESSAGES.map((m, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition">
                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${m.unread ? "bg-destructive" : "bg-border"}`} />
                    <div>
                      <div className="text-xs font-semibold">{m.from}</div>
                      <div className="text-xs text-muted-foreground">{m.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: role tabs */}
      <div className="flex items-center gap-1 px-4 pb-2.5 overflow-x-auto">
        {ROLES.map((r) => {
          const active = r.key === role;
          return (
            <button
              key={r.key}
              onClick={() => onRoleChange(r.key)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-[12px] font-medium whitespace-nowrap transition shrink-0 ${
                active
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {r.name}
              {active && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />}
            </button>
          );
        })}
      </div>
    </header>
  );
}
