import { useEffect, useState } from "react";
import { fetchBattleRosters } from "../lib/api.js";
import { tournament } from "../config.js";

function MemberList({ members, teamName }) {
  return (
    <ul className="roster-team__list">
      {members.map((member, index) => (
        <li className="roster-team__member" key={`${teamName}-${member.ign}-${index}`}>
          <span className="roster-team__slot">{index + 1}</span>
          <div className="roster-team__info">
            <span className="roster-team__ign">{member.ign}</span>
            {member.role ? (
              <span className="roster-team__role">{member.role}</span>
            ) : null}
            {member.xHandle ? (
              <a
                className="roster-team__x"
                href={`https://x.com/${member.xHandle.replace(/^@/, "")}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                @{member.xHandle.replace(/^@/, "")}
              </a>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
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
            {reserve.length ? (
              <section className="roster-reserve panel">
                <h2 className="roster-reserve__name">Reserve</h2>
                <p className="roster-reserve__note">Substitute if a duo member cannot play</p>
                <MemberList members={reserve} teamName="Reserve" />
              </section>
            ) : null}
            {squads.map((squad) => (
              <section className="roster-squad" key={squad.name}>
                <div className="roster-squad__head">
                  <h2 className="roster-squad__name">{squad.name}</h2>
                  {squad.lobbyNote ? (
                    <p className="roster-squad__note">{squad.lobbyNote}</p>
                  ) : null}
                </div>
                <div className="roster-grid">
                  {squad.teams.map((team) => (
                    <section className="roster-team panel" key={`${squad.name}-${team.name}`}>
                      <h3 className="roster-team__name">{team.name}</h3>
                      <MemberList members={team.members} teamName={team.name} />
                    </section>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="roster-grid">
            {teams.map((team) => (
              <section className="roster-team panel" key={team.name}>
                <h2 className="roster-team__name">{team.name}</h2>
                <MemberList members={team.members} teamName={team.name} />
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
