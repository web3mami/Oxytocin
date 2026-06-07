/**
 * Apply MP bracket results and publish. Requires DATABASE_URL in env.
 * Usage: node --env-file=.env.local scripts/set-mp-bracket-results.mjs
 */
import { setMatchWinner } from "../shared/mpBracket.js";
import { getMpBracketDraft, saveMpBracket } from "../api/_lib/mpBracketStore.js";

/** @type {Array<{ matchId: string, side: 'home' | 'away', seriesScore: '2-0' | '2-1' | '0-2' | '1-2', label: string }>} */
const RESULTS = [
  {
    matchId: "r1-m0",
    side: "home",
    seriesScore: "2-0",
    label: "Team Delta def. Team Charlie 2-0",
  },
];

let draft = await getMpBracketDraft();
if (!draft.rounds?.length) {
  console.error("No MP bracket found.");
  process.exit(1);
}

for (const result of RESULTS) {
  const before = draft.rounds
    .flatMap((r) => r.matches)
    .find((m) => m.id === result.matchId);
  if (!before) {
    console.error(`Match not found: ${result.matchId}`);
    process.exit(1);
  }
  draft = setMatchWinner(draft, result.matchId, result.side, result.seriesScore);
  console.log(`OK: ${result.label} (${before.home} vs ${before.away}) → ${result.seriesScore}`);
}

const payload = {
  bracketSize: draft.bracketSize,
  leafCount: draft.leafCount,
  rounds: draft.rounds,
  byeAdvance: draft.byeAdvance ?? null,
};

await saveMpBracket(payload, { publish: true });
console.log("Bracket published with results. Check /roster.");
