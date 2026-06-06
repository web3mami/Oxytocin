/** @typedef {'2-0' | '2-1' | '0-2' | '1-2'} SeriesScore */

const HOME_WIN_SCORES = new Set(["2-0", "2-1"]);
const AWAY_WIN_SCORES = new Set(["0-2", "1-2"]);

/** @param {unknown} score @param {'home' | 'away' | null} winner */
function normalizeSeriesScore(score, winner) {
  if (!winner) return null;
  const raw = typeof score === "string" ? score : null;
  if (raw && HOME_WIN_SCORES.has(raw) && winner === "home") return raw;
  if (raw && AWAY_WIN_SCORES.has(raw) && winner === "away") return raw;
  if (winner === "away" && raw === "2-0") return "0-2";
  if (winner === "away" && raw === "2-1") return "1-2";
  return null;
}
/** @typedef {{ id: string, roundIndex: number, matchIndex: number, home: string | null, away: string | null, winner: 'home' | 'away' | null, seriesScore?: SeriesScore | null, byeSlot?: boolean, byeLabel?: string }} BracketMatch */
/** @typedef {{ index: number, name: string, matches: BracketMatch[] }} BracketRound */
/** @typedef {{ team: string, roundIndex: number, matchIndex: number, slot: 'home' | 'away' }} ByeAdvance */
/** @typedef {{ bracketSize: number, leafCount: number, rounds: BracketRound[], byeAdvance?: ByeAdvance | null, published?: boolean, updatedAt?: string | null }} MpBracket */

/** @param {number} n */
export function nextPowerOf2(n) {
  let p = 1;
  while (p < Math.max(1, n)) p *= 2;
  return Math.max(2, p);
}

/** @param {number} roundIndex @param {number} totalRounds */
function roundName(roundIndex, totalRounds) {
  if (roundIndex === totalRounds - 1) return "Final";
  if (roundIndex === totalRounds - 2) return "Semi-finals";
  if (roundIndex === totalRounds - 3) return "Quarter-finals";
  return "Round 1";
}

/** @param {object} raw @param {number} roundIndex @param {number} matchIndex */
function normalizeMatch(raw, roundIndex, matchIndex) {
  const home = raw?.home != null && raw.home !== "" ? String(raw.home) : null;
  const away = raw?.away != null && raw.away !== "" ? String(raw.away) : null;
  let winner = raw?.winner === "home" || raw?.winner === "away" ? raw.winner : null;
  if (winner === "home" && !home) winner = null;
  if (winner === "away" && !away) winner = null;

  const seriesScore =
    winner && !raw?.byeSlot ? normalizeSeriesScore(raw?.seriesScore, winner) : null;

  return {
    id: String(raw?.id ?? `r${roundIndex}-m${matchIndex}`),
    roundIndex,
    matchIndex,
    home,
    away,
    winner,
    seriesScore,
    ...(raw?.byeSlot ? { byeSlot: true } : {}),
    ...(raw?.byeLabel ? { byeLabel: String(raw.byeLabel) } : {}),
  };
}

/** @param {BracketMatch} match */
function winnerTeam(match) {
  if (!match.winner) return null;
  return match.winner === "home" ? match.home : match.away;
}

/** @param {number} qfCount */
function semiFinalLayout(qfCount) {
  if (qfCount <= 1) return { play: qfCount, bye: 0 };
  if (qfCount % 2 === 1) return { play: (qfCount - 1) / 2, bye: 1 };
  return { play: qfCount / 2, bye: 0 };
}

/** @param {number} playCount @param {number} byeCount */
function buildRoundCounts(playCount, byeCount) {
  const r1 = playCount + byeCount;
  const qf = r1 / 2;
  const { play: sfPlay, bye: sfBye } = semiFinalLayout(qf);
  const sf = sfPlay + sfBye;
  return { r1, qf, sf, final: 1 };
}

