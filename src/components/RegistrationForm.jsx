import { useState } from "react";
import { ROSTER_SIZE } from "../config.js";
import { submitRegistration } from "../lib/api.js";

const emptyPlayer = () => ({ ign: "", uid: "" });

export default function RegistrationForm({ disabled, onRegistered }) {
  const [teamName, setTeamName] = useState("");
  const [captainName, setCaptainName] = useState("");
  const [captainDiscord, setCaptainDiscord] = useState("");
  const [captainContact, setCaptainContact] = useState("");
  const [players, setPlayers] = useState(
    Array.from({ length: ROSTER_SIZE }, () => emptyPlayer())
  );
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updatePlayer(index, field, value) {
    setPlayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (disabled || submitting) return;

    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      await submitRegistration({
        teamName,
        captainName,
        captainDiscord,
        captainContact,
        players: players.map((p, i) => ({
          ...p,
          role: i === 0 ? "Captain" : `Player ${i + 1}`,
        })),
      });
      setMessage("Team registered successfully. Good luck, operator.");
      setTeamName("");
      setCaptainName("");
      setCaptainDiscord("");
      setCaptainContact("");
      setPlayers(Array.from({ length: ROSTER_SIZE }, () => emptyPlayer()));
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
          Registration is closed — all team slots are filled.
        </div>
      )}

      <fieldset disabled={disabled || submitting}>
        <legend className="form-section-title">Team</legend>
        <label className="field">
          <span>Team name</span>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g. Shadow Legion"
            required
            maxLength={32}
          />
        </label>
      </fieldset>

      <fieldset disabled={disabled || submitting}>
        <legend className="form-section-title">Captain contact</legend>
        <div className="field-grid">
          <label className="field">
            <span>Captain name</span>
            <input
              type="text"
              value={captainName}
              onChange={(e) => setCaptainName(e.target.value)}
              placeholder="Full name or gamertag"
              required
            />
          </label>
          <label className="field">
            <span>Discord username</span>
            <input
              type="text"
              value={captainDiscord}
              onChange={(e) => setCaptainDiscord(e.target.value)}
              placeholder="username or username#0000"
              required
            />
          </label>
          <label className="field field--wide">
            <span>Phone or email (optional)</span>
            <input
              type="text"
              value={captainContact}
              onChange={(e) => setCaptainContact(e.target.value)}
              placeholder="For urgent match-day contact"
            />
          </label>
        </div>
      </fieldset>

      <fieldset disabled={disabled || submitting}>
        <legend className="form-section-title">Roster — 5 players</legend>
        <p className="field-hint">
          Player 1 should be your in-game captain. UID is the numeric ID on your CODM profile.
        </p>
        <div className="roster">
          {players.map((player, index) => (
            <div className="roster-row" key={index}>
              <span className="roster-row__num">{index + 1}</span>
              <label className="field">
                <span>In-game name</span>
                <input
                  type="text"
                  value={player.ign}
                  onChange={(e) => updatePlayer(index, "ign", e.target.value)}
                  placeholder="IGN"
                  required
                />
              </label>
              <label className="field">
                <span>UID</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={player.uid}
                  onChange={(e) => updatePlayer(index, "uid", e.target.value)}
                  placeholder="1234567890"
                  required
                  pattern="\d{5,15}"
                />
              </label>
            </div>
          ))}
        </div>
      </fieldset>

      {error && <div className="alert alert--error">{error}</div>}
      {message && <div className="alert alert--success">{message}</div>}

      <button className="btn btn--primary btn--full" type="submit" disabled={disabled}>
        {submitting ? "Submitting…" : "Submit registration"}
      </button>
    </form>
  );
}
