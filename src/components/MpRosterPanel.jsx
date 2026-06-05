import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchMpRoster,
  publishMpRoster,
  saveMpRoster,
} from "../lib/api.js";
import { ROSTER_SIZE, TEAM_NAMES, getTeamName } from "../config.js";

/** @typedef {{ id: string | number, ign: string, uid?: string, xHandle?: string | null }} Player */

function emptyTeam(index) {
  return {
    name: getTeamName(index),
    members: Array(ROSTER_SIZE).fill(null),
  };
}

/** @param {Array<Player | null>} members */
function padMembers(members) {
  const out = members.slice(0, ROSTER_SIZE).map((m) => m ?? null);
  while (out.length < ROSTER_SIZE) out.push(null);
  return out;
}

/** @param {number} playerCount */
function suggestedTeamCount(playerCount) {
  return Math.max(1, Math.ceil(playerCount / ROSTER_SIZE));
}

/** @param {Array<{ name: string, members: Array<object> }>} raw @param {Map<string, Player>} playerById */
function hydrateTeams(raw, playerById) {
  if (!raw?.length) {
    return Array.from({ length: 1 }, (_, i) => emptyTeam(i));
  }
  return raw.map((team, index) => ({
    name: team.name || getTeamName(index),
    members: padMembers(
      (team.members ?? []).map((m) => {
        const id = m?.id != null ? String(m.id) : "";
        return playerById.get(id) ?? (m?.ign ? { ...m, id: m.id ?? id } : null);
      })
    ),
  }));
}

/** @param {Array<{ name: string, members: Array<Player | null> }>} teams */
function teamsToPayload(teams) {
  return teams.map((team) => ({
    name: team.name,
    members: team.members
      .filter(Boolean)
      .map((m) => ({
        id: m.id,
        ign: m.ign,
        uid: m.uid ?? "",
        xHandle: m.xHandle ?? null,
      })),
  }));
}

/** @param {Array<{ name: string, members: Array<Player | null> }>} teams @param {string | number} playerId */
function removePlayerFromTeams(teams, playerId) {
  const id = String(playerId);
  return teams.map((team) => ({
    ...team,
    members: team.members.map((m) => (m && String(m.id) === id ? null : m)),
  }));
}

