import { useState } from "react";
import { addAdminPlayer } from "../lib/api.js";

/**
 * @param {{
 *   adminKey: string,
 *   disabled?: boolean,
 *   modeBr?: boolean,
 *   modeMp?: boolean,
 *   allowModeMp?: boolean,
 *   onAdded?: (player: object) => void,
 * }} props
 */
export default function AdminAddPlayerForm({
  adminKey,
  disabled = false,
  modeBr = true,
  modeMp = false,
  allowModeMp = false,
  onAdded,
}) {
  const [open, setOpen] = useState(false);
  const [ign, setIgn] = useState("");
  const [uid, setUid] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [alsoMp, setAlsoMp] = useState(modeMp);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function resetForm() {
    setIgn("");
    setUid("");
    setXHandle("");
    setAlsoMp(modeMp);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (disabled || submitting) return;

    if (!ign.trim()) {
      setError("Enter an in-game name.");
      return;
    }
    if (!/^\d{19,20}$/.test(uid.trim())) {
      setError("UID must be 19–20 digits.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const player = await addAdminPlayer(adminKey, {
        ign: ign.trim(),
        uid: uid.trim(),
        xHandle: xHandle.replace(/^@/, "").trim(),
        modeBr,
        modeMp: allowModeMp ? alsoMp : modeMp,
      });
      setMessage(`Added ${player.ign} to BR registrations.`);
      resetForm();
      onAdded?.(player);
    } catch (err) {
      setError(err.message || "Could not add player.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-add-player">
      <div className="admin-add-player__head">
        <div>
          <h3 className="admin-add-player__title">Add player manually</h3>
          <p className="admin-add-player__lead">
            Register someone who missed the public form. They will appear in the BR list below.
          </p>
        </div>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => setOpen((v) => !v)}
          disabled={disabled}
          aria-expanded={open}
        >
          {open ? "Hide form" : "Add player"}
        </button>
      </div>

      {open ? (
        <form className="admin-add-player__form" onSubmit={handleSubmit}>
          <div className="field-grid">
            <label className="field">
              <span>IGN</span>
              <input
                type="text"
                value={ign}
                onChange={(e) => setIgn(e.target.value)}
                placeholder="In-game name"
                required
                maxLength={32}
                disabled={disabled || submitting}
              />
            </label>
            <label className="field">
              <span>UID</span>
              <input
                type="text"
                inputMode="numeric"
                value={uid}
                onChange={(e) => setUid(e.target.value.replace(/\D/g, "").slice(0, 20))}
                required
                maxLength={20}
                pattern="\d{19,20}"
                title="19–20 digit CODM UID"
                disabled={disabled || submitting}
              />
            </label>
            <label className="field">
              <span>X handle</span>
              <input
                type="text"
                value={xHandle}
                onChange={(e) => setXHandle(e.target.value)}
                placeholder="@optional"
                disabled={disabled || submitting}
              />
            </label>
          </div>

          {allowModeMp ? (
            <label className="admin-add-player__mode">
              <input
                type="checkbox"
                checked={alsoMp}
                onChange={(e) => setAlsoMp(e.target.checked)}
                disabled={disabled || submitting}
              />
              <span>Also register for Multiplayer</span>
            </label>
          ) : (
            <p className="admin-add-player__mode-note">Mode: Battle Royale</p>
          )}

          {error ? <div className="alert alert--error">{error}</div> : null}
          {message ? <div className="alert alert--success">{message}</div> : null}

          <div className="admin-add-player__actions">
            <button
              className="btn btn--primary"
              type="submit"
              disabled={disabled || submitting}
            >
              {submitting ? "Adding…" : "Add to BR"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
