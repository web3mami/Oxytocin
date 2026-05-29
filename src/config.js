/** @type {import('./config.js').TournamentConfig} */
export const tournament = {
  name: "Oxytocin CODM Cup",
  subtitle: "Season 1 — Call of Duty Mobile Tournament",
  format: "5v5 Search & Destroy",
  mode: "Multiplayer Ranked Ruleset",
  date: "June 14, 2026",
  time: "6:00 PM (local)",
  venue: "Online — Discord lobby",
  maxTeams: 16,
  entryFee: "Free",
  prizePool: "₱15,000",
  registrationDeadline: "June 10, 2026",
  discordInvite: "https://discord.gg/your-invite",
  rules: [
    "All players must use mobile devices — no emulators.",
    "Roster locked at registration. Substitutes allowed up to 24h before start.",
    "Each team fields exactly 5 players with valid CODM UIDs.",
    "Matches are best-of-3 Search & Destroy on tournament maps.",
    "Cheating, account sharing, or toxicity results in immediate disqualification.",
    "Captains must be reachable on Discord during the entire event.",
  ],
  schedule: [
    { label: "Registration opens", date: "May 30, 2026" },
    { label: "Registration closes", date: "June 10, 2026" },
    { label: "Bracket reveal", date: "June 12, 2026" },
    { label: "Group stage", date: "June 14, 2026" },
    { label: "Grand finals", date: "June 15, 2026" },
  ],
};

export const ROSTER_SIZE = 5;
