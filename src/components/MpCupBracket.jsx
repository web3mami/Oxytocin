/** @param {import('../../shared/mpBracket.js').BracketMatch} match */
function winnerSide(match) {
  if (!match.winner) return null;
  return match.winner === "home" ? "home" : "away";
}

/** @param {import('../../shared/mpBracket.js').BracketMatch} match */
function winnerName(match) {
  if (!match.winner) return null;
  return match.winner === "home" ? match.home : match.away;
}

/** @param {import('../../shared/mpBracket.js').MpBracket} bracket */
function advancingTeams(bracket) {
  /** @type {Set<string>} */
  const names = new Set();
  for (const round of bracket.rounds) {
    for (const match of round.matches) {
      const name = winnerName(match);
      if (name) names.add(name);
    }
  }
  return names;
}

/**
 * @param {import('../../shared/mpBracket.js').MpBracket} bracket
 * @param {string} matchId
 */
export function findAdvanceTarget(bracket, matchId) {
  for (let r = 0; r < bracket.rounds.length - 1; r += 1) {
    const idx = bracket.rounds[r].matches.findIndex((m) => m.id === matchId);
    if (idx === -1) continue;
    const nextMatch = bracket.rounds[r + 1].matches[Math.floor(idx / 2)];
    if (!nextMatch) return null;
    return {
      matchId: nextMatch.id,
      slot: idx % 2 === 0 ? "home" : "away",
      roundIndex: r + 1,
    };
  }
  return null;
}

/** @typedef {{ fromMatchId: string, side: 'home' | 'away', teamName: string, target: { matchId: string, slot: 'home' | 'away', roundIndex: number } | null, key: number }} AdvanceFlash */

/** @param {import('../../shared/mpBracket.js').BracketMatch} match @param {'home' | 'away'} side @param {Set<string>} advancing @param {AdvanceFlash | null} advanceFlash */
function teamRowClass(match, side, advancing, advanceFlash) {
  const classes = [];
  const w = winnerSide(match);
  if (w === side) classes.push("ko-match__row--winner", "ko-match__row--path");
  else if (w) classes.push("ko-match__row--loser");
  else {
    const name = side === "home" ? match.home : match.away;
    if (name && advancing.has(name)) classes.push("ko-match__row--path");
  }

  if (advanceFlash) {
    if (advanceFlash.fromMatchId === match.id && advanceFlash.side === side) {
      classes.push("ko-match__row--advance-out");
    }
    if (
      advanceFlash.target &&
      advanceFlash.target.matchId === match.id &&
      advanceFlash.target.slot === side
    ) {
      classes.push("ko-match__row--advance-in");
    }
  }

  return classes.join(" ");
}

const ROUND_PHASE_ICONS = ["01", "QF", "SF", "🏆"];

/** @param {import('../../shared/mpBracket.js').BracketRound} round @param {number} roundIndex @param {import('../../shared/mpBracket.js').MpBracket} bracket */
function roundPhaseMeta(round, roundIndex, bracket) {
  const icon = ROUND_PHASE_ICONS[roundIndex] ?? String(roundIndex + 1);
  const ties = round.matches.length;
  const nextTies = bracket.rounds[roundIndex + 1]?.matches.length;
  const count =
    nextTies != null ? `${ties} ties → ${nextTies}` : `${ties} tie${ties === 1 ? "" : "s"}`;
  return { icon, count };
}

/** @param {string | null | undefined} name */
function TeamName({ name }) {
  if (!name) {
    return <span className="ko-match__name ko-match__name--empty" aria-hidden="true" />;
  }
  return <span className="ko-match__name">{name}</span>;
}

