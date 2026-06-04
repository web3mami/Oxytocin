import { useEffect, useState } from "react";
import { fetchBattleRosters } from "../lib/api.js";
import { tournament } from "../config.js";

function formatXHandle(handle) {
  return handle.replace(/^@/, "");
}

/** @param {string} squadName @param {number} index */
function squadToneClass(squadName, index) {
  const n = (squadName || "").toLowerCase();
  if (n.includes("squad 2") || n.includes("squad2")) return "roster-squad--cyan";
  if (n.includes("squad 1") || n.includes("squad1")) return "roster-squad--gold";
  return index === 1 ? "roster-squad--cyan" : "roster-squad--gold";
}

function DuoCard({ team }) {
  return (
    <article className="roster-duo">
      <p className="roster-duo__name">{team.name}</p>
      <ul className="roster-duo__members">
        {team.members.map((member, index) => (
          <li className="roster-duo__member" key={`${team.name}-${member.ign}`}>
            <span className="roster-duo__slot" aria-hidden="true">
              {index + 1}
            </span>
            <div className="roster-duo__member-body">
              <span className="roster-duo__ign" title={member.ign}>
                {member.ign}
              </span>
              {member.xHandle ? (
                <a
                  className="roster-duo__x"
                  href={`https://x.com/${formatXHandle(member.xHandle)}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  title={`@${formatXHandle(member.xHandle)}`}
                >
                  @{formatXHandle(member.xHandle)}
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}

function ReserveCard({ members }) {
  return (
    <section className="roster-reserve">
      <div className="roster-reserve__head">
        <h2 className="roster-reserve__name">Reserve</h2>
        <p className="roster-reserve__note">Substitute if a duo member cannot play</p>
      </div>
      <ul className="roster-reserve__members">
        {members.map((member) => (
          <li key={member.ign}>
            <span className="roster-duo__ign">{member.ign}</span>
            {member.xHandle ? (
              <a
                className="roster-duo__x"
                href={`https://x.com/${formatXHandle(member.xHandle)}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                @{formatXHandle(member.xHandle)}
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function BattleRoster() {
  const [squads, setSquads] = useState([]);
  const [teams, setTeams] = useState([]);
  const [reserve, setReserve] = useState([]);
  const [published, setPublished] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchBattleRosters();
        if (cancelled) return;
        setPublished(data.published !== false);
        setSquads(data.squads ?? []);
        setTeams(data.teams ?? []);
        setReserve(data.reserve ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load rosters.");
          setSquads([]);
          setTeams([]);
          setReserve([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasRoster = squads.length > 0 || teams.length > 0 || reserve.length > 0;

  return (
    <div className="roster-page">
      <header className="roster-page__header">
        <a className="brand" href="/">
          <img src="/emblem.svg" alt="Oxytocin Tournament" className="brand__mark" />
          <span>
            <strong>Oxytocin</strong>
            <small>Tournament</small>
          </span>
        </a>
        <a className="btn btn--ghost" href="/">
          ← Home
        </a>
      </header>

      <main className="container roster-page__main">
        <p className="eyebrow">Post-draft</p>
        <h1>Battle roster</h1>
        <p className="roster-page__lead">
          BR duos by squad — 40 players in Squad 1, 20 in Squad 2, plus a reserve
          substitute.
        </p>

        {error ? <div className="alert alert--error">{error}</div> : null}

        {loading ? (
          <p className="empty-state">Loading rosters…</p>
        ) : !published || !hasRoster ? (
          <div className="alert alert--warn roster-page__notice">
            Rosters are not published yet. Check back after the draft on {tournament.date}.
          </div>
        ) : squads.length ? (
          <div className="roster-squads">
            {squads.map((squad, squadIndex) => (
              <section
                className={`roster-squad ${squadToneClass(squad.name, squadIndex)}`}
                key={squad.name}
              >
                <div className="roster-squad__head">
                  <h2 className="roster-squad__name">{squad.name}</h2>
                  {squad.lobbyNote ? (
                    <p className="roster-squad__note">{squad.lobbyNote}</p>
                  ) : null}
                </div>
                <div className="roster-grid">
                  {squad.teams.map((team) => (
                    <DuoCard key={`${squad.name}-${team.name}`} team={team} />
                  ))}
                </div>
              </section>
            ))}
            {reserve.length ? <ReserveCard members={reserve} /> : null}
          </div>
        ) : (
          <div className="roster-squads">
            <div className="roster-grid">
              {teams.map((team) => (
                <DuoCard key={team.name} team={team} />
              ))}
            </div>
            {reserve.length ? <ReserveCard members={reserve} /> : null}
          </div>
        )}
      </main>
    </div>
  );
}
