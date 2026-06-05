import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAdminPlayers, deleteAdminPlayer } from "../lib/api.js";
import { readSession, removeSession, writeSession } from "../lib/session.js";
import BrDraftPanel from "../components/BrDraftPanel.jsx";
import MpBracketPanel from "../components/MpBracketPanel.jsx";
import MpFixturesPanel from "../components/MpFixturesPanel.jsx";
import MpRosterPanel from "../components/MpRosterPanel.jsx";

const STORAGE_KEY = "oxytocin_admin_key";

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

function AdminPlayerTable({ players, deletingId, loading, onDelete }) {
  if (!players.length) {
    return <p className="admin-list__empty">No players in this list yet.</p>;
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">IGN</th>
            <th scope="col">UID</th>
            <th scope="col">X handle</th>
            <th scope="col">Registered</th>
            <th scope="col">Actions</th>
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
              <td className="admin-table__muted">{formatRegisteredAt(player.registeredAt)}</td>
              <td className="admin-table__actions">
                <button
                  type="button"
                  className="btn btn--danger btn--sm"
                  onClick={() => onDelete(player)}
                  disabled={loading || deletingId === player.id}
                  aria-label={`Delete registration for ${player.ign}`}
                >
                  {deletingId === player.id ? "Deleting…" : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Admin() {
  const [adminKey, setAdminKey] = useState(() => readSession(STORAGE_KEY));
  const [password, setPassword] = useState("");
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const mpPlayers = useMemo(
    () => players.filter((p) => p.modeMp),
    [players]
  );
  const brPlayers = useMemo(
    () => players.filter((p) => p.modeBr),
    [players]
  );

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
      writeSession(STORAGE_KEY, key);
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
    removeSession(STORAGE_KEY);
    setAdminKey("");
    setPlayers([]);
    setPassword("");
    setError("");
    setDeletingId(null);
  }

  async function handleDelete(player) {
    const label = player.ign || "this player";
    if (
      !window.confirm(
        `Remove registration for ${label}? This cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(player.id);
    setError("");
    try {
      await deleteAdminPlayer(adminKey, player.id);
      setPlayers((prev) => prev.filter((p) => p.id !== player.id));
    } catch (err) {
      setError(err.message || "Could not delete registration.");
    } finally {
      setDeletingId(null);
    }
  }

  if (!adminKey) {
    return (
      <div className="admin-page">
        <div className="container admin-login">
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
            {mpPlayers.length} MP · {brPlayers.length} BR · {players.length} total sign-ups
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
        <div className="admin-lists">
          <section className="admin-list panel">
            <div className="admin-list__head">
              <h2 className="admin-list__title">Multiplayer</h2>
              <span className="admin-list__count">{mpPlayers.length}</span>
            </div>
            <MpRosterPanel
              adminKey={adminKey}
              mpPlayers={mpPlayers}
              disabled={loading}
            />
            <MpFixturesPanel adminKey={adminKey} disabled={loading} />
            <MpBracketPanel adminKey={adminKey} disabled={loading} />
            <AdminPlayerTable
              players={mpPlayers}
              deletingId={deletingId}
              loading={loading}
              onDelete={handleDelete}
            />
          </section>

          <section className="admin-list panel admin-list--br">
            <div className="admin-list__head">
              <h2 className="admin-list__title">Battle Royale</h2>
              <span className="admin-list__count">{brPlayers.length}</span>
            </div>
            <BrDraftPanel
              adminKey={adminKey}
              brCount={brPlayers.length}
              disabled={loading}
            />
            <AdminPlayerTable
              players={brPlayers}
              deletingId={deletingId}
              loading={loading}
              onDelete={handleDelete}
            />
          </section>
        </div>
      )}
    </div>
  );
}