/** @param {import('../../shared/mpBracket.js').BracketMatch} match @param {Set<string>} advancing @param {AdvanceFlash | null} advanceFlash */
function CupMatch({ match, advancing, advanceFlash }) {
  const onPath =
    Boolean(match.winner) ||
    (match.home && advancing.has(match.home)) ||
    (match.away && advancing.has(match.away));

  if (match.byeSlot) {
    return (
      <div
        className={`ko-match ko-match--bye${match.winner ? " ko-match--decided" : ""}${onPath ? " ko-match--path" : ""}`}
      >
        <div className={`ko-match__row ${teamRowClass(match, "home", advancing, advanceFlash)}`}>
          <TeamName name={match.home} />
        </div>
        <div className="ko-match__row ko-match__row--bye-label">
          <span className="ko-match__bye-tag">
            {match.byeLabel ?? "Bye"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`ko-match${match.winner ? " ko-match--decided" : ""}${onPath ? " ko-match--path" : ""}`}
    >
      <div className={`ko-match__row ${teamRowClass(match, "home", advancing, advanceFlash)}`}>
        <TeamName name={match.home} />
      </div>
      <div className={`ko-match__row ${teamRowClass(match, "away", advancing, advanceFlash)}`}>
        <TeamName name={match.away} />
      </div>
      {match.winner && match.seriesScore ? (
        <span className="ko-match__series" title="Best of 3 series score">
          {match.seriesScore}
        </span>
      ) : null}
    </div>
  );
}

/** @param {import('../../shared/mpBracket.js').BracketMatch} match */
function feederLineLive(match) {
  return Boolean(match.winner);
}

/**
 * @param {import('../../shared/mpBracket.js').BracketMatch} match
 * @param {number} matchIndex
 * @param {import('../../shared/mpBracket.js').BracketRound} round
 * @param {boolean} isLastRound
 */
function cellConnectorClasses(match, matchIndex, round, isLastRound) {
  const classes = [pairConnectorClass(matchIndex, round.matches.length, isLastRound)];
  if (isLastRound) return classes.filter(Boolean).join(" ");

  if (feederLineLive(match)) classes.push("ko-bracket__cell--line-live");

  const isSolo = round.matches.length % 2 === 1 && matchIndex === round.matches.length - 1;
  const isPairBottom = !isSolo && matchIndex % 2 === 1;
  if (isPairBottom) {
    const partner = round.matches[matchIndex - 1];
    if (feederLineLive(partner) && feederLineLive(match)) {
      classes.push("ko-bracket__cell--join-live");
    } else if (feederLineLive(partner) || feederLineLive(match)) {
      classes.push("ko-bracket__cell--join-partial");
    }
  }

  return classes.filter(Boolean).join(" ");
}

/** @param {number} matchIndex @param {number} matchCount @param {boolean} isLastRound */
function pairConnectorClass(matchIndex, matchCount, isLastRound) {
  if (isLastRound) return "";
  const isSolo = matchCount % 2 === 1 && matchIndex === matchCount - 1;
  if (isSolo) return "ko-bracket__cell--solo";
  return matchIndex % 2 === 0
    ? "ko-bracket__cell--pair-top"
    : "ko-bracket__cell--pair-bottom";
}

/** @param {number} center @param {number} preferredSpan @param {number} subRows @param {number} minSpan */
function fitMatchPlacement(center, preferredSpan, subRows, minSpan) {
  for (let span = preferredSpan; span >= minSpan; span -= 1) {
    const start = Math.round(center - (span - 1) / 2);
    if (start < 1 || start + span - 1 > subRows) continue;
    const actualCenter = start + (span - 1) / 2;
    if (Math.abs(actualCenter - center) < 0.01) {
      return { center, span, start };
    }
  }

  const span = preferredSpan;
  const start = Math.min(
    Math.max(1, Math.round(center - (span - 1) / 2)),
    subRows - span + 1,
  );
  return { center, span, start };
}

/** @param {number} matchIndex @param {number[]} centers */
function elbowRows(matchIndex, centers) {
  const isSolo = centers.length % 2 === 1 && matchIndex === centers.length - 1;
  if (isSolo) return 0;
  if (matchIndex % 2 === 0) {
    const join = (centers[matchIndex] + centers[matchIndex + 1]) / 2;
    return join - centers[matchIndex];
  }
  const join = (centers[matchIndex - 1] + centers[matchIndex]) / 2;
  return centers[matchIndex] - join;
}

/**
 * Half-row grid so match centers sit on feeder midpoints (6 → 3 → 2 tree).
 * @param {import('../../shared/mpBracket.js').MpBracket} bracket
 */
function bracketGridLayout(bracket) {
  const leafCount = bracket.leafCount || bracket.rounds[0].matches.length;
  const subRows = leafCount * 2;
  const minSpan = subRows / bracket.rounds[0].matches.length;
  /** @type {number[][]} */
  const centersByRound = [];
  /** @type {{ center: number, span: number, start: number }[][]} */
  const placementsByRound = [];

  bracket.rounds.forEach((round, roundIndex) => {
    const defaultSpan = subRows / round.matches.length;
    /** @type {number[]} */
    const centers = [];

    round.matches.forEach((_, matchIndex) => {
      if (roundIndex === 0) {
        centers.push(matchIndex * defaultSpan + (defaultSpan + 1) / 2);
        return;
      }
      const prev = centersByRound[roundIndex - 1];
      const top = matchIndex * 2;
      const bottom = top + 1;
      if (bottom < prev.length) {
        centers.push((prev[top] + prev[bottom]) / 2);
      } else {
        centers.push(prev[top]);
      }
    });

    centersByRound.push(centers);
    placementsByRound.push(
      centers.map((center) => fitMatchPlacement(center, defaultSpan, subRows, minSpan)),
    );
  });

  return { subRows, minSpan, centersByRound, placementsByRound };
}

/**
 * @param {import('../../shared/mpBracket.js').MpBracket} bracket
 * @param {{ advanceFlash?: AdvanceFlash | null }} [opts]
 */
export default function MpCupBracket({
  bracket,
  advanceFlash = null,
}) {
  if (!bracket?.rounds?.length) return null;

  const { subRows, minSpan, centersByRound, placementsByRound } = bracketGridLayout(bracket);
  const advancing = advancingTeams(bracket);

  return (
    <div
      className="ko-bracket"
      style={{ "--ko-slots": subRows, "--ko-min-span": minSpan }}
    >
      <div className="ko-bracket__scroll">
        <div className="ko-bracket__grid">
          {bracket.rounds.map((round, roundIndex) => {
            const isLastRound = roundIndex === bracket.rounds.length - 1;
            const roundCenters = centersByRound[roundIndex];
            return (
            <section
              className="ko-bracket__round"
              key={round.index}
              style={{ "--ko-round-i": roundIndex }}
            >
              <h3 className="ko-bracket__round-label">
                <span className="ko-bracket__round-phase">
                  <span
                    className={`ko-bracket__round-icon${roundIndex === bracket.rounds.length - 1 ? " ko-bracket__round-icon--trophy" : ""}`}
                    aria-hidden="true"
                  >
                    {roundPhaseMeta(round, roundIndex, bracket).icon}
                  </span>
                  <span className="ko-bracket__round-name">{round.name}</span>
                </span>
                <span className="ko-bracket__round-count">
                  {roundPhaseMeta(round, roundIndex, bracket).count}
                </span>
              </h3>
              <div className="ko-bracket__matches">
                {round.matches.map((match, matchIndex) => {
                  const { span, start } = placementsByRound[roundIndex][matchIndex];
                  const elbow = elbowRows(matchIndex, roundCenters);
                  const gridRow = `${start} / span ${span}`;
                  const connectorClasses = cellConnectorClasses(
                    match,
                    matchIndex,
                    round,
                    isLastRound,
                  );
                  const lineTravel =
                    advanceFlash?.fromMatchId === match.id
                      ? " ko-bracket__cell--line-travel"
                      : "";

                  return (
                    <div
                      className={`ko-bracket__cell ${connectorClasses}${lineTravel}`}
                      key={match.id}
                      data-match-id={match.id}
                      style={{
                        gridRow,
                        "--ko-elbow-rows": elbow,
                        "--ko-cell-i": matchIndex,
                      }}
                    >
                      <CupMatch
                        match={match}
                        advancing={advancing}
                        advanceFlash={advanceFlash}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          );
          })}
        </div>
      </div>
    </div>
  );
}
