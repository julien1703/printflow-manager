import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoleKey, ROLES } from "@/lib/mock-data";
import { Sidebar, TopBar } from "@/components/plantafel/sidebar";
import { ProduktionsleitungView } from "@/components/plantafel/views/produktionsleitung";
import { BuchbindereiView } from "@/components/plantafel/views/buchbinderei";
import { LogistikView } from "@/components/plantafel/views/logistik";
import { DruckerView } from "@/components/plantafel/views/drucker";
import { ProjektmanagerView } from "@/components/plantafel/views/projektmanager";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Plantafel Digital — Druckerei Pfitzer" },
      { name: "description", content: "Digitale Plantafel für die Produktionsplanung — rollenbasierte Übersicht für die Druckerei Pfitzer GmbH." },
      { property: "og:title", content: "Plantafel Digital" },
      { property: "og:description", content: "Rollenbasiertes Produktionsplanungs-Dashboard für die Druckerei." },
    ],
  }),
  component: Index,
});

function Index() {
  const [role, setRole] = useState<RoleKey>("produktionsleitung");
  const current = ROLES.find((r) => r.key === role)!;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar role={role} onRoleChange={setRole} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar roleName={current.name} person={current.person} />
        <main className="flex-1 overflow-auto" key={role}>
          {role === "produktionsleitung" && <ProduktionsleitungView />}
          {role === "buchbinderei" && <BuchbindereiView />}
          {role === "logistik" && <LogistikView />}
          {role === "drucker" && <DruckerView />}
          {role === "projektmanager" && <ProjektmanagerView />}
        </main>
      </div>
    </div>
  );
}
