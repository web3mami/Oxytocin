import { useState } from "react";
import { tournament } from "../config.js";
import { submitRegistration } from "../lib/api.js";

export default function RegistrationForm({ disabled, onRegistered }) {
  const [ign, setIgn] = useState("");
  const [uid, setUid] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [discord, setDiscord] = useState("");
  const [modes, setModes] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function toggleMode(mode) {
    setModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (disabled || submitting) return;

    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      await submitRegistration({ ign, uid, xHandle, discord, modes });
      setMessage(
        "You're registered. Teams will be drafted before the event — check Discord for updates."
      );
      setIgn("");
      setUid("");
      setXHandle("");
      setDiscord("");
      setModes([]);
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
          Registration is closed — all player slots are filled.
        </div>
      )}

      <fieldset disabled={disabled || submitting}>
        <legend className="form-section-title">Player details</legend>
        <div className="field-grid">
          <label className="field">
            <span>CODM in-game name</span>
            <input
              type="text"
              value={ign}
              onChange={(e) => setIgn(e.target.value)}
              placeholder="Your IGN"
              required
              maxLength={24}
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
              placeholder="@username"
              required
              maxLength={16}
            />
          </label>
          <label className="field">
            <span>Discord username</span>
            <input
              type="text"
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
              placeholder="username"
              required
            />
          </label>
        </div>
      </fieldset>

      <fieldset disabled={disabled || submitting}>
        <legend className="form-section-title">Mode preference</legend>
        <p className="field-hint">Select one or both — used for drafting and bracket placement.</p>
        <div className="mode-options">
          {tournament.modes.map((mode) => (
            <label className="mode-option" key={mode}>
              <input
                type="checkbox"
                checked={modes.includes(mode)}
                onChange={() => toggleMode(mode)}
              />
              <span>{mode}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && <div className="alert alert--error">{error}</div>}
      {message && <div className="alert alert--success">{message}</div>}

      <button className="btn btn--primary btn--full" type="submit" disabled={disabled}>
        {submitting ? "Submitting…" : "Register"}
      </button>
    </form>
  );
}
