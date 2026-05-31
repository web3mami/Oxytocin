import { useEffect, useState } from "react";

const HERO_FONT = '400 1em "Wallpoet"';

async function waitForWallpoet() {
  await document.fonts.load(HERO_FONT);
  await document.fonts.ready;
  return document.fonts.check(HERO_FONT);
}

export default function Typewriter({ text, speed = 60, className = "" }) {
  const [fontReady, setFontReady] = useState(false);
  const [shown, setShown] = useState("");

  useEffect(() => {
    let cancelled = false;

    waitForWallpoet().then((ready) => {
      if (!cancelled) setFontReady(ready);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!fontReady) return;

    setShown("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, fontReady]);

  if (!fontReady) {
    return (
      <span className={`typewriter typewriter--loading ${className}`} aria-hidden="true">
        {text}
      </span>
    );
  }

  return <span className={`typewriter ${className}`}>{shown}</span>;
}
