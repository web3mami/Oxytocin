/**
 * Move the published reserve duo into BR Squad 2. Requires DATABASE_URL in env.
 * Usage: node --env-file=.env.local scripts/promote-reserve-to-squad2.mjs
 */
import { promoteReserveDuoToSquad } from "../shared/brRoster.js";
import { getPublishedRoster, saveBrRoster } from "../api/_lib/rosterStore.js";

try {
  const current = await getPublishedRoster();
  if (!current.squads?.length) {
    console.error("No published BR roster found.");
    process.exit(1);
  }
  if ((current.reserve?.length ?? 0) < 2) {
    console.error("Reserve duo not found (need 2 reserve players).");
    process.exit(1);
  }

  console.log("Reserve:", current.reserve.map((m) => m.ign).join(" + "));
  const next = promoteReserveDuoToSquad({
    squads: current.squads,
    reserve: current.reserve,
    meta: current.meta ?? null,
  });

  const squad2 = next.squads.find((s) => s.name === "BR Squad 2");
  const newDuo = squad2?.teams?.[squad2.teams.length - 1];
  console.log("New duo:", newDuo?.name, "—", newDuo?.members?.map((m) => m.ign).join(" + "));

  await saveBrRoster(next);
  console.log("Published roster updated. Reserve cleared; duo added to BR Squad 2.");
} catch (err) {
  console.error("Failed:", err.message);
  process.exit(1);
}
