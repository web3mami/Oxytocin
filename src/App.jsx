import { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import TournamentInfo from "./components/TournamentInfo.jsx";
import RegistrationForm from "./components/RegistrationForm.jsx";
import Countdown from "./components/Countdown.jsx";
import Typewriter from "./components/Typewriter.jsx";
import { fetchPlayers } from "./lib/api.js";
import { tournament } from "./config.js";

export default function App() {
  const [players, setPlayers] = useState([]);

  async function loadPlayers() {
    try {
      const data = await fetchPlayers();
      setPlayers(data.players || []);
    } catch {
      /* spots count falls back to 0 registered */
    }
  }

  useEffect(() => {
    loadPlayers();
  }, []);

  const spotsLeft = Math.max(0, tournament.maxPlayers - players.length);
  const registrationOpen = spotsLeft > 0;

  return (
    <>
      <Header spotsLeft={spotsLeft} />
      <main>
        <section className="hero" id="top">
          <div className="hero__glow" aria-hidden="true" />
          <div className="hero__reticle" aria-hidden="true" />
          <div className="hero__frame" aria-hidden="true" />
          <div className="container hero__inner">
            <div className="hero__emblem">
              <img src="/emblem.svg" alt="Oxytocin Cup" />
            </div>
            <p className="eyebrow">Call of Duty Mobile</p>
            <h1><Typewriter text={tournament.name} speed={95} /></h1>
            <p className="hero__subtitle">{tournament.subtitle}</p>
            <div className="hero__stats">
              <div className="stat-pill">
                <span className="stat-pill__label">Modes</span>
                <span className="stat-pill__value">MP / BR</span>
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

            <Countdown />

            <div className="hero__actions">
              <a className="btn btn--primary" href="#register">
                Register now
              </a>
            </div>
          </div>
        </section>

        <TournamentInfo />

        <section className="section" id="register">
          <div className="container">
            <div className="section__head">
              <p className="eyebrow">Registration</p>
              <h2>Lock in your spot</h2>
              <p className="section__lead">
                {registrationOpen
                  ? `${spotsLeft} of ${tournament.maxPlayers} player slots available. Teams drafted after registration closes (${tournament.registrationDeadline}).`
                  : "Registration is full. Join the Discord for waitlist updates."}
              </p>
            </div>
            <RegistrationForm
              disabled={!registrationOpen}
              onRegistered={() => loadPlayers()}
            />
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
        <p className="footer__sponsor">
          Sponsored by <strong>Super Mom Milla</strong> · with love ♥
        </p>
      </footer>
    </>
  );
}
