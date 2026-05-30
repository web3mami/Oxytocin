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

function modeLabels(player) {
  const labels = [];
  if (player.modeMp) labels.push("MP");
  if (player.modeBr) labels.push("BR");
  return labels;
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
          {player.xHandle && (
            <p className="player-card__handle">@{player.xHandle.replace(/^@/, "")}</p>
          )}
          <div className="player-card__modes">
            {modeLabels(player).map((label) => (
              <span className="mode-chip" key={label}>
                {label}
              </span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
