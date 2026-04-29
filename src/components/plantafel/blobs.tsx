import { MACHINE_META } from "@/lib/mock-data";

/**
 * Subtle organic background blobs in machine colors.
 * Pure decoration — pointer-events none, very low opacity.
 */
export function BackgroundBlobs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <span
        className="blob"
        style={{ background: MACHINE_META.CD.color, width: 420, height: 420, top: -120, left: -80 }}
      />
      <span
        className="blob"
        style={{ background: MACHINE_META.RZK.color, width: 380, height: 380, top: 200, right: -100 }}
      />
      <span
        className="blob"
        style={{ background: MACHINE_META.SM5.color, width: 340, height: 340, bottom: -140, left: "30%" }}
      />
      <span
        className="blob"
        style={{ background: MACHINE_META.Digi.color, width: 300, height: 300, top: "45%", left: "55%" }}
      />
    </div>
  );
}