export default function MpRosterPanel({ adminKey, mpPlayers, disabled }) {
  const [teams, setTeams] = useState(() => [emptyTeam(0)]);
  const [published, setPublished] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const playerById = useMemo(() => {
    const map = new Map();
    for (const p of mpPlayers) map.set(String(p.id), p);
    return map;
  }, [mpPlayers]);

  const assignedIds = useMemo(() => {
    const ids = new Set();
    for (const team of teams) {
      for (const m of team.members) {
        if (m?.id != null) ids.add(String(m.id));
      }
    }
    return ids;
  }, [teams]);

  const unassigned = useMemo(
    () => mpPlayers.filter((p) => !assignedIds.has(String(p.id))),
    [mpPlayers, assignedIds]
  );

  const loadRoster = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchMpRoster(adminKey);
      setTeams(hydrateTeams(data.teams, playerById));
      setPublished(Boolean(data.published));
      setUpdatedAt(data.updatedAt ?? null);
    } catch (err) {
      setError(err.message || "Could not load MP roster.");
    } finally {
      setLoading(false);
    }
  }, [adminKey, playerById]);

  useEffect(() => {
    if (adminKey) loadRoster();
  }, [adminKey, loadRoster]);

  function handleSelectPlayer(player) {
    if (disabled) return;
    const id = String(player.id);
    setSelectedId((prev) => (prev === id ? null : id));
    setMessage("");
  }

  function handleSlotClick(teamIndex, slotIndex) {
    if (disabled) return;
    const slot = teams[teamIndex].members[slotIndex];
    if (selectedId) {
      const player = playerById.get(selectedId);
      if (!player) return;
      setTeams((prev) => {
        let next = removePlayerFromTeams(prev, selectedId);
        next = next.map((t, ti) =>
          ti === teamIndex
            ? {
                ...t,
                members: t.members.map((m, si) =>
                  si === slotIndex ? player : m
                ),
              }
            : t
        );
        return next;
      });
      setSelectedId(null);
      setMessage(`Added ${player.ign} to ${teams[teamIndex].name}.`);
      return;
    }
    if (slot) {
      setTeams((prev) =>
        prev.map((t, ti) =>
          ti === teamIndex
            ? {
                ...t,
                members: t.members.map((m, si) => (si === slotIndex ? null : m)),
              }
            : t
        )
      );
      setMessage(`Removed ${slot.ign} from ${teams[teamIndex].name}.`);
    }
  }

  function handleAddTeam() {
    if (teams.length >= TEAM_NAMES.length) return;
    setTeams((prev) => [...prev, emptyTeam(prev.length)]);
  }

  function handleRemoveTeam(teamIndex) {
    const team = teams[teamIndex];
    if (team.members.some(Boolean)) {
      window.alert("Remove all players from the team before deleting it.");
      return;
    }
    setTeams((prev) => prev.filter((_, i) => i !== teamIndex));
  }

  function handleResetTeams() {
    const count = suggestedTeamCount(mpPlayers.length);
    if (
      !window.confirm(
        `Reset to ${count} empty teams (${getTeamName(0)} …)? Current assignments will be cleared.`
      )
    ) {
      return;
    }
    setTeams(Array.from({ length: count }, (_, i) => emptyTeam(i)));
    setSelectedId(null);
    setMessage("Teams reset.");
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const data = await saveMpRoster(adminKey, teamsToPayload(teams));
      setPublished(Boolean(data.published));
      setUpdatedAt(data.updatedAt ?? null);
      setMessage("Draft saved.");
    } catch (err) {
      setError(err.message || "Could not save MP roster.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (
      !window.confirm(
        "Publish MP teams to the public roster? Players will see team lists on the site."
      )
    ) {
      return;
    }
    setPublishing(true);
    setError("");
    setMessage("");
    try {
      const data = await publishMpRoster(adminKey, teamsToPayload(teams));
      setPublished(true);
      setUpdatedAt(data.updatedAt ?? null);
      setMessage("MP roster published.");
    } catch (err) {
      setError(err.message || "Could not publish MP roster.");
    } finally {
      setPublishing(false);
    }
  }

  const filledSlots = assignedIds.size;
  const totalSlots = teams.length * ROSTER_SIZE;

  return (
    <div className="admin-mp">
      <p className="admin-mp__lead">
        Build 5v5 squads using NATO team names (Team Alpha, Bravo, …). Select a player,
        then click an empty slot. Click a filled slot to remove them.
      </p>
      <p className="admin-mp__meta">
        {mpPlayers.length} MP sign-ups · {filledSlots}/{totalSlots} slots filled
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

      <div className="admin-mp__toolbar">
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={handleResetTeams}
          disabled={disabled || loading}
        >
          Reset teams
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={handleAddTeam}
          disabled={disabled || loading || teams.length >= TEAM_NAMES.length}
        >
          Add team
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={loadRoster}
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
          disabled={disabled || publishing || loading}
        >
          {publishing ? "Publishing…" : "Publish roster"}
        </button>
      </div>

      <div className="admin-mp__layout">
        <section className="admin-mp__pool panel">
          <h3 className="admin-mp__pool-title">Unassigned ({unassigned.length})</h3>
          {selectedId ? (
            <p className="admin-mp__hint">Click an empty slot on a team to assign.</p>
          ) : (
            <p className="admin-mp__hint">Click a player to select them.</p>
          )}
          <ul className="admin-mp__pool-list">
            {unassigned.map((player) => (
              <li key={player.id}>
                <button
                  type="button"
                  className={`admin-mp__pool-player${
                    selectedId === String(player.id) ? " admin-mp__pool-player--selected" : ""
                  }`}
                  onClick={() => handleSelectPlayer(player)}
                  disabled={disabled}
                >
                  <span className="admin-mp__pool-ign">{player.ign}</span>
                  {player.xHandle ? (
                    <span className="admin-mp__pool-x">@{player.xHandle.replace(/^@/, "")}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
          {!unassigned.length ? (
            <p className="admin-mp__pool-empty">Everyone is on a team.</p>
          ) : null}
        </section>

        <div className="admin-mp__teams">
          {teams.map((team, teamIndex) => (
            <section className="admin-mp__team panel" key={`${team.name}-${teamIndex}`}>
              <div className="admin-mp__team-head">
                <h3 className="admin-mp__team-name">{team.name}</h3>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => handleRemoveTeam(teamIndex)}
                  disabled={disabled}
                  aria-label={`Remove ${team.name}`}
                >
                  ×
                </button>
              </div>
              <ol className="admin-mp__slots">
                {team.members.map((member, slotIndex) => (
                  <li key={slotIndex}>
                    <button
                      type="button"
                      className={`admin-mp__slot${
                        member ? " admin-mp__slot--filled" : " admin-mp__slot--empty"
                      }${
                        selectedId && !member ? " admin-mp__slot--target" : ""
                      }`}
                      onClick={() => handleSlotClick(teamIndex, slotIndex)}
                      disabled={disabled}
                    >
                      <span className="admin-mp__slot-num">{slotIndex + 1}</span>
                      {member ? (
                        <div className="admin-mp__slot-body">
                          <span className="admin-mp__slot-ign">{member.ign}</span>
                          {member.xHandle ? (
                            <span className="admin-mp__slot-x">
                              @{String(member.xHandle).replace(/^@/, "")}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="admin-mp__slot-placeholder">Empty slot</span>
                      )}
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
