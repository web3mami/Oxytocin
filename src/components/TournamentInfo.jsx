import { tournament } from "../config.js";

export default function TournamentInfo() {
  return (
    <section className="section" id="info">
      <div className="container info-grid">
        <div className="panel panel--wide">
          <p className="eyebrow">Multiplayer format</p>
          <h2>MP match format</h2>
          <p className="section__lead" style={{ marginBottom: "1.25rem" }}>
            {tournament.mpFormat.series}. {tournament.mpFormat.description} Tiebreaker:{" "}
            {tournament.mpFormat.tiebreaker}.
          </p>
          <div className="format-grid">
            {tournament.mpFormat.modes.map((mode) => (
              <div className="format-card" key={mode.name}>
                <h3>{mode.name}</h3>
                <ul className="format-card__rules">
                  {mode.rules.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
                <div className="format-card__maps">
                  {mode.maps.map((m) => (
                    <span className="mode-chip" key={m}>{m}</span>
                  ))}
                </div>
              </div>
            ))}
            <div className="format-card format-card--tiebreaker">
              <p className="format-card__tag">Tiebreaker</p>
              <h3>{tournament.mpFormat.tiebreakerMode.name}</h3>
              <ul className="format-card__rules">
                {tournament.mpFormat.tiebreakerMode.rules.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <div className="format-card__maps">
                {tournament.mpFormat.tiebreakerMode.maps.map((m) => (
                  <span className="mode-chip" key={m}>{m}</span>
                ))}
              </div>
            </div>
          </div>
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
