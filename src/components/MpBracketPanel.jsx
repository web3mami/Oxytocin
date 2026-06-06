import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchMpBracket,
  fetchMpFixtures,
  fetchMpRoster,
  publishMpBracket,
  saveMpBracket,
} from "../lib/api.js";
import {
  bracketFromDraw,
  recomputeBracket,
  setMatchWinner,
} from "../../shared/mpBracket.js";
import MpCupBracket, { findAdvanceTarget } from "./MpCupBracket.jsx";

export default function MpBracketPanel({ adminKey, disabled }) {
  const [bracket, setBracket] = useState({ bracketSize: 0, rounds: [] });
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [advanceFlash, setAdvanceFlash] = useState(null);

  const syncFromDraw = useCallback(async () => {
    const [roster, fixtures] = await Promise.all([
      fetchMpRoster(adminKey),
      fetchMpFixtures(adminKey),
    ]);
    const teamNames = (roster.teams ?? []).map((t) => t.name).filter(Boolean);
    const matches = fixtures.matches ?? [];
    if (!teamNames.length || !matches.length) {
      return { bracketSize: 0, rounds: [] };
    }
    return bracketFromDraw(matches, teamNames);
  }, [adminKey]);

  const loadBracket = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchMpBracket(adminKey);
      let tree = data.bracket ?? { bracketSize: 0, rounds: [] };
      if (!tree.rounds?.length) {
        tree = await syncFromDraw();
      }
      setBracket(tree);
      setPublished(Boolean(data.published));
      setMessage(
        tree.rounds?.length
          ? "Knockout tree loaded from your draw pairings below."
          : ""
      );
    } catch (err) {
      setError(err.message || "Could not load knockout tree.");
    } finally {
      setLoading(false);
    }
  }, [adminKey, syncFromDraw]);

  useEffect(() => {
    if (adminKey) loadBracket();
  }, [adminKey, loadBracket]);

  async function handlePickWinner(matchId, side, seriesScore) {
    const source = bracket.rounds
      .flatMap((r) => r.matches)
      .find((m) => m.id === matchId);
    const teamName = side === "home" ? source?.home : source?.away;
    const target = findAdvanceTarget(bracket, matchId);

    const next = setMatchWinner(bracket, matchId, side, seriesScore);
    const payload = { bracketSize: next.bracketSize, rounds: next.rounds };
    setBracket(payload);

    if (teamName) {
      setAdvanceFlash({
        fromMatchId: matchId,
        side,
        teamName,
        target,
        key: Date.now(),
      });
      window.setTimeout(() => setAdvanceFlash(null), 950);
    }

    try {
      await saveMpBracket(adminKey, payload);
      setMessage(`Result recorded (${seriesScore}). Winner advanced to the next round.`);
    } catch (err) {
      setError(err.message || "Could not save bracket.");
    }
  }

  async function handlePublish() {
    if (
      !window.confirm(
        "Publish the knockout bracket? Players see the full cup tree on /roster."
      )
    ) {
      return;
    }
    setPublishing(true);
    setError("");
    try {
      const fresh = await syncFromDraw();
      const merged = fresh.rounds?.length
        ? mergeWinners(fresh, bracket)
        : bracket;
      await publishMpBracket(adminKey, merged);
      setBracket(merged);
      setPublished(true);
      setMessage("Knockout bracket published.");
    } catch (err) {
      setError(err.message || "Could not publish bracket.");
    } finally {
      setPublishing(false);
    }
  }

  const hasTree = bracket.rounds?.length > 0;

  const pendingMatches = useMemo(() => {
    /** @type {Array<{ id: string, roundName: string, home: string, away: string }>} */
    const open = [];
    for (const round of bracket.rounds ?? []) {
      for (const match of round.matches ?? []) {
        if (match.home && match.away && !match.byeSlot && !match.winner) {
          open.push({
            id: match.id,
            roundName: round.name,
            home: match.home,
            away: match.away,
          });
        }
      }
    }
    return open;
  }, [bracket]);

  return (
    <div className="admin-mp-bracket">
      <h3 className="admin-mp-bracket__title">Knockout tree</h3>
      <p className="admin-mp-bracket__lead">
        Set pairings in the <strong>Draw</strong> section above, then record Best of 3
        results below — winners advance on the tree.
      </p>

      {error ? <div className="alert alert--error">{error}</div> : null}
      {message ? <div className="alert alert--success">{message}</div> : null}

      <div className="admin-mp-bracket__toolbar">
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={loadBracket}
          disabled={disabled || loading}
        >
          Refresh tree
        </button>
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={handlePublish}
          disabled={disabled || publishing || loading || !hasTree}
        >
          {publishing ? "Publishing…" : "Publish knockout"}
        </button>
      </div>

      {!hasTree && !loading ? (
        <div className="alert alert--warn">
          Add draw pairings above and save, then refresh the tree.
        </div>
      ) : null}

      {hasTree ? (
        <MpCupBracket bracket={bracket} advanceFlash={advanceFlash} />
      ) : null}

      {pendingMatches.length ? (
        <section className="admin-mp-results panel">
          <h4 className="admin-mp-results__title">Record results (Best of 3)</h4>
          <p className="admin-mp-results__lead">
            Pick the series score (home–away maps). The bracket updates when you save.
          </p>
          <ul className="admin-mp-results__list">
            {pendingMatches.map((match) => (
              <li className="admin-mp-results__row" key={match.id}>
                <div className="admin-mp-results__meta">
                  <span className="admin-mp-results__round">{match.roundName}</span>
                  <span className="admin-mp-results__teams">
                    {match.home} <span className="admin-mp-results__vs">vs</span> {match.away}
                  </span>
                </div>
                <div className="admin-mp-results__pick">
                  <div className="admin-mp-results__side">
                    <span className="admin-mp-results__team">{match.home}</span>
                    <div className="admin-mp-results__scores">
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => handlePickWinner(match.id, "home", "2-0")}
                        disabled={disabled || loading}
                      >
                        2-0
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => handlePickWinner(match.id, "home", "2-1")}
                        disabled={disabled || loading}
                      >
                        2-1
                      </button>
                    </div>
                  </div>
                  <div className="admin-mp-results__side">
                    <span className="admin-mp-results__team">{match.away}</span>
                    <div className="admin-mp-results__scores">
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => handlePickWinner(match.id, "away", "0-2")}
                        disabled={disabled || loading}
                      >
                        0-2
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => handlePickWinner(match.id, "away", "1-2")}
                        disabled={disabled || loading}
                      >
                        1-2
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : hasTree ? (
        <p className="admin-mp-results__empty">All current matchups have results recorded.</p>
      ) : null}
    </div>
  );
}

/** Keep winners when refreshing tree from draw. */
function mergeWinners(fromDraw, current) {
  /** @type {Map<string, { winner: 'home' | 'away', seriesScore?: '2-0' | '2-1' | '0-2' | '1-2' | null }>} */
  const results = new Map();
  for (const round of current.rounds ?? []) {
    for (const m of round.matches) {
      if (m.winner) {
        results.set(m.id, { winner: m.winner, seriesScore: m.seriesScore ?? null });
      }
    }
  }
  const merged = structuredClone(fromDraw);
  for (const round of merged.rounds) {
    for (const m of round.matches) {
      if (!results.has(m.id)) continue;
      const saved = results.get(m.id);
      m.winner = saved.winner;
      m.seriesScore = saved.seriesScore ?? null;
    }
  }
  return recomputeBracket(merged);
}
