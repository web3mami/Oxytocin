import { tournament } from "../config.js";

export default function TournamentInfo() {
  return (
    <section className="section" id="info">
      <div className="container info-grid">
        <div className="panel">
          <p className="eyebrow">Event details</p>
          <h2>Tournament briefing</h2>
          <dl className="detail-list">
            <div>
              <dt>Format</dt>
              <dd>{tournament.format}</dd>
            </div>
            <div>
              <dt>Mode</dt>
              <dd>{tournament.mode}</dd>
            </div>
            <div>
              <dt>Date & time</dt>
              <dd>
                {tournament.date} · {tournament.time}
              </dd>
            </div>
            <div>
              <dt>Venue</dt>
              <dd>{tournament.venue}</dd>
            </div>
            <div>
              <dt>Entry fee</dt>
              <dd>{tournament.entryFee}</dd>
            </div>
            <div>
              <dt>Prize pool</dt>
              <dd className="accent">{tournament.prizePool}</dd>
            </div>
            <div>
              <dt>Max teams</dt>
              <dd>{tournament.maxTeams}</dd>
            </div>
            <div>
              <dt>Deadline</dt>
              <dd>{tournament.registrationDeadline}</dd>
            </div>
          </dl>
        </div>

        <div className="panel">
          <p className="eyebrow">Schedule</p>
          <h2>Key dates</h2>
          <ol className="timeline">
            {tournament.schedule.map((item) => (
              <li key={item.label}>
                <span className="timeline__date">{item.date}</span>
                <span className="timeline__label">{item.label}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="panel panel--wide">
          <p className="eyebrow">Rules</p>
          <h2>Competitive rules</h2>
          <ul className="rules-list">
            {tournament.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