/** @param {number} playCount @param {number} byeCount */
function buildDrawRounds(playCount, byeCount) {
  const counts = buildRoundCounts(playCount, byeCount);
  const totalRounds = 4;
  /** @type {BracketRound[]} */
  const rounds = [];

  const roundMatchCounts = [counts.r1, counts.qf, counts.sf, counts.final];
  for (let r = 0; r < totalRounds; r++) {
    const matchCount = roundMatchCounts[r];
    /** @type {BracketMatch[]} */
    const matches = [];
    for (let m = 0; m < matchCount; m++) {
      matches.push(normalizeMatch({ id: `r${r}-m${m}`, home: null, away: null }, r, m));
    }
    rounds.push({ index: r, name: roundName(r, totalRounds), matches });
  }

  const { play: sfPlay, bye: sfBye } = semiFinalLayout(counts.qf);
  if (sfBye && rounds[2]) {
    const byeCard = rounds[2].matches[sfPlay];
    if (byeCard) {
      byeCard.byeSlot = true;
      byeCard.byeLabel = "Bye → Final";
    }
  }

  return rounds;
}

/** @param {MpBracket} bracket */
export function applyByeAdvance(bracket) {
  const adv = bracket.byeAdvance;
  if (!adv?.team) return bracket;
  const match = bracket.rounds[adv.roundIndex]?.matches[adv.matchIndex];
  if (match && !match[adv.slot]) match[adv.slot] = adv.team;
  return bracket;
}

/** @param {MpBracket} bracket */
function propagateDrawBracket(bracket) {
  const r0 = bracket.rounds[0]?.matches ?? [];
  const qf = bracket.rounds[1]?.matches ?? [];
  const sf = bracket.rounds[2]?.matches ?? [];
  const fin = bracket.rounds[3]?.matches ?? [];

  for (const match of qf) {
    match.home = null;
    match.away = null;
    match.winner = null;
    match.seriesScore = null;
  }
  for (const match of sf) {
    if (!match.byeSlot) {
      match.home = null;
      match.away = null;
    } else {
      match.home = null;
    }
    match.winner = null;
    match.seriesScore = null;
  }
  for (const match of fin) {
    match.home = null;
    match.away = null;
    match.winner = null;
    match.seriesScore = null;
  }

  const playMatches = r0.filter((m) => !m.byeSlot);
  for (let i = 0; i < playMatches.length; i++) {
    const winner = winnerTeam(playMatches[i]);
    if (!winner) continue;
    const qfIdx = Math.floor(i / 2);
    const slot = i % 2 === 0 ? "home" : "away";
    if (qf[qfIdx]) qf[qfIdx][slot] = winner;
  }

  applyByeAdvance(bracket);

  const sfPlay = sf.filter((m) => !m.byeSlot);
  const sfBye = sf.find((m) => m.byeSlot);

  if (sfPlay[0]) {
    if (qf[0]?.winner) sfPlay[0].home = winnerTeam(qf[0]);
    if (qf[1]?.winner) sfPlay[0].away = winnerTeam(qf[1]);
  }

  if (sfBye && qf[2]?.winner) {
    sfBye.home = winnerTeam(qf[2]);
    sfBye.winner = "home";
  }

  if (fin[0]) {
    if (sfPlay[0]?.winner) fin[0].home = winnerTeam(sfPlay[0]);
    if (sfBye?.winner) fin[0].away = winnerTeam(sfBye);
  }
}

/** Auto-win bye cards, then propagate. */
export function finalizeBracket(bracket) {
  const b = structuredClone(bracket);

  for (const match of b.rounds[0]?.matches ?? []) {
    if (match.byeSlot && match.home && !match.away) {
      match.winner = "home";
    }
  }

  propagateDrawBracket(b);

  for (const match of b.rounds[2]?.matches ?? []) {
    if (match.byeSlot && match.home && !match.away) {
      match.winner = "home";
    }
  }

  if (b.rounds[3]?.matches?.[0]) {
    const fin = b.rounds[3].matches[0];
    const sf = b.rounds[2]?.matches ?? [];
    const sfPlay = sf.find((m) => !m.byeSlot);
    const sfBye = sf.find((m) => m.byeSlot);
    if (sfPlay?.winner) fin.home = winnerTeam(sfPlay);
    if (sfBye?.winner) fin.away = winnerTeam(sfBye);
  }

  return b;
}

