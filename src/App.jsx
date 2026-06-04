import { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import TournamentInfo from "./components/TournamentInfo.jsx";
import RegistrationForm from "./components/RegistrationForm.jsx";
import Countdown from "./components/Countdown.jsx";
import Typewriter from "./components/Typewriter.jsx";
import PrizePool from "./components/PrizePool.jsx";
import { tournament } from "./config.js";

const REGISTRATION_CLOSE = new Date(tournament.registrationCloseISO).getTime();

export default function App() {
  const [registrationOpen, setRegistrationOpen] = useState(
    () => Date.now() < REGISTRATION_CLOSE
  );

  useEffect(() => {
    const tick = () => setRegistrationOpen(Date.now() < REGISTRATION_CLOSE);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <Header />
      <main>
        <section className="hero" id="top">
          <div className="hero__glow" aria-hidden="true" />
          <div className="hero__reticle" aria-hidden="true" />
          <div className="hero__frame" aria-hidden="true" />
          <div className="container hero__inner">
            <div className="hero__emblem">
              <img src="/emblem.svg" alt="Oxytocin Tournament" />
            </div>
            <p className="eyebrow">Call of Duty Mobile</p>
            <h1><Typewriter text={tournament.name} speed={95} /></h1>
            <p className="hero__subtitle">{tournament.subtitle}</p>
            <div className="hero__stats">
              <PrizePool />
              <div className="stat-pill">
                <span className="stat-pill__label">Modes</span>
                <span className="stat-pill__value">MP / BR</span>
              </div>
              <div className="stat-pill">
                <span className="stat-pill__label">Date</span>
                <span className="stat-pill__value">{tournament.date}</span>
              </div>
            </div>

            <Countdown />

            <div className="hero__actions">
              <a className="btn btn--primary" href="#register">
                Register now
              </a>
              <a className="btn btn--ghost" href="/roster">
                Battle roster
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
                  ? `Teams drafted after registration closes (${tournament.registrationDeadline}).`
                  : "Registration is closed."}
              </p>
            </div>
            <RegistrationForm disabled={!registrationOpen} />
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer__sponsor">
          <span className="footer__sponsor-label">Sponsored by</span>
          <a
            className="footer__sponsor-link"
            href={tournament.sponsor.xUrl}
            target="_blank"
            rel="noreferrer noopener"
          >
            <span className="footer__sponsor-name">
              {tournament.sponsor.name}{" "}
              <span className="footer__sponsor-handle">@{tournament.sponsor.xHandle}</span>
            </span>
          </a>
        </div>
      </footer>
    </>
  );
}
