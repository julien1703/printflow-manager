import {
  WEEKDAYS,
  SLOTS_BY_MACHINE,
  type Job,
  type Machine,
  type Weekday,
  type Slot,
} from "@/lib/mock-data";

export type SlotKey = string;

export interface PlacedJob {
  jobId: string;
  customer: string;
  machine: Machine;
  delivery: string;
  phase: "Im Druck";
  aiSuggested: true;
  reason: string;
}

export type PlanSuggestion = Record<SlotKey, PlacedJob>;

function slotKey(machine: Machine, day: Weekday, slot: Slot): SlotKey {
  return `${machine}|${day}|${slot}`;
}

function deliveryOrdinal(delivery: string): number {
  const [day, month] = delivery.split(".").map(Number);
  return month * 100 + day;
}

/**
 * Build a KI plan from a list of plannable jobs.
 *
 * Rules applied in order:
 * 1. Skip festgepinnt jobs — the user has locked them manually.
 * 2. Sort by delivery date (earliest first).
 * 3. Within each machine, group Lack-jobs (dispersionslack===true) before
 *    no-Lack jobs to minimise Rüstzeit changes (~2h saved per group boundary).
 * 4. Within each Lack group, sort by grammatur (ascending) to batch similar
 *    paper weights together.
 * 5. Fill slots in WEEKDAY × SLOTS_BY_MACHINE order, skipping occupied slots.
 */
export function buildKIPlan(
  jobs: Job[],
  existingPlan: PlanSuggestion = {}
): PlanSuggestion {
  const plan: PlanSuggestion = { ...existingPlan };

  const plannable = jobs.filter((j) => !j.festgepinnt);

  const sorted = [...plannable].sort(
    (a, b) => deliveryOrdinal(a.delivery) - deliveryOrdinal(b.delivery)
  );

  const machines = [...new Set(sorted.map((j) => j.machine))] as Machine[];
  const orderedJobs: Job[] = [];

  for (const machine of machines) {
    const machineJobs = sorted.filter((j) => j.machine === machine);
    const lackJobs   = machineJobs.filter((j) => j.dispersionslack === true)
                         .sort((a, b) => (a.grammatur ?? 0) - (b.grammatur ?? 0));
    const noLackJobs = machineJobs.filter((j) => j.dispersionslack !== true)
                         .sort((a, b) => (a.grammatur ?? 0) - (b.grammatur ?? 0));
    orderedJobs.push(...lackJobs, ...noLackJobs);
  }

  for (const job of orderedJobs) {
    let placed = false;

    for (const day of WEEKDAYS) {
      if (placed) break;
      const slots = SLOTS_BY_MACHINE[job.machine];

      for (const slot of slots) {
        const key = slotKey(job.machine, day, slot);
        if (plan[key]) continue;

        let reason = `Liefertermin ${job.delivery}`;
        if (job.dispersionslack === true) {
          reason = `Lack-Gruppierung spart ~2h Rüstzeit · Liefertermin ${job.delivery}`;
          if (job.grammatur !== undefined) {
            reason += ` · ${job.grammatur}g/m² Grammatur-Batch`;
          }
        } else if (job.grammatur !== undefined) {
          reason = `Grammatur-Batch ${job.grammatur}g/m² · Liefertermin ${job.delivery}`;
        }

        plan[key] = {
          jobId: job.id,
          customer: job.customer,
          machine: job.machine,
          delivery: job.delivery,
          phase: "Im Druck",
          aiSuggested: true,
          reason,
        };

        placed = true;
        break;
      }
    }
  }

  return plan;
}
