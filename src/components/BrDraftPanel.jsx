import { useState } from "react";
import {
  draftBrTeams,
  publishBrRoster,
} from "../lib/api.js";
import { BR_DRAFT_SIZE } from "../config.js";

function DuoCard({ team }) {
  return (
    <div className="admin-draft-duo">
      <p className="admin-draft-duo__name">{team.name}</p>
      <ul className="admin-draft-duo__members">
        {team.members.map((member) => (
          <li key={`${team.name}-${member.ign}`}>
            <span className="admin-draft-duo__ign">{member.ign}</span>
            {member.role ? (
              <span className="admin-draft-duo__role">{member.role}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function BrDraftPanel({ adminKey, brCount, disabled }) {
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleDraft() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const data = await draftBrTeams(adminKey);
      setDraft(data);
      setMessage(
        `Draft ready: ${data.meta?.duoCount ?? 40} duos across ${data.meta?.squads ?? 2} squads (randomized).`
      );
    } catch (err) {
      setDraft(null);
      setError(err.message || "Could not draft BR teams.");
    } finally {
      setLoading(false);
    }
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
      await publishBrRoster(adminKey, {
        squads: draft.squads,
        meta: draft.meta,
      });
      setMessage("BR roster published. View it on /roster.");
    } catch (err) {
      setError(err.message || "Could not publish roster.");
    } finally {
      setPublishing(false);
    }
  }

  const canDraft = brCount === BR_DRAFT_SIZE && !disabled;

  return (
    <div className="admin-draft">
      <p className="admin-draft__lead">
        Randomize all {BR_DRAFT_SIZE} BR players into duos — {BR_DRAFT_SIZE / 2} teams, split into
        2 squads of 20 duos (40 players per lobby).
      </p>
      <p className="admin-draft__meta">
        Current BR registrations: <strong>{brCount}</strong>
        {brCount !== BR_DRAFT_SIZE ? (
          <span className="admin-draft__warn">
            {" "}
            — need exactly {BR_DRAFT_SIZE} to draft.
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
      ) : null}
    </div>
  );
}
