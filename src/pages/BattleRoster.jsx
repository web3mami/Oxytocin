import { useEffect, useState } from "react";
import { fetchBattleRosters } from "../lib/api.js";
import { tournament } from "../config.js";

export default function BattleRoster() {
  const [teams, setTeams] = useState([]);
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
        setTeams(data.teams ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load rosters.");
          setTeams([]);
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
          All drafted squads and teammates. Rosters appear here after the team draft (
          {tournament.date}).
        </p>

        {error ? <div className="alert alert--error">{error}</div> : null}

        {loading ? (
          <p className="empty-state">Loading rosters…</p>
        ) : !published || !teams.length ? (
          <div className="alert alert--warn roster-page__notice">
            Rosters are not published yet. Check back after the draft on {tournament.date}.
          </div>
        ) : (
          <div className="roster-grid">
            {teams.map((team) => (
              <section className="roster-team panel" key={team.name}>
                <h2 className="roster-team__name">{team.name}</h2>
                <ul className="roster-team__list">
                  {team.members.map((member, index) => (
                    <li className="roster-team__member" key={`${team.name}-${member.ign}-${index}`}>
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
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
