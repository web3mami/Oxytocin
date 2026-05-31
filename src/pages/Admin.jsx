import { useCallback, useEffect, useState } from "react";
import { fetchAdminPlayers } from "../lib/api.js";
import { tournament } from "../config.js";

const STORAGE_KEY = "oxytocin_admin_key";

function formatModes(player) {
  const modes = [];
  if (player.modeMp) modes.push("MP");
  if (player.modeBr) modes.push("BR");
  return modes.length ? modes.join(" · ") : "—";
}

function formatX(handle) {
  if (!handle) return "—";
  return `@${handle.replace(/^@/, "")}`;
}

function formatRegisteredAt(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function Admin() {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem(STORAGE_KEY) ?? "");
  const [password, setPassword] = useState("");
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPlayers = useCallback(async (key) => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminPlayers(key);
      setPlayers(data.players || []);
    } catch (err) {
      setError(err.message || "Could not load registrations.");
      if (err.message?.includes("Invalid") || err.message?.includes("Unauthorized")) {
        sessionStorage.removeItem(STORAGE_KEY);
        setAdminKey("");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (adminKey) loadPlayers(adminKey);
  }, [adminKey, loadPlayers]);

  async function handleLogin(e) {
    e.preventDefault();
    const key = password.trim();
    if (!key) return;

    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminPlayers(key);
      sessionStorage.setItem(STORAGE_KEY, key);
      setAdminKey(key);
      setPlayers(data.players || []);
      setPassword("");
    } catch (err) {
      setError(err.message || "Invalid admin password.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(STORAGE_KEY);
    setAdminKey("");
    setPlayers([]);
    setPassword("");
    setError("");
  }

  if (!adminKey) {
    return (
      <div className="admin-page">
        <div className="admin-login">
          <p className="eyebrow">Organizer</p>
          <h1>Admin</h1>
          <p className="admin-login__lead">Enter the admin password to view registrations.</p>
          <form className="admin-login__form" onSubmit={handleLogin}>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Admin password"
              />
            </label>
            {error ? <div className="alert alert--error">{error}</div> : null}
            <button className="btn btn--primary btn--full" type="submit" disabled={loading}>
              {loading ? "Checking…" : "Sign in"}
            </button>
          </form>
          <a className="admin-back" href="/">
            ← Back to site
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Organizer</p>
          <h1>Registrations</h1>
          <p className="admin-header__meta">
            {players.length} of {tournament.maxPlayers} slots filled
          </p>
        </div>
        <div className="admin-header__actions">
          <button
            className="btn btn--ghost"
            type="button"
            onClick={() => loadPlayers(adminKey)}
            disabled={loading}
          >
            Refresh
          </button>
          <button className="btn btn--ghost" type="button" onClick={handleLogout}>
            Sign out
          </button>
          <a className="btn btn--ghost" href="/">
            Site
          </a>
        </div>
      </header>

      {error ? <div className="alert alert--error">{error}</div> : null}

      {loading && !players.length ? (
        <p className="empty-state">Loading registrations…</p>
      ) : !players.length ? (
        <p className="empty-state">No registrations yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">IGN</th>
                <th scope="col">UID</th>
                <th scope="col">X handle</th>
                <th scope="col">Mode(s)</th>
                <th scope="col">Registered</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => (
                <tr key={player.id}>
                  <td>{index + 1}</td>
                  <td>{player.ign}</td>
                  <td className="admin-table__mono">{player.uid || "—"}</td>
                  <td>
                    {player.xHandle ? (
                      <a
                        href={`https://x.com/${player.xHandle.replace(/^@/, "")}`}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        {formatX(player.xHandle)}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span className="admin-table__modes">{formatModes(player)}</span>
                  </td>
                  <td className="admin-table__muted">{formatRegisteredAt(player.registeredAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
