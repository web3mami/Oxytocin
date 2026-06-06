import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BR_DRAFT_SIZE,
  BR_PRIMARY_LOBBY_SIZE,
  BR_PRIMARY_DUO_COUNT,
  BR_RESERVE_COUNT,
  BR_SECONDARY_LOBBY_SIZE,
  BR_SECONDARY_DUO_COUNT,
} from "../config.js";
import { draftBrTeams, fetchBattleRosters, publishBrRoster } from "../lib/api.js";
import {
  BR_RESERVE_DUO_SIZE,
  canPairWithReserve,
  canPromoteReserveDuo,
  findUnassignedBrPlayers,
  pairBrPlayerWithReserve,
  promoteReserveDuoToSquad,
} from "../../shared/brRoster.js";

function DuoCard({ team }) {
  return (
    <div className="admin-draft-duo">
      <p className="admin-draft-duo__name">{team.name}</p>
      <ul className="admin-draft-duo__members">
        {team.members.map((member) => (
          <li key={`${team.name}-${member.ign}`}>
            <span className="admin-draft-duo__ign">{member.ign}</span>
            {member.role && member.role !== "Captain" ? (
              <span className="admin-draft-duo__role">{member.role}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReserveBlock({ reserve, onPromoteToSquad2, promoting, disabled }) {
  if (!reserve?.length) return null;

  const isDuo = reserve.length >= 2;

  return (
    <section className={`admin-draft-reserve panel${isDuo ? " admin-draft-reserve--duo" : ""}`}>
      <h3 className="admin-draft-reserve__title">{isDuo ? "Reserve duo" : "Reserve"}</h3>
      <p className="admin-draft-reserve__note">
        {isDuo
          ? "Substitute pair — move into BR Squad 2 when they are playing as a full duo."
          : "Substitute if a duo member cannot play"}
      </p>
      {isDuo ? (
        <DuoCard
          team={{
            name: "Reserve duo",
            members: reserve,
          }}
        />
      ) : (
        <ul className="admin-draft-duo__members">
          {reserve.map((member) => (
            <li key={member.ign}>
              <span className="admin-draft-duo__ign">{member.ign}</span>
              {member.role && member.role !== "Captain" ? (
                <span className="admin-draft-duo__role">{member.role}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {isDuo && onPromoteToSquad2 ? (
        <div className="admin-draft-reserve__actions">
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={onPromoteToSquad2}
            disabled={disabled || promoting}
          >
            {promoting ? "Moving…" : "Move to BR Squad 2"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

/**
 * @param {{
 *   adminKey: string,
 *   brPlayers: Array<object>,
 *   brCount: number,
 *   disabled?: boolean,
 * }} props
 */
export default function BrDraftPanel({ adminKey, brPlayers, brCount, disabled }) {
  const [draft, setDraft] = useState(null);
  const [published, setPublished] = useState(null);
  const [loadingPublished, setLoadingPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [pairingId, setPairingId] = useState(null);
  const [promotingReserve, setPromotingReserve] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadPublished = useCallback(async () => {
    setLoadingPublished(true);
    try {
      const data = await fetchBattleRosters();
      if (data.squads?.length) {
        setPublished({
          squads: data.squads,
          reserve: data.reserve ?? [],
          meta: data.meta ?? null,
        });
      } else {
        setPublished(null);
      }
    } catch {
      setPublished(null);
    } finally {
      setLoadingPublished(false);
    }
  }, []);

  useEffect(() => {
    loadPublished();
  }, [loadPublished]);

  const activeRoster = draft ?? published;

  const unassigned = useMemo(
    () => (activeRoster ? findUnassignedBrPlayers(brPlayers, activeRoster) : brPlayers),
    [activeRoster, brPlayers]
  );

  const reserveOpen = activeRoster ? canPairWithReserve(activeRoster) : false;
  const canPromote = activeRoster ? canPromoteReserveDuo(activeRoster) : false;

  async function handleDraft() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const data = await draftBrTeams(adminKey);
      setDraft(data);
      setMessage(
        `Draft ready: Squad 1 (${BR_PRIMARY_DUO_COUNT} duos) + Squad 2 (${BR_SECONDARY_DUO_COUNT} duos) + ${BR_RESERVE_COUNT} reserve.`
      );
    } catch (err) {
      setDraft(null);
      setError(err.message || "Could not draft BR teams.");
    } finally {
      setLoading(false);
    }
  }

  async function publishRoster(roster, successMessage) {
    await publishBrRoster(adminKey, {
      squads: roster.squads,
      reserve: roster.reserve ?? [],
      meta: roster.meta,
    });
    setPublished({
      squads: roster.squads,
      reserve: roster.reserve ?? [],
      meta: roster.meta,
    });
    setDraft(null);
    setMessage(successMessage);
  }

  async function handlePublish() {
    if (!draft?.squads?.length) return;
    if (
      !window.confirm(
        "Publish this BR draft to the public Battle Roster page? Players will see these squads."
      )
    ) {
      return;
    }

    setPublishing(true);
    setError("");
    setMessage("");
    try {
      await publishRoster(draft, "BR roster published. View it on /roster.");
    } catch (err) {
      setError(err.message || "Could not publish roster.");
    } finally {
      setPublishing(false);
    }
  }

  async function handlePromoteReserveToSquad2() {
    if (!activeRoster) {
      setError("Publish or randomize a BR roster first.");
      return;
    }
    if (!canPromote) {
      setError("Need a full reserve duo (2 players) to move into BR Squad 2.");
      return;
    }
    if (
      !window.confirm(
        "Move the reserve duo into BR Squad 2 as a new duo and clear reserve? This updates the public roster."
      )
    ) {
      return;
    }

    setPromotingReserve(true);
    setError("");
    setMessage("");

    try {
      const next = promoteReserveDuoToSquad(activeRoster);

      if (draft) {
        setDraft(next);
        setMessage("Reserve duo moved to BR Squad 2 in draft. Publish to update /roster.");
        return;
      }

      setPublishing(true);
      await publishRoster(
        next,
        "Reserve duo added to BR Squad 2. Reserve cleared on /roster."
      );
    } catch (err) {
      setError(err.message || "Could not move reserve duo.");
    } finally {
      setPromotingReserve(false);
      setPublishing(false);
    }
  }

  async function handlePairWithReserve(player) {
    if (!activeRoster) {
      setError("Publish or randomize a BR roster before pairing with reserve.");
      return;
    }
    if (!reserveOpen) {
      setError("Reserve already has a full pair.");
      return;
    }

    setPairingId(player.id);
    setError("");
    setMessage("");

    try {
      const next = pairBrPlayerWithReserve(activeRoster, player);

      if (draft) {
        setDraft(next);
        setMessage(`Paired ${player.ign} with reserve in draft. Publish to update /roster.`);
        return;
      }

      setPublishing(true);
      await publishRoster(
        next,
        `Paired ${player.ign} with reserve. Live on /roster.`
      );
    } catch (err) {
      setError(err.message || "Could not pair with reserve.");
    } finally {
      setPairingId(null);
      setPublishing(false);
    }
  }

  const canDraft = brCount === BR_DRAFT_SIZE && !disabled;
  const showPublished = published && !draft;

  return (
    <div className="admin-draft">
      <p className="admin-draft__lead">
        Randomize all {BR_DRAFT_SIZE} BR players: {BR_PRIMARY_LOBBY_SIZE} in Squad 1 (
        {BR_PRIMARY_DUO_COUNT} duos), {BR_SECONDARY_LOBBY_SIZE} in Squad 2 (
        {BR_SECONDARY_DUO_COUNT} duos), plus {BR_RESERVE_COUNT} reserve. Extra sign-ups can
        be paired with reserve as a substitute duo ({BR_RESERVE_DUO_SIZE} players max).
      </p>
      <p className="admin-draft__meta">
        Current BR registrations: <strong>{brCount}</strong>
        {brCount !== BR_DRAFT_SIZE ? (
          <span className="admin-draft__warn">
            {" "}
            — need exactly {BR_DRAFT_SIZE} to randomize
            {brCount > BR_DRAFT_SIZE && published
              ? "; pair extras with reserve below"
              : "."}
          </span>
        ) : null}
      </p>

      <div className="admin-draft__actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleDraft}
          disabled={!canDraft || loading || publishing}
        >
          {loading ? "Randomizing…" : "Randomize BR duos"}
        </button>
        {draft ? (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={handlePublish}
            disabled={publishing || loading}
          >
            {publishing ? "Publishing…" : "Publish to battle roster"}
          </button>
        ) : null}
      </div>

      {error ? <div className="alert alert--error">{error}</div> : null}
      {message ? <div className="alert alert--success">{message}</div> : null}

      {unassigned.length && activeRoster ? (
        <section className="admin-draft-unassigned panel">
          <h3 className="admin-draft-unassigned__title">Not on roster yet</h3>
          <p className="admin-draft-unassigned__note">
            {reserveOpen
              ? "Pair a late sign-up with the reserve player to form a substitute duo."
              : canPromote
                ? "Reserve duo is full — move them to BR Squad 2 or delete a registration to pair someone else."
                : "Reserve is full."}
          </p>
          <ul className="admin-draft-unassigned__list">
            {unassigned.map((player) => (
              <li key={player.id} className="admin-draft-unassigned__item">
                <div className="admin-draft-unassigned__player">
                  <span className="admin-draft-unassigned__ign">{player.ign}</span>
                  {player.xHandle ? (
                    <span className="admin-draft-unassigned__x">@{player.xHandle}</span>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => handlePairWithReserve(player)}
                  disabled={
                    disabled ||
                    loading ||
                    publishing ||
                    pairingId === player.id ||
                    !reserveOpen
                  }
                >
                  {pairingId === player.id ? "Pairing…" : "Pair with reserve"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {loadingPublished ? (
        <p className="admin-draft__meta">Loading published roster…</p>
      ) : null}

      {activeRoster?.reserve?.length ? (
        <ReserveBlock
          reserve={activeRoster.reserve}
          onPromoteToSquad2={canPromote ? handlePromoteReserveToSquad2 : null}
          promoting={promotingReserve}
          disabled={disabled || loading || publishing}
        />
      ) : null}

      {draft?.squads?.length ? (
        <div className="admin-draft-preview">
          {draft.squads.map((squad) => (
            <section className="admin-draft-squad panel" key={squad.name}>
              <div className="admin-draft-squad__head">
                <h3 className="admin-draft-squad__title">{squad.name}</h3>
                {squad.lobbyNote ? (
                  <span className="admin-draft-squad__note">{squad.lobbyNote}</span>
                ) : null}
              </div>
              <div className="admin-draft-squad__grid">
                {squad.teams.map((team) => (
                  <DuoCard team={team} key={`${squad.name}-${team.name}`} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : showPublished ? (
        <div className="admin-draft-preview">
          <p className="admin-draft__meta">Published roster (live on /roster)</p>
          {published.squads.map((squad) => (
            <section className="admin-draft-squad panel" key={squad.name}>
              <div className="admin-draft-squad__head">
                <h3 className="admin-draft-squad__title">{squad.name}</h3>
                {squad.lobbyNote ? (
                  <span className="admin-draft-squad__note">{squad.lobbyNote}</span>
                ) : null}
              </div>
              <div className="admin-draft-squad__grid">
                {squad.teams.map((team) => (
                  <DuoCard team={team} key={`${squad.name}-${team.name}`} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
