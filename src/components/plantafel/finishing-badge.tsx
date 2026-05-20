import { Scissors, BookOpen, Paperclip, CropIcon, Wrench } from "lucide-react";

export type FinishingType = "Falzen" | "Binden" | "Heften" | "Schneiden" | "Sonderverarbeitung";

const FINISHING_META: Record<FinishingType, { icon: React.ElementType; color: string }> = {
  "Falzen":            { icon: CropIcon,    color: "oklch(0.46 0.15 255)" },
  "Binden":            { icon: BookOpen,    color: "oklch(0.52 0.14 153)" },
  "Heften":            { icon: Paperclip,   color: "oklch(0.48 0.15 308)" },
  "Schneiden":         { icon: Scissors,    color: "oklch(0.62 0.16 50)"  },
  "Sonderverarbeitung":{ icon: Wrench,      color: "oklch(0.45 0.12 200)" },
};

export function FinishingBadge({ type }: { type: FinishingType }) {
  const meta = FINISHING_META[type];
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{
        backgroundColor: `color-mix(in oklab, ${meta.color} 12%, white)`,
        color: meta.color,
      }}
    >
      <Icon className="h-3 w-3" />
      {type}
    </span>
  );
}
