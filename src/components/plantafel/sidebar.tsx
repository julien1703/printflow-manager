import { useState } from "react";
import { ROLES, RoleKey } from "@/lib/mock-data";
import { LayoutDashboard, ClipboardList, Cpu, Truck, Settings, ChevronDown, Bell, UserCircle2 } from "lucide-react";

const NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Übersicht": LayoutDashboard,
  "Auftragsplanung": ClipboardList,
  "Maschinen": Cpu,
  "Versand": Truck,
  "Einstellungen": Settings,
};

export function Sidebar({ role, onRoleChange }: { role: RoleKey; onRoleChange: (r: RoleKey) => void }) {
  const [open, setOpen] = useState(false);
  const current = ROLES.find((r) => r.key === role)!;

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary/20">
          <span className="h-2.5 w-2.5 rounded-full bg-sidebar-primary glow-blue" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">Plantafel</div>
          <div className="text-[11px] text-sidebar-foreground/60">Digital · Pfitzer</div>
        </div>
      </div>

      {/* Role switcher */}
      <div className="px-3 pt-4 pb-2">
        <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50 px-2 mb-1.5">Rolle</div>
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-3 rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/80 transition px-3 py-2.5 text-left ai-card-glow"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-sm font-semibold">
            {current.person.split(" ").map((s) => s[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{current.name}</div>
            <div className="text-[11px] text-sidebar-foreground/60 truncate">{current.person}</div>
          </div>
          <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="mt-1.5 rounded-lg bg-sidebar-accent/60 p-1 fade-swap">
            {ROLES.map((r) => (
              <button
                key={r.key}
                onClick={() => { onRoleChange(r.key); setOpen(false); }}
                className={`w-full rounded-md px-3 py-2 text-left text-xs hover:bg-sidebar-accent transition ${
                  r.key === role ? "bg-sidebar-accent text-sidebar-primary-foreground" : ""
                }`}
              >
                <div className="font-medium">{r.name}</div>
                <div className="text-[10px] text-sidebar-foreground/55">{r.person}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {current.nav.map((item, i) => {
          const Icon = NAV_ICONS[item] ?? LayoutDashboard;
          const active = i === 0;
          return (
            <button
              key={item}
              className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                active
                  ? "bg-sidebar-accent text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary glow-blue" />}
            </button>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-sidebar-border text-[11px] text-sidebar-foreground/50">
        Druckerei Pfitzer GmbH
      </div>
    </aside>
  );
}

export function TopBar({ roleName, person }: { roleName: string; person: string }) {
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
        <button className="relative rounded-md p-2 hover:bg-muted transition">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center px-1">2</span>
        </button>
        <div className="flex items-center gap-2.5 pl-3 border-l border-border">
          <div className="text-right leading-tight">
            <div className="text-xs font-semibold">{person}</div>
            <div className="text-[10px] text-muted-foreground">{roleName}</div>
          </div>
          <UserCircle2 className="h-7 w-7 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}
