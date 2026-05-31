import { tournament } from "../config.js";

const PERK_GROUPS = [
  { key: "blue", className: "perk-ban--blue" },
  { key: "red", className: "perk-ban--red" },
  { key: "green", className: "perk-ban--green" },
];

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
          <div className="bans-block">
            <div className="weapon-bans">
            <h3 className="bans-block__title">Weapon bans</h3>
            <div className="weapon-ban-groups">
              <div className="weapon-ban-group">
                <div className="weapon-ban-cards">
                  {tournament.bans.weapons.general.map((weapon) => (
                    <div className="weapon-ban-card" key={weapon.name}>
                      <p className="weapon-ban-card__tag">Banned</p>
                      <p className="weapon-ban-card__type">{weapon.type}</p>
                      <p className="weapon-ban-card__name">{weapon.name}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="weapon-ban-group weapon-ban-group--nested">
                <p className="weapon-ban-group__label">Thermite ammunition</p>
                <div className="weapon-ban-chips">
                  {tournament.bans.weapons.thermite.map((weapon) => (
                    <span className="weapon-ban-chip weapon-ban-chip--thermite" key={weapon}>
                      {weapon}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            </div>

            <h3 className="bans-block__title">Perk bans</h3>
            <ul className="perk-ban-list">
              {PERK_GROUPS.flatMap(({ key, className }) =>
                tournament.bans.perks[key].map((perk) => (
                  <li className={`perk-ban ${className}`} key={perk}>
                    {perk}
                  </li>
                ))
              )}
            </ul>
          </div>
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
