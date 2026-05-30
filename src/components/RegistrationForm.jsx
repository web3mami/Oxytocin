import { useState } from "react";
import { submitRegistration } from "../lib/api.js";

export default function RegistrationForm({ disabled, onRegistered }) {
  const [ign, setIgn] = useState("");
  const [uid, setUid] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [modeMp, setModeMp] = useState(false);
  const [modeBr, setModeBr] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (disabled || submitting) return;

    if (!ign.trim()) {
      setError("Please enter your in-game name.");
      return;
    }
    if (!modeMp && !modeBr) {
      setError("Pick at least one mode (MP, BR, or both).");
      return;
    }

    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      await submitRegistration({
        ign: ign.trim(),
        uid: uid.trim(),
        xHandle: xHandle.replace(/^@/, "").trim(),
        modeMp,
        modeBr,
      });
      setMessage("Registered successfully. Good luck, operator.");
      setIgn("");
      setUid("");
      setXHandle("");
      setModeMp(false);
      setModeBr(false);
      onRegistered?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="register-form panel" onSubmit={handleSubmit}>
      {disabled && (
        <div className="alert alert--warn">
          Registration is closed.
        </div>
      )}

      <fieldset disabled={disabled || submitting}>
        <legend className="form-section-title">Player identity</legend>
        <div className="field-grid">
          <label className="field">
            <span>In-game name (IGN)</span>
            <input
              type="text"
              value={ign}
              onChange={(e) => setIgn(e.target.value)}
              placeholder="Your CODM IGN"
              required
              maxLength={32}
            />
          </label>
          <label className="field">
            <span>UID</span>
            <input
              type="text"
              inputMode="numeric"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder="1234567890"
              required
              pattern="\d{5,15}"
            />
          </label>
          <label className="field">
            <span>X handle</span>
            <input
              type="text"
              value={xHandle}
              onChange={(e) => setXHandle(e.target.value)}
              placeholder="@yourhandle"
            />
          </label>
        </div>
      </fieldset>

      <fieldset disabled={disabled || submitting}>
        <legend className="form-section-title">Mode</legend>
        <p className="field-hint">Pick one or both. Select both to play MP and BR.</p>
        <div className="mode-grid">
          <label className={`mode-card ${modeMp ? "mode-card--active" : ""}`}>
            <input
              type="checkbox"
              checked={modeMp}
              onChange={(e) => setModeMp(e.target.checked)}
            />
            <span className="mode-card__title">Multiplayer</span>
            <span className="mode-card__tag">MP</span>
          </label>
          <label className={`mode-card ${modeBr ? "mode-card--active" : ""}`}>
            <input
              type="checkbox"
              checked={modeBr}
              onChange={(e) => setModeBr(e.target.checked)}
            />
            <span className="mode-card__title">Battle Royale</span>
            <span className="mode-card__tag">BR</span>
          </label>
        </div>
      </fieldset>

      {error && <div className="alert alert--error">{error}</div>}
      {message && <div className="alert alert--success">{message}</div>}

      <button className="btn btn--primary btn--full" type="submit" disabled={disabled}>
        {submitting ? "Submitting..." : "Submit registration"}
      </button>
    </form>
  );
}
