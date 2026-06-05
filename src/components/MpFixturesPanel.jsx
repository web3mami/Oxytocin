import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchMpFixtures,
  fetchMpRoster,
  publishMpFixtures,
  saveMpFixtures,
} from "../lib/api.js";

function newMatch() {
  return {
    id: `match-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label: "",
    home: "",
    away: "",
    bye: false,
  };
}

/** @param {{ home: string, away: string, bye?: boolean }} match */
function isMatchReady(match) {
  if (match.bye) return Boolean(match.home);
  return Boolean(match.home && match.away && match.home !== match.away);
}

/** @param {unknown} raw */
function hydrateMatches(raw) {
  if (!Array.isArray(raw) || !raw.length) return [newMatch()];
  return raw.map((match, index) => {
    const bye = Boolean(match?.bye);
    return {
      id: String(match?.id ?? `match-${index + 1}`),
      label: String(match?.label ?? ""),
      home: String(match?.home ?? ""),
      away: bye ? "" : String(match?.away ?? ""),
      bye,
    };
  });
}

/** @param {Array<{ id: string, label: string, home: string, away: string, bye?: boolean }>} matches */
function matchesToPayload(matches) {
  return matches.map((m) => ({
    id: m.id,
    label: m.label.trim(),
    home: m.home.trim(),
    away: m.bye ? "" : m.away.trim(),
    bye: Boolean(m.bye),
  }));
}

export default function MpFixturesPanel({ adminKey, disabled }) {
  const [matches, setMatches] = useState(() => [newMatch()]);
  const [teamNames, setTeamNames] = useState([]);
  const [published, setPublished] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const teamOptions = useMemo(
    () => teamNames.filter(Boolean).sort((a, b) => a.localeCompare(b)),
    [teamNames]
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [roster, fixtures] = await Promise.all([
        fetchMpRoster(adminKey),
        fetchMpFixtures(adminKey),
      ]);
      setTeamNames((roster.teams ?? []).map((t) => t.name).filter(Boolean));
      setMatches(hydrateMatches(fixtures.matches));
      setPublished(Boolean(fixtures.published));
      setUpdatedAt(fixtures.updatedAt ?? null);
    } catch (err) {
      setError(err.message || "Could not load MP matchups.");
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    if (adminKey) loadAll();
  }, [adminKey, loadAll]);

  function updateMatch(id, patch) {
    setMatches((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
    );
  }

  function handleAddMatch() {
    setMatches((prev) => [...prev, newMatch()]);
  }

  function handleRemoveMatch(id) {
    setMatches((prev) => {
      const next = prev.filter((m) => m.id !== id);
      return next.length ? next : [newMatch()];
    });
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const data = await saveMpFixtures(adminKey, matchesToPayload(matches));
      setPublished(Boolean(data.published));
      setUpdatedAt(data.updatedAt ?? null);
      setMessage(
        "Draft saved in admin only. Click “Publish draw” when players should see it on /roster."
      );
    } catch (err) {
      setError(err.message || "Could not save matchups.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (
      !window.confirm(
        "Publish the Round 1 draw? Players will see match pairings on /roster."
      )
    ) {
      return;
    }
    setPublishing(true);
    setError("");
    setMessage("");
    try {
      const data = await publishMpFixtures(adminKey, matchesToPayload(matches));
      setPublished(true);
      setUpdatedAt(data.updatedAt ?? null);
      setMessage("Matchups published.");
    } catch (err) {
      setError(err.message || "Could not publish matchups.");
    } finally {
      setPublishing(false);
    }
  }

  const readyCount = matches.filter(isMatchReady).length;
  const oddTeams = teamOptions.length % 2 === 1;
  const matchupsPerRound = Math.floor(teamOptions.length / 2);

  return (
    <div className="admin-mp-fixtures">
      <h3 className="admin-mp-fixtures__title">Round 1 draw</h3>
      <p className="admin-mp-fixtures__lead">
        Pair teams for the opening round. With 11 teams, add five matchups plus one{" "}
        <strong>bye</strong>. The knockout tree below is built from this list.
      </p>
      <p className="admin-mp-fixtures__meta">
        {teamOptions.length} teams on roster · {readyCount} matchup
        {readyCount === 1 ? "" : "s"} ready
        {published ? " · Published" : " · Draft"}
        {updatedAt
          ? ` · Saved ${new Date(updatedAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}`
          : ""}
      </p>

      {error ? <div className="alert alert--error">{error}</div> : null}
      {message ? <div className="alert alert--success">{message}</div> : null}

      {!teamOptions.length && !loading ? (
        <div className="alert alert--warn">
          No teams yet — add teams in the roster builder, then save a draft.
        </div>
      ) : null}

      {oddTeams && teamOptions.length ? (
        <div className="alert alert--warn admin-mp-fixtures__odd-hint">
          {teamOptions.length} teams this round → schedule{" "}
          <strong>{matchupsPerRound} matchups</strong> plus{" "}
          <strong>1 bye</strong> (one team rests).
        </div>
      ) : null}

      <div className="admin-mp-fixtures__toolbar">
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={handleAddMatch}
          disabled={disabled || loading}
        >
          Add matchup
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={loadAll}
          disabled={disabled || loading}
        >
          Reload
        </button>
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={handleSave}
          disabled={disabled || saving || loading}
        >
          {saving ? "Saving…" : "Save draft"}
        </button>
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={handlePublish}
          disabled={disabled || publishing || loading || !teamOptions.length}
        >
          {publishing ? "Publishing…" : "Publish draw"}
        </button>
      </div>

      <ul className="admin-mp-fixtures__list">
        {matches.map((match, index) => (
          <li className="admin-mp-fixtures__row panel" key={match.id}>
            <span className="admin-mp-fixtures__index">{index + 1}</span>
            <label className="admin-mp-fixtures__label-field">
              <span className="sr-only">Label (optional)</span>
              <input
                type="text"
                className="admin-mp-fixtures__label-input"
                placeholder="Round / group (optional)"
                value={match.label}
                onChange={(e) => updateMatch(match.id, { label: e.target.value })}
                disabled={disabled}
              />
            </label>
            <select
              className="admin-mp-fixtures__select admin-mp-fixtures__select--home"
              value={match.home}
              onChange={(e) => updateMatch(match.id, { home: e.target.value })}
              disabled={disabled || !teamOptions.length}
              aria-label={
                match.bye
                  ? `Team with bye for matchup ${index + 1}`
                  : `Home team for matchup ${index + 1}`
              }
            >
              <option value="">{match.bye ? "Team (bye)" : "Home team"}</option>
              {teamOptions.map((name) => (
                <option key={`home-${match.id}-${name}`} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <label className="admin-mp-fixtures__bye">
              <input
                type="checkbox"
                checked={Boolean(match.bye)}
                onChange={(e) =>
                  updateMatch(match.id, {
                    bye: e.target.checked,
                    away: e.target.checked ? "" : match.away,
                  })
                }
                disabled={disabled}
              />
              <span>Bye</span>
            </label>
            <div className="admin-mp-fixtures__vs-wrap" aria-hidden="true">
              <span className="admin-mp-fixtures__vs">
                {match.bye ? "—" : "VS"}
              </span>
            </div>
            <select
              className="admin-mp-fixtures__select admin-mp-fixtures__select--away"
              value={match.away}
              onChange={(e) => updateMatch(match.id, { away: e.target.value })}
              disabled={disabled || !teamOptions.length || match.bye}
              aria-label={`Away team for matchup ${index + 1}`}
            >
              <option value="">Away team</option>
              {teamOptions.map((name) => (
                <option key={`away-${match.id}-${name}`} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn--ghost btn--sm admin-mp-fixtures__remove"
              onClick={() => handleRemoveMatch(match.id)}
              disabled={disabled}
              aria-label={`Remove matchup ${index + 1}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
