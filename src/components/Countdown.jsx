import { useEffect, useState } from "react";
import { tournament } from "../config.js";

const TARGET = new Date(tournament.registrationCloseISO).getTime();

export default function Countdown() {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = Math.max(0, TARGET - now);
  const closed = diff <= 0;

  const days = Math.floor(diff / 86400000);
  const hrs = Math.floor((diff / 3600000) % 24);
  const mins = Math.floor((diff / 60000) % 60);
  const secs = Math.floor((diff / 1000) % 60);

  const units = [
    { label: "Days", value: days },
    { label: "Hrs", value: hrs },
    { label: "Min", value: mins },
    { label: "Sec", value: secs },
  ];

  return (
    <div className="countdown">
      <p className="eyebrow">{closed ? "Registration closed" : "Registration closes in"}</p>
      <div className="countdown__grid">
        {units.map((u) => (
          <div className="countdown__unit" key={u.label}>
            <span className="countdown__value">{String(u.value).padStart(2, "0")}</span>
            <span className="countdown__label">{u.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
