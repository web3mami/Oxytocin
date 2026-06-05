import { useCallback, useEffect, useState } from "react";
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
import MpCupBracket from "./MpCupBracket.jsx";

export default function MpBracketPanel({ adminKey, disabled }) {
  const [bracket, setBracket] = useState({ bracketSize: 0, rounds: [] });
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  async function handlePickWinner(matchId, side) {
    const next = setMatchWinner(bracket, matchId, side);
    const payload = { bracketSize: next.bracketSize, rounds: next.rounds };
    setBracket(payload);
    try {
      await saveMpBracket(adminKey, payload);
      setMessage("Winner advanced to the next round.");
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

  return (
    <div className="admin-mp-bracket">
      <h3 className="admin-mp-bracket__title">Knockout tree</h3>
      <p className="admin-mp-bracket__lead">
        Set pairings in the <strong>Draw</strong> section above, then mark winners
        here — they move to the next round like a cup knockout.
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
        <MpCupBracket
          bracket={bracket}
          interactive
          onPickWinner={handlePickWinner}
        />
      ) : null}
    </div>
  );
}

/** Keep winners when refreshing tree from draw. */
function mergeWinners(fromDraw, current) {
  const winners = new Map();
  for (const round of current.rounds ?? []) {
    for (const m of round.matches) {
      if (m.winner) winners.set(m.id, m.winner);
    }
  }
  const merged = structuredClone(fromDraw);
  for (const round of merged.rounds) {
    for (const m of round.matches) {
      if (winners.has(m.id)) m.winner = winners.get(m.id);
    }
  }
  return recomputeBracket(merged);
}
