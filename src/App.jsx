import { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import TournamentInfo from "./components/TournamentInfo.jsx";
import RegistrationForm from "./components/RegistrationForm.jsx";
import TeamList from "./components/TeamList.jsx";
import { fetchTeams } from "./lib/api.js";
import { tournament } from "./config.js";

export default function App() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTeams() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchTeams();
      setTeams(data.teams || []);
    } catch {
      setError("Could not load registered teams.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeams();
  }, []);

  const spotsLeft = Math.max(0, tournament.maxTeams - teams.length);
  const registrationOpen = spotsLeft > 0;

  return (
    <>
      <Header spotsLeft={spotsLeft} teamCount={teams.length} />
      <main>
        <section className="hero" id="top">
          <div className="hero__glow" aria-hidden="true" />
          <div className="container hero__inner">
            <p className="eyebrow">Call of Duty Mobile</p>
            <h1>{tournament.name}</h1>
            <p className="hero__subtitle">{tournament.subtitle}</p>
            <div className="hero__stats">
              <div className="stat-pill">
                <span className="stat-pill__label">Format</span>
                <span className="stat-pill__value">{tournament.format}</span>
              </div>
              <div className="stat-pill">
                <span className="stat-pill__label">Date</span>
                <span className="stat-pill__value">{tournament.date}</span>
              </div>
              <div className="stat-pill">
                <span className="stat-pill__label">Prize</span>
                <span className="stat-pill__value accent">{tournament.prizePool}</span>
              </div>
              <div className="stat-pill">
                <span className="stat-pill__label">Spots left</span>
                <span className="stat-pill__value">{spotsLeft}</span>
              </div>
            </div>
            <div className="hero__actions">
              <a className="btn btn--primary" href="#register">
                Register your team
              </a>
              <a className="btn btn--ghost" href="#teams">
                View teams
              </a>
            </div>
          </div>
        </section>

        <TournamentInfo />

        <section className="section" id="register">
          <div className="container">
            <div className="section__head">
              <p className="eyebrow">Registration</p>
              <h2>Lock in your squad</h2>
              <p className="section__lead">
                {registrationOpen
                  ? `${spotsLeft} of ${tournament.maxTeams} team slots available. Deadline: ${tournament.registrationDeadline}.`
                  : "Registration is full. Join the Discord for waitlist updates."}
              </p>
            </div>
            <RegistrationForm
              disabled={!registrationOpen}
              onRegistered={() => loadTeams()}
            />
          </div>
        </section>

        <section className="section section--muted" id="teams">
          <div className="container">
            <div className="section__head">
              <p className="eyebrow">Roster</p>
              <h2>Registered teams</h2>
              <p className="section__lead">
                {teams.length} team{teams.length === 1 ? "" : "s"} signed up so far.
              </p>
            </div>
            <TeamList teams={teams} loading={loading} error={error} />
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer__inner">
          <p>Oxytocin CODM Cup — organized for the community.</p>
          <a href={tournament.discordInvite} target="_blank" rel="noreferrer">
            Join Discord
          </a>
        </div>
      </footer>
    </>
  );
}
