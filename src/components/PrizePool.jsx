import { useEffect, useRef, useState } from "react";
import { tournament } from "../config.js";

function parseCurrency(str) {
  const match = str.match(/^([^\d]*)([\d,]+)$/);
  if (!match) return { prefix: "", value: 0 };
  return {
    prefix: match[1],
    value: Number(match[2].replace(/,/g, "")),
  };
}

function formatCurrency(prefix, value) {
  return `${prefix}${Math.round(value).toLocaleString("en-US")}`;
}

function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - 2 ** (-10 * t);
}

export default function PrizePool() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const { prefix, value: totalValue } = parseCurrency(tournament.prizePool.total);
  const [displayTotal, setDisplayTotal] = useState(() => formatCurrency(prefix, 0));

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return undefined;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplayTotal(tournament.prizePool.total);
      return undefined;
    }

    const duration = 2000;
    const start = performance.now();
    let raf = 0;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplayTotal(formatCurrency(prefix, totalValue * easeOutExpo(progress)));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, prefix, totalValue]);

  return (
    <div
      ref={ref}
      className={`stat-pill stat-pill--prize${visible ? " is-visible" : ""}`}
    >
      <span className="stat-pill__label">Prize pool</span>
      <div className="stat-pill__value">
        <div className="stat-pill__prize-total">
          <span className="stat-pill__prize-total-label">Total prize pool</span>
          <span className="stat-pill__prize-total-amount" aria-live="polite">
            <span className="stat-pill__prize-total-amount-text">{displayTotal}</span>
          </span>
        </div>
        <div className="stat-pill__prize-splits">
          {tournament.prizePool.splits.map((split, index) => (
            <div
              className="stat-pill__prize-card"
              key={split.mode}
              style={{ "--prize-card-delay": `${0.55 + index * 0.22}s` }}
            >
              <p className="stat-pill__prize-mode">{split.mode}</p>
              <p className="stat-pill__prize-amount">{split.amount}</p>
              {split.detail ? (
                <p className="stat-pill__prize-detail">{split.detail}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
