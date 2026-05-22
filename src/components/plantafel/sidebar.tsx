import { useState } from "react";
import { ROLES, RoleKey, MESSAGES } from "@/lib/mock-data";
import {
  LayoutDashboard, CalendarDays, Bell,
  PanelLeftClose, PanelLeftOpen,
} from "lucide-react";

const NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Übersicht": LayoutDashboard,
  "Wochenplan": CalendarDays,
};

const ROLE_GRADIENTS: Record<RoleKey, string> = {
  produktionsleitung: "linear-gradient(135deg, oklch(0.62 0.16 50), oklch(0.72 0.18 75))",
  buchbinderei:       "linear-gradient(135deg, oklch(0.52 0.14 153), oklch(0.62 0.16 165))",
  logistik:           "linear-gradient(135deg, oklch(0.46 0.15 255), oklch(0.55 0.17 265))",
  druckvorstufe:      "linear-gradient(135deg, oklch(0.48 0.15 308), oklch(0.58 0.17 320))",
  projektmanager:     "linear-gradient(135deg, oklch(0.40 0.06 255), oklch(0.55 0.08 255))",
  geschaeftsfuehrung: "linear-gradient(135deg, oklch(0.22 0.008 255), oklch(0.35 0.01 255))",
};

const ROLE_COLORS: Record<RoleKey, string> = {
  produktionsleitung: "oklch(0.62 0.16 50)",
  buchbinderei:       "oklch(0.52 0.14 153)",
  logistik:           "oklch(0.46 0.15 255)",
  druckvorstufe:      "oklch(0.48 0.15 308)",
  projektmanager:     "oklch(0.55 0.10 255)",
  geschaeftsfuehrung: "oklch(0.35 0.01 255)",
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
  const gradient = ROLE_GRADIENTS[role];
  const roleColor = ROLE_COLORS[role];

  return (
    <aside
      className="relative flex h-screen shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-all duration-200"
      style={{ width: collapsed ? 56 : 220 }}
    >
      {/* Identity */}
      <div className="border-b border-sidebar-border">
        {collapsed ? (
          <div className="flex justify-center py-4">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ background: gradient }}
            >
              {current.person.charAt(0)}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-4">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ background: gradient }}
            >
              {current.person.charAt(0)}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="text-sm font-bold truncate">{current.person}</div>
              <div className="text-[11px] text-sidebar-foreground/60 truncate">{current.name}</div>
              <span className="text-[10px] text-[oklch(0.52_0.14_153)] font-semibold">● Aktiv</span>
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
              className={`relative w-full flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition ${
                active
                  ? "bg-sidebar-accent text-sidebar-foreground font-semibold overflow-hidden"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              {active && (
                <span
                  className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full"
                  style={{ backgroundColor: roleColor }}
                />
              )}
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

type MessageGroup = {
  type: "neue-auftraege" | "standard";
  count?: number;
  messages: typeof MESSAGES;
};

function groupMessages(messages: typeof MESSAGES): MessageGroup[] {
  const neueAuftraege = messages.filter(
    (m) => m.text.toLowerCase().includes("auftrag") || m.text.toLowerCase().includes("freigabe")
  );
  const rest = messages.filter(
    (m) => !m.text.toLowerCase().includes("auftrag") && !m.text.toLowerCase().includes("freigabe")
  );
  const groups: MessageGroup[] = [];
  if (neueAuftraege.length > 1) {
    groups.push({ type: "neue-auftraege", count: neueAuftraege.length, messages: neueAuftraege });
  } else {
    neueAuftraege.forEach((m) => groups.push({ type: "standard", messages: [m] }));
  }
  rest.forEach((m) => groups.push({ type: "standard", messages: [m] }));
  return groups;
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
                {groupMessages(MESSAGES).map((group, i) => {
                  if (group.type === "neue-auftraege") {
                    const anyUnread = group.messages.some((m) => m.unread);
                    return (
                      <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition">
                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${anyUnread ? "bg-destructive" : "bg-border"}`} />
                        <div>
                          <div className="text-xs font-semibold">Neue Aufträge</div>
                          <div className="text-xs text-muted-foreground">{group.count} neue Aufträge eingegangen</div>
                        </div>
                      </div>
                    );
                  }
                  const m = group.messages[0];
                  return (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition">
                      <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${m.unread ? "bg-destructive" : "bg-border"}`} />
                      <div>
                        <div className="text-xs font-semibold">{m.from}</div>
                        <div className="text-xs text-muted-foreground">{m.text}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: role tabs */}
      <div className="flex items-center gap-1 px-4 pb-2.5 overflow-x-auto">
        {ROLES.map((r) => {
          const active = r.key === role;
          const dotColor = ROLE_COLORS[r.key];
          return (
            <button
              key={r.key}
              onClick={() => onRoleChange(r.key)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-[12px] font-medium whitespace-nowrap transition shrink-0 ${
                active
                  ? "text-background shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              style={
                active
                  ? { backgroundColor: `color-mix(in oklab, ${dotColor} 8%, white)` }
                  : undefined
              }
            >
              <span
                className="h-[4px] w-[4px] rounded-full shrink-0"
                style={{ backgroundColor: dotColor }}
              />
              {r.name}
              {active && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />}
            </button>
          );
        })}
      </div>
    </header>
  );
}
