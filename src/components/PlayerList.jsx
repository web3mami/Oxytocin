function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function PlayerList({ players, loading, error }) {
  if (loading) {
    return <p className="empty-state">Loading players…</p>;
  }
  if (error) {
    return <p className="empty-state empty-state--error">{error}</p>;
  }
  if (!players.length) {
    return (
      <p className="empty-state">
        No players registered yet. Be the first to join the pool.
      </p>
    );
  }

  return (
    <div className="player-grid">
      {players.map((player) => (
        <article className="player-card" key={player.id}>
          <div className="player-card__head">
            <h3>{player.ign}</h3>
            <time dateTime={player.registeredAt}>{formatDate(player.registeredAt)}</time>
          </div>
          <dl className="player-card__meta">
            <div>
              <dt>UID</dt>
              <dd>{player.uid}</dd>
            </div>
            <div>
              <dt>X</dt>
              <dd>{player.xHandle}</dd>
            </div>
          </dl>
          <div className="player-card__modes">
            {player.modes.map((mode) => (
              <span className="mode-chip" key={mode}>
                {mode.replace(" (MP)", "").replace(" (BR)", "")}
              </span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
