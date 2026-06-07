import { useCallback, useEffect, useMemo, useState } from "react";
import {
  clearRaffle,
  drawRaffle,
  fetchMpRoster,
  fetchRaffle,
  saveRaffle,
} from "../lib/api.js";
import { entryKey, normalizeEntry } from "../../shared/raffle.js";

/** @param {{ id?: string|number, ign: string, uid?: string, xHandle?: string|null }} src @param {string|null} team */
function toEntry(src, team) {
  return normalizeEntry({
    id: src.id,
    ign: src.ign,
    uid: src.uid,
    xHandle: src.xHandle,
    team,
  });
}

export default function MpRafflePanel({ adminKey, mpPlayers = [], disabled }) {
  const [teams, setTeams] = useState([]);
  const [loadedPool, setLoadedPool] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [spots, setSpots] = useState(1);
  const [winners, setWinners] = useState([]);
  const [published, setPublished] = useState(false);
  const [drawnAt, setDrawnAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const assignedIds = useMemo(() => {
    const ids = new Set();
    for (const team of teams) {
      for (const m of team.members ?? []) {
        if (m?.id != null) ids.add(String(m.id));
      }
    }
    return ids;
  }, [teams]);

  const unassigned = useMemo(
    () => mpPlayers.filter((p) => !assignedIds.has(String(p.id))),
    [mpPlayers, assignedIds]
  );

  /**
   * Every selectable/known entry, keyed. Sources merged so nothing in the saved
   * pool is ever lost — team members, unassigned MP sign-ups, and any saved
   * pool entry (e.g. a player no longer on a team).
   * @type {Map<string, import('../../shared/raffle.js').RaffleEntry>}
   */
  const entryByKey = useMemo(() => {
    const map = new Map();
    for (const team of teams) {
      for (const member of team.members ?? []) {
        const entry = toEntry(member, team.name);
        map.set(entryKey(entry), entry);
      }
    }
    for (const player of unassigned) {
      const entry = toEntry(player, null);
      const key = entryKey(entry);
      if (!map.has(key)) map.set(key, entry);
    }
    for (const raw of loadedPool) {
      const entry = normalizeEntry(raw);
      const key = entryKey(entry);
      if (!map.has(key)) map.set(key, entry);
    }
    return map;
  }, [teams, unassigned, loadedPool]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [roster, raffle] = await Promise.all([
        fetchMpRoster(adminKey),
        fetchRaffle(adminKey),
      ]);
      const rosterTeams = (roster.teams ?? []).filter((t) => (t.members ?? []).length);
      setTeams(rosterTeams);

      const pool = raffle.pool ?? [];
      setLoadedPool(pool);
      setSelected(new Set(pool.map((p) => entryKey(normalizeEntry(p)))));
      setSpots(raffle.spots ?? 1);
      setWinners(raffle.winners ?? []);
      setPublished(Boolean(raffle.published));
      setDrawnAt(raffle.drawnAt ?? null);
    } catch (err) {
      setError(err.message || "Could not load raffle data.");
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    if (adminKey) load();
  }, [adminKey, load]);

  const poolEntries = useMemo(
    () => [...selected].map((k) => entryByKey.get(k)).filter(Boolean),
    [selected, entryByKey]
  );

  function toggle(key) {
    if (disabled) return;
    setMessage("");
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleTeam(team, addAll) {
    if (disabled) return;
    setMessage("");
    setSelected((prev) => {
      const next = new Set(prev);
      for (const member of team.members ?? []) {
        const key = entryKey(toEntry(member, team.name));
        if (addAll) next.add(key);
        else next.delete(key);
      }
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await saveRaffle(adminKey, { spots: Number(spots) || 1, pool: poolEntries });
      setLoadedPool(poolEntries);
      setMessage(`Pool saved (${poolEntries.length} players, draw ${spots}).`);
    } catch (err) {
      setError(err.message || "Could not save raffle pool.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDraw() {
    const count = Number(spots) || 0;
    if (!poolEntries.length) {
      setError("Add at least one player to the pool first.");
      return;
    }
    if (count < 1 || count > poolEntries.length) {
      setError("Number of spots must be between 1 and the pool size.");
      return;
    }
    if (
      !window.confirm(
        `Run the raffle for ${count} reserve spot${count === 1 ? "" : "s"} from ${poolEntries.length} players? This publishes the result on /raffle.`
      )
    ) {
      return;
    }
    setDrawing(true);
    setError("");
    setMessage("");
    try {
      const data = await drawRaffle(adminKey, { spots: count, pool: poolEntries });
      setLoadedPool(poolEntries);
      setWinners(data.winners ?? []);
      setPublished(true);
      setDrawnAt(data.drawnAt ?? null);
      setMessage("Draw complete and published. Reveal is live on /raffle.");
    } catch (err) {
      setError(err.message || "Could not run the raffle draw.");
    } finally {
      setDrawing(false);
    }
  }

  async function handleClear() {
    if (!window.confirm("Clear the drawn winners and hide the /raffle reveal?")) return;
    setError("");
    setMessage("");
    try {
      await clearRaffle(adminKey);
      setWinners([]);
      setPublished(false);
      setDrawnAt(null);
      setMessage("Draw cleared. The /raffle page is hidden until you draw again.");
    } catch (err) {
      setError(err.message || "Could not clear the raffle.");
    }
  }

  const hasTeams = teams.length > 0;

  return (
    <div className="admin-raffle">
      <h3 className="admin-raffle__title">Reserve raffle</h3>
      <p className="admin-raffle__lead">
        Pick the losing players who go into the luck draw, choose how many reserve spots
        to give away, then run it. The pick is random and server-side — winners reveal on{" "}
        <a href="/raffle" target="_blank" rel="noreferrer noopener">/raffle</a>.
      </p>

      {error ? <div className="alert alert--error">{error}</div> : null}
      {message ? <div className="alert alert--success">{message}</div> : null}

      <p className="admin-raffle__meta">
        {poolEntries.length} in pool · drawing {spots}
        {published ? " · Published" : " · Not drawn"}
        {drawnAt
          ? ` · Drawn ${new Date(drawnAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}`
          : ""}
      </p>

      <div className="admin-raffle__toolbar">
        <label className="admin-raffle__spots">
          <span>Reserve spots</span>
          <input
            type="number"
            min="1"
            max={Math.max(1, poolEntries.length)}
            value={spots}
            onChange={(e) => setSpots(e.target.value)}
            disabled={disabled || loading}
          />
        </label>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={load}
          disabled={disabled || loading}
        >
          Reload
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={handleSave}
          disabled={disabled || saving || loading || !poolEntries.length}
        >
          {saving ? "Saving…" : "Save pool"}
        </button>
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={handleDraw}
          disabled={disabled || drawing || loading || !poolEntries.length}
        >
          {drawing ? "Drawing…" : "Run draw"}
        </button>
        {published || winners.length ? (
          <button
            type="button"
            className="btn btn--danger btn--sm"
            onClick={handleClear}
            disabled={disabled || loading}
          >
            Clear draw
          </button>
        ) : null}
      </div>

      <div className="admin-raffle__current panel">
        <h4 className="admin-raffle__current-title">In the pool ({poolEntries.length})</h4>
        {poolEntries.length ? (
          <ul className="admin-raffle__current-list">
            {poolEntries.map((e) => (
              <li key={entryKey(e)}>
                <button
                  type="button"
                  className="admin-raffle__chip admin-raffle__chip--in"
                  onClick={() => toggle(entryKey(e))}
                  disabled={disabled}
                  title="Remove from pool"
                >
                  <span className="admin-raffle__chip-mark" aria-hidden="true">×</span>
                  <span className="admin-raffle__chip-ign">{e.ign}</span>
                  {e.team ? <span className="admin-raffle__chip-team">{e.team}</span> : (
                    <span className="admin-raffle__chip-team admin-raffle__chip-team--free">
                      unassigned
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="admin-raffle__current-empty">
            No players in the pool yet — add them from the lists below.
          </p>
        )}
      </div>

      {winners.length ? (
        <div className="admin-raffle__winners">
          <h4 className="admin-raffle__winners-title">
            🎉 Winners ({winners.length})
          </h4>
          <ul className="admin-raffle__winners-list">
            {winners.map((w) => (
              <li key={entryKey(normalizeEntry(w))}>
                <span className="admin-raffle__winner-ign">{w.ign}</span>
                {w.team ? <span className="admin-raffle__winner-team">{w.team}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!hasTeams && !loading ? (
        <div className="alert alert--warn">
          No MP teams found. Build and save the MP roster above first.
        </div>
      ) : null}

      {unassigned.length ? (
        <section className="admin-raffle__team panel admin-raffle__team--free">
          <div className="admin-raffle__team-head">
            <h4 className="admin-raffle__team-name">Unassigned MP players ({unassigned.length})</h4>
          </div>
          <ul className="admin-raffle__members">
            {unassigned.map((player) => {
              const key = entryKey(toEntry(player, null));
              const checked = selected.has(key);
              return (
                <li key={key}>
                  <button
                    type="button"
                    className={`admin-raffle__chip${checked ? " admin-raffle__chip--in" : ""}`}
                    onClick={() => toggle(key)}
                    disabled={disabled}
                    aria-pressed={checked}
                  >
                    <span className="admin-raffle__chip-mark" aria-hidden="true">
                      {checked ? "✓" : "+"}
                    </span>
                    <span className="admin-raffle__chip-ign">{player.ign}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div className="admin-raffle__teams">
        {teams.map((team) => {
          const members = team.members ?? [];
          const allIn = members.every((m) =>
            selected.has(entryKey(toEntry(m, team.name)))
          );
          return (
            <section className="admin-raffle__team panel" key={team.name}>
              <div className="admin-raffle__team-head">
                <h4 className="admin-raffle__team-name">{team.name}</h4>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => toggleTeam(team, !allIn)}
                  disabled={disabled}
                >
                  {allIn ? "Remove all" : "Add all"}
                </button>
              </div>
              <ul className="admin-raffle__members">
                {members.map((member) => {
                  const key = entryKey(toEntry(member, team.name));
                  const checked = selected.has(key);
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        className={`admin-raffle__chip${checked ? " admin-raffle__chip--in" : ""}`}
                        onClick={() => toggle(key)}
                        disabled={disabled}
                        aria-pressed={checked}
                      >
                        <span className="admin-raffle__chip-mark" aria-hidden="true">
                          {checked ? "✓" : "+"}
                        </span>
                        <span className="admin-raffle__chip-ign">{member.ign}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