/** @deprecated */
export function resolveAllByes(bracket) {
  return finalizeBracket(bracket);
}

/** @param {string[]} teamNames */
export function generateBracket(teamNames) {
  const teams = teamNames.map((t) => String(t).trim()).filter(Boolean);
  if (!teams.length) return { bracketSize: 0, leafCount: 0, rounds: [] };

  /** @type {Array<{ id: string, home: string, away: string, bye?: boolean }>} */
  const fixtures = [];
  for (let i = 0; i + 1 < teams.length; i += 2) {
    fixtures.push({ id: `gen-${i}`, home: teams[i], away: teams[i + 1] });
  }
  if (teams.length % 2 === 1) {
    fixtures.push({ id: `gen-bye`, home: teams[teams.length - 1], bye: true });
  }
  return bracketFromDraw(fixtures, teams);
}

/**
 * 11 teams: Round 1 = 6 cards (5 play + 1 bye), QF = 3 cards (India pre-placed), SF, Final.
 * @param {Array<{ id?: string, home?: string, away?: string, bye?: boolean, winner?: string }>} fixtures
 * @param {string[]} teamNames
 */
export function bracketFromDraw(fixtures, teamNames) {
  const entries = Array.isArray(fixtures) ? fixtures : [];
  const playEntries = entries.filter((f) => f && !f.bye);
  const byeEntry = entries.find((f) => f?.bye);
  const byeTeam = byeEntry?.home ? String(byeEntry.home).trim() : null;
  const playCount = playEntries.length;
  const byeCount = byeTeam ? 1 : 0;

  if (!playCount && !byeCount) {
    return { bracketSize: 0, leafCount: 0, rounds: [], byeAdvance: null };
  }

  const leafCount = playCount + byeCount;
  const rounds = buildDrawRounds(playCount, byeCount);
  const r0 = rounds[0].matches;

  playEntries.forEach((f, i) => {
    r0[i] = normalizeMatch(
      {
        id: String(f.id ?? `r0-m${i}`),
        home: f.home,
        away: f.away,
        winner: f.winner,
      },
      0,
      i
    );
  });

  /** @type {ByeAdvance | null} */
  let byeAdvance = null;
  if (byeTeam) {
    const byeIndex = playCount;
    r0[byeIndex] = normalizeMatch(
      {
        id: String(byeEntry?.id ?? `r0-m${byeIndex}`),
        home: byeTeam,
        away: null,
        byeSlot: true,
        byeLabel: "Bye → Quarter-finals",
      },
      0,
      byeIndex
    );

    const qfIndex = rounds[1].matches.length - 1;
    byeAdvance = { team: byeTeam, roundIndex: 1, matchIndex: qfIndex, slot: "away" };
  }

  return finalizeBracket({
    bracketSize: leafCount * 2,
    leafCount,
    rounds,
    byeAdvance,
  });
}

/** @param {unknown} raw */
export function normalizeBracket(raw) {
  if (!raw || typeof raw !== "object") {
    return { bracketSize: 0, leafCount: 0, rounds: [], published: false, updatedAt: null };
  }

  const leafCount =
    Number(raw.leafCount) ||
    (Array.isArray(raw.rounds?.[0]?.matches) ? raw.rounds[0].matches.length : 0);
  const bracketSize = Number(raw.bracketSize) || leafCount * 2;
  const rounds = Array.isArray(raw.rounds)
    ? raw.rounds.map((round, ri) => ({
        index: Number(round?.index ?? ri),
        name: String(round?.name ?? roundName(ri, raw.rounds.length)),
        matches: (Array.isArray(round?.matches) ? round.matches : []).map((m, mi) =>
          normalizeMatch(m, ri, mi)
        ),
      }))
    : [];

  return finalizeBracket({
    bracketSize,
    leafCount,
    rounds,
    byeAdvance: raw.byeAdvance ?? null,
    published: Boolean(raw.published),
    updatedAt: raw.updatedAt ?? null,
  });
}

