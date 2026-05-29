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

export default function TeamList({ teams, loading, error }) {
  if (loading) {
    return <p className="empty-state">Loading teams…</p>;
  }
  if (error) {
    return <p className="empty-state empty-state--error">{error}</p>;
  }
  if (!teams.length) {
    return (
      <p className="empty-state">
        No teams registered yet. Be the first squad on the board.
      </p>
    );
  }

  return (
    <div className="team-grid">
      {teams.map((team) => (
        <article className="team-card" key={team.id}>
          <div className="team-card__head">
            <h3>{team.teamName}</h3>
            <time dateTime={team.registeredAt}>{formatDate(team.registeredAt)}</time>
          </div>
          <p className="team-card__captain">
            Captain: <strong>{team.captainName}</strong>
          </p>
          <ul className="team-card__roster">
            {team.players.map((player) => (
              <li key={player.uid}>
                <span className="player-ign">{player.ign}</span>
                <span className="player-uid">UID {player.uid}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
