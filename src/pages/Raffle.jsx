import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchPublicRaffle } from "../lib/api.js";
import { entryKey, normalizeEntry } from "../../shared/raffle.js";

function labelFor(entry) {
  if (!entry) return "—";
  return entry.team ? `${entry.ign} · ${entry.team}` : entry.ign;
}

export default function Raffle() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({ published: false, pool: [], winners: [], spots: 0, drawnAt: null });

  // Reveal animation state
  const [running, setRunning] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [flashName, setFlashName] = useState("");
  const [celebrate, setCelebrate] = useState(false);
  const timers = useRef([]);

  const clearTimers = useCallback(() => {
    for (const t of timers.current) clearTimeout(t);
    for (const t of timers.current) clearInterval(t);
    timers.current = [];
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const raffle = await fetchPublicRaffle();
        if (cancelled) return;
        setData({
          published: Boolean(raffle.published),
          pool: raffle.pool ?? [],
          winners: raffle.winners ?? [],
          spots: raffle.spots ?? (raffle.winners ?? []).length,
          drawnAt: raffle.drawnAt ?? null,
        });
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load the raffle.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const winners = data.winners ?? [];
  const pool = data.pool ?? [];
  const hasDraw = data.published && winners.length > 0;

  // Group winners by destination (team or "Standby"); only when dests are set.
  const destGroups = useMemo(() => {
    if (!winners.some((w) => w.dest)) return [];
    const map = new Map();
    for (const w of winners) {
      const key = w.dest || "Reserve";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(w);
    }
    // Real teams first, Standby/Reserve last.
    return [...map.entries()].sort(
      (a, b) => Number(/standby|reserve/i.test(a[0])) - Number(/standby|reserve/i.test(b[0]))
    );
  }, [winners]);

  const runReveal = useCallback(() => {
    if (!hasDraw || running) return;
    clearTimers();
    setCelebrate(false);
    setRevealedCount(0);
    setRunning(true);

    const poolNames = (pool.length ? pool : winners).map((p) => p.ign);
    const spinTick = setInterval(() => {
      const name = poolNames[Math.floor(Math.random() * poolNames.length)] ?? "";
      setFlashName(name);
    }, 70);
    timers.current.push(spinTick);

    // Lock each winner one at a time, staggered.
    let elapsed = 0;
    winners.forEach((_, i) => {
      const spin = 1300 + i * 750;
      elapsed += spin;
      const t = setTimeout(() => {
        setRevealedCount(i + 1);
      }, elapsed);
      timers.current.push(t);
    });

    const end = setTimeout(() => {
      clearInterval(spinTick);
      setRunning(false);
      setFlashName("");
      setCelebrate(true);
    }, elapsed + 200);
    timers.current.push(end);
  }, [hasDraw, running, pool, winners, clearTimers]);

  return (
    <div className="raffle-page">
      <header className="roster-page__header">
        <a className="brand" href="/">
          <img src="/emblem.svg" alt="Oxytocin Tournament" className="brand__mark" />
          <span>
            <strong>Oxytocin</strong>
            <small>Tournament</small>
          </span>
        </a>
        <a className="btn btn--ghost" href="/roster">
          Battle roster →
        </a>
      </header>

      <main className="container raffle-page__main">
        <p className="eyebrow">Second chance</p>
        <h1 className="raffle-page__title">Reserve raffle</h1>
        <p className="raffle-page__lead">
          Knocked out, but not out of luck. Eliminated players go into the draw — if the
          reserve spot lands on your name, you play on for another team. Pure luck.
        </p>

        {error ? <div className="alert alert--error">{error}</div> : null}

        {loading ? (
          <p className="empty-state">Loading the draw…</p>
        ) : !hasDraw ? (
          <div className="alert alert--warn roster-page__notice">
            The reserve raffle hasn’t been drawn yet. Check back once the organizer spins it.
          </div>
        ) : (
          <>
            <div className={`raffle-stage${celebrate ? " raffle-stage--won" : ""}`}>
              {celebrate ? <div className="raffle-stage__confetti" aria-hidden="true">🎉</div> : null}
              <p className="raffle-stage__count">
                {winners.length} reserve spot{winners.length === 1 ? "" : "s"} ·{" "}
                {pool.length} in the draw
              </p>
              <div
                className="raffle-reels"
                style={{ "--raffle-cols": Math.min(winners.length, 4) }}
              >
                {winners.map((winner, i) => {
                  const locked = i < revealedCount;
                  const spinning = running && i === revealedCount;
                  return (
                    <div
                      className={`raffle-reel${locked ? " raffle-reel--locked" : ""}${
                        spinning ? " raffle-reel--spinning" : ""
                      }`}
                      key={entryKey(normalizeEntry(winner))}
                    >
                      <span className="raffle-reel__num">{i + 1}</span>
                      {locked ? (
                        <span className="raffle-reel__name">
                          <span className="raffle-reel__ign">{winner.ign}</span>
                          {winner.dest ? (
                            <span className="raffle-reel__move">
                              <span className="raffle-reel__from">
                                {winner.team || "free agent"}
                              </span>
                              <span className="raffle-reel__dest">→ {winner.dest}</span>
                            </span>
                          ) : winner.team ? (
                            <span className="raffle-reel__team">{winner.team}</span>
                          ) : null}
                        </span>
                      ) : spinning ? (
                        <span className="raffle-reel__name raffle-reel__name--flash">
                          {flashName || "…"}
                        </span>
                      ) : (
                        <span className="raffle-reel__name raffle-reel__name--idle">?</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="btn btn--primary raffle-stage__btn"
                onClick={runReveal}
                disabled={running}
              >
                {running
                  ? "Spinning…"
                  : revealedCount > 0
                    ? "Reveal again"
                    : "Reveal the winners"}
              </button>
            </div>

            {celebrate && revealedCount >= winners.length ? (
              destGroups.length ? (
                <section className="raffle-result">
                  <h2 className="raffle-result__title">Where they land</h2>
                  <div className="raffle-dest-groups">
                    {destGroups.map(([dest, members]) => {
                      const standby = /standby/i.test(dest);
                      return (
                        <article
                          className={`raffle-dest${standby ? " raffle-dest--standby" : ""}`}
                          key={dest}
                        >
                          <h3 className="raffle-dest__name">{dest}</h3>
                          <ul className="raffle-dest__members">
                            {members.map((w) => (
                              <li key={entryKey(normalizeEntry(w))}>
                                <span className="raffle-dest__ign">{w.ign}</span>
                                <span className="raffle-dest__from">
                                  from {w.team || "free agent"}
                                </span>
                              </li>
                            ))}
                          </ul>
                          {standby ? (
                            <p className="raffle-dest__note">
                              On standby — slots into any team that ends up short.
                            </p>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </section>
              ) : (
                <section className="raffle-result">
                  <h2 className="raffle-result__title">Reserve spots go to…</h2>
                  <ol className="raffle-result__list">
                    {winners.map((w) => (
                      <li className="raffle-result__item" key={entryKey(normalizeEntry(w))}>
                        <span className="raffle-result__ign">{w.ign}</span>
                        {w.team ? <span className="raffle-result__team">{w.team}</span> : null}
                      </li>
                    ))}
                  </ol>
                </section>
              )
            ) : null}

            {pool.length ? (
              <section className="raffle-pool">
                <h2 className="raffle-pool__title">In the draw ({pool.length})</h2>
                <ul className="raffle-pool__list">
                  {pool.map((p) => {
                    const won = winners.some(
                      (w) => entryKey(normalizeEntry(w)) === entryKey(normalizeEntry(p))
                    );
                    return (
                      <li
                        className={`raffle-pool__chip${
                          won && revealedCount >= winners.length
                            ? " raffle-pool__chip--won"
                            : ""
                        }`}
                        key={entryKey(normalizeEntry(p))}
                      >
                        {labelFor(p)}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