/** @param {MpBracket} bracket @param {string} matchId @param {'home' | 'away'} winnerSide @param {SeriesScore} seriesScore */
export function setMatchWinner(bracket, matchId, winnerSide, seriesScore) {
  const b = structuredClone(bracket);
  for (let r = 0; r < b.rounds.length; r++) {
    for (let m = 0; m < b.rounds[r].matches.length; m++) {
      const match = b.rounds[r].matches[m];
      if (match.id !== matchId) continue;
      if (match.byeSlot) return b;
      if (!match.home || !match.away) return b;
      if (winnerSide !== "home" && winnerSide !== "away") return b;
      const valid =
        (winnerSide === "home" && HOME_WIN_SCORES.has(seriesScore)) ||
        (winnerSide === "away" && AWAY_WIN_SCORES.has(seriesScore));
      if (!valid) return b;
      match.winner = winnerSide;
      match.seriesScore = seriesScore;
      return recomputeBracket(b);
    }
  }
  return b;
}

/** @param {MpBracket} bracket @param {Array<{ name: string }>} teams */
export function validateBracketForPublish(bracket, teams) {
  if (!bracket?.rounds?.length) {
    return { ok: false, error: "Generate a cup bracket before publishing." };
  }

  const teamNames = new Set(
    (teams ?? []).map((t) => String(t?.name ?? "").trim()).filter(Boolean)
  );
  if (!teamNames.size) {
    return { ok: false, error: "Build and save MP teams before publishing the cup." };
  }

  const r0 = bracket.rounds[0];
  if (!r0?.matches?.length) {
    return { ok: false, error: "Bracket has no opening round." };
  }

  const seen = new Set();
  for (const match of r0.matches) {
    for (const side of [match.home, match.away]) {
      if (!side) continue;
      if (!teamNames.has(side)) {
        return { ok: false, error: `"${side}" is not on the roster.` };
      }
      if (seen.has(side)) {
        return { ok: false, error: `"${side}" appears more than once in round 1.` };
      }
      seen.add(side);
    }
  }

  for (const name of teamNames) {
    if (!seen.has(name)) {
      return {
        ok: false,
        error: `"${name}" is missing from the bracket. Regenerate the draw.`,
      };
    }
  }

  return { ok: true };
}

/** Replay winners after a pick or undo. */
export function recomputeBracket(bracket) {
  return finalizeBracket(bracket);
}

/** @param {MpBracket} bracket @param {string} matchId */
export function clearMatchWinner(bracket, matchId) {
  const b = structuredClone(bracket);
  for (const round of b.rounds) {
    for (const match of round.matches) {
      if (match.id === matchId) {
        match.winner = null;
        match.seriesScore = null;
      }
    }
  }
  return recomputeBracket(b);
}

/** Flatten bracket to list for legacy consumers. */
export function bracketToMatchList(bracket) {
  const out = [];
  for (const round of bracket.rounds ?? []) {
    for (const match of round.matches) {
      if (!match.home && !match.away) continue;
      out.push({
        id: match.id,
        label: round.name,
        home: match.home ?? "",
        away: match.away ?? "",
        bye: Boolean(match.byeSlot),
        winner: winnerTeam(match),
      });
    }
  }
  return out;
}

/** @param {number} slotsInRound @deprecated */
export function roundLabel(slotsInRound) {
  if (slotsInRound <= 2) return "Final";
  if (slotsInRound <= 4) return "Semi-finals";
  if (slotsInRound <= 8) return "Quarter-finals";
  return `Round of ${slotsInRound}`;
}
