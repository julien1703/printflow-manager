import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoleKey, ROLES } from "@/lib/mock-data";
import { Sidebar, TopBar } from "@/components/plantafel/sidebar";
import { ProduktionsleitungView } from "@/components/plantafel/views/produktionsleitung";
import { BuchbindereiView } from "@/components/plantafel/views/buchbinderei";
import { LogistikView } from "@/components/plantafel/views/logistik";
import { DruckvorstufeView } from "@/components/plantafel/views/drucker";
import { ProjektmanagerView } from "@/components/plantafel/views/projektmanager";
import { GeschaeftsfuehrungView } from "@/components/plantafel/views/geschaeftsfuehrung";
import { Wochenplan } from "@/components/plantafel/wochenplan";
import { WochenplanungView } from "@/components/plantafel/views/wochenplanung";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Casciq — Plantafel Digital · Druckerei Pfitzer GmbH" },
      { name: "description", content: "Rollenbasiertes Produktionsplanungs-Dashboard für die Druckerei Pfitzer GmbH." },
      { property: "og:title", content: "Casciq — Plantafel Digital" },
      { property: "og:description", content: "KI-assistierte Produktionsplanung für die Druckerei." },
    ],
  }),
  component: Index,
});

function Index() {
  const [role, setRole] = useState<RoleKey>("produktionsleitung");
  const [nav, setNav] = useState<string>("Übersicht");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const current = ROLES.find((r) => r.key === role)!;

  const handleRoleChange = (r: RoleKey) => {
    setRole(r);
    setNav("Übersicht");
  };

  // Fallback: if current role doesn't have "Wochenplan" in nav but it's selected, reset
  const effectiveNav = current.nav.includes(nav) ? nav : "Übersicht";

  return (
    <div className="flex h-screen overflow-hidden w-full bg-background">
      <Sidebar
        role={role}
        activeNav={effectiveNav}
        onNavChange={setNav}
        collapsed={!sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar role={role} onRoleChange={handleRoleChange} />
        <main className="flex-1 overflow-y-auto" key={`${role}-${effectiveNav}`}>
          {effectiveNav === "Wochenplan" && role === "produktionsleitung" ? (
            <WochenplanungView />
          ) : effectiveNav === "Wochenplan" ? (
            <Wochenplan role={role} />
          ) : (
            <>
              {role === "produktionsleitung" && <ProduktionsleitungView />}
              {role === "buchbinderei"       && <BuchbindereiView />}
              {role === "logistik"           && <LogistikView />}
              {role === "druckvorstufe"      && <DruckvorstufeView />}
              {role === "projektmanager"     && <ProjektmanagerView />}
              {role === "geschaeftsfuehrung" && <GeschaeftsfuehrungView />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
