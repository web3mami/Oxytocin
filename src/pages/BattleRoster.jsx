import { useEffect, useState } from "react";
import MpCupBracket from "../components/MpCupBracket.jsx";
import { fetchBattleRosters } from "../lib/api.js";
import { tournament, ROSTER_SIZE } from "../config.js";

function formatXHandle(handle) {
  return handle.replace(/^@/, "");
}

function squadToneClass() {
  return "roster-squad--cyan";
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

function MpTeamCard({ team }) {
  return (
    <article className="roster-mp-team">
      <h3 className="roster-mp-team__name">{team.name}</h3>
      <ol className="roster-mp-team__list">
        {team.members.map((member, index) => (
          <li className="roster-mp-team__player" key={`${team.name}-${member.ign}-${index}`}>
            <span className="roster-mp-team__num">{index + 1}</span>
            <div className="roster-mp-team__body">
              <span className="roster-mp-team__ign" title={member.ign}>
                {member.ign}
              </span>
              {member.xHandle ? (
                <a
                  className="roster-mp-team__x"
                  href={`https://x.com/${formatXHandle(member.xHandle)}`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  @{formatXHandle(member.xHandle)}
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}

function ReserveCard({ members }) {
  const isDuo = members.length >= 2;

  if (isDuo) {
    return (
      <section className="roster-reserve roster-reserve--duo">
        <div className="roster-reserve__head">
          <h2 className="roster-reserve__name">Reserve duo</h2>
          <p className="roster-reserve__note">Substitute pair if a duo member cannot play</p>
        </div>
        <article className="roster-duo">
          <p className="roster-duo__name">Reserve duo</p>
          <ul className="roster-duo__members">
            {members.map((member, index) => (
              <li className="roster-duo__member" key={member.ign}>
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
      </section>
    );
  }

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
  const [tab, setTab] = useState("br");
  const [squads, setSquads] = useState([]);
  const [teams, setTeams] = useState([]);
  const [reserve, setReserve] = useState([]);
  const [brPublished, setBrPublished] = useState(false);
  const [mpTeams, setMpTeams] = useState([]);
  const [mpPublished, setMpPublished] = useState(false);
  const [mpBracket, setMpBracket] = useState({ bracketSize: 0, rounds: [] });
  const [mpBracketPublished, setMpBracketPublished] = useState(false);
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
        setBrPublished(data.published !== false);
        setSquads(data.squads ?? []);
        setTeams(data.teams ?? []);
        setReserve(data.reserve ?? []);
        setMpPublished(data.mpPublished === true);
        setMpTeams(data.mpTeams ?? []);
        setMpBracketPublished(data.mpBracketPublished === true);
        setMpBracket(data.mpBracket ?? { bracketSize: 0, rounds: [] });
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load rosters.");
          setSquads([]);
          setTeams([]);
          setReserve([]);
          setMpTeams([]);
          setMpBracket({ bracketSize: 0, rounds: [] });
          setMpBracketPublished(false);
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

  const hasBr = squads.length > 0 || teams.length > 0 || reserve.length > 0;
  const hasMp = mpTeams.length > 0;
  const hasMpBracket = (mpBracket?.rounds?.length ?? 0) > 0;

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
        <h1>Tournament rosters</h1>

        <div className="roster-tabs" role="tablist" aria-label="Roster mode">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "br"}
            className={`roster-tabs__btn${tab === "br" ? " roster-tabs__btn--active" : ""}`}
            onClick={() => setTab("br")}
          >
            Battle Royale
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "mp"}
            className={`roster-tabs__btn roster-tabs__btn--mp${
              tab === "mp" ? " roster-tabs__btn--active" : ""
            }`}
            onClick={() => setTab("mp")}
          >
            Multiplayer
          </button>
        </div>

        {error ? <div className="alert alert--error">{error}</div> : null}

        {loading ? (
          <p className="empty-state">Loading rosters…</p>
        ) : tab === "br" ? (
          !brPublished || !hasBr ? (
            <div className="alert alert--warn roster-page__notice">
              BR rosters are not published yet. Check back after the draft on {tournament.date}.
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
          )
        ) : !mpPublished || !hasMp ? (
          <div className="alert alert--warn roster-page__notice">
            MP teams are not published yet. Check back after the organizer groups players.
          </div>
        ) : (
          <>
            {!mpBracketPublished || !hasMpBracket ? (
              <div className="alert alert--warn roster-page__notice">
                Knockout draw is not published yet. Check back when matchups are posted.
              </div>
            ) : (
              <section className="roster-mp-cup roster-squad roster-squad--mp">
                <div className="roster-squad__head">
                  <h2 className="roster-squad__name">Knockout draw</h2>
                  <p className="roster-squad__note">
                    Cup bracket · winners advance each round
                  </p>
                </div>
                <MpCupBracket bracket={mpBracket} />
              </section>
            )}
            <div className="roster-mp roster-squad roster-squad--mp">
              <div className="roster-squad__head">
                <h2 className="roster-squad__name">Multiplayer teams</h2>
                <p className="roster-squad__note">
                  {mpTeams.length} teams · {ROSTER_SIZE} players each
                </p>
              </div>
              <div className="roster-mp__grid">
                {mpTeams.map((team) => (
                  <MpTeamCard key={team.name} team={team} />
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
