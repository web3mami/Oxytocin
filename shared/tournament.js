export const tournament = {
  name: "Oxytocin Tournament",
  subtitle: "Season 1 — Call of Duty Mobile Tournament",
  modes: ["Multiplayer (MP)", "Battle Royale (BR)"],
  date: "June 6, 2026",
  time: "6:00 PM (local)",
  venue: "Online — Discord lobby",
  entryFee: "Free",
  prizePool: {
    total: "₦200,000",
    splits: [
      {
        mode: "Battle Royale Duo",
        amount: "₦100,000",
      },
      {
        mode: "Multiplayer",
        amount: "₦100,000",
        detail: "Top 3 winning team",
      },
    ],
  },
  sponsor: {
    name: "Sakura",
    xHandle: "Sakuramanga_",
    xUrl: "https://x.com/Sakuramanga_",
  },
  registrationDeadline: "June 4, 2026 at 2:00 PM",
  registrationCloseISO: "2026-06-04T14:00:00",
  discordInvite: "https://discord.gg/your-invite",
  rules: [
    "Register as an individual — teams will be drafted by the organizer.",
    "All players must use mobile devices — no emulators.",
    "Provide a valid CODM IGN and a reachable X handle.",
    "Drafted rosters are final once announced.",
    "Cheating, account sharing, or toxicity results in immediate disqualification.",
    "Streamer Mode is prohibited.",
    "Use of emotes at any point during the game will lead to an instant DQ.",
  ],
  bans: {
    weapons: {
      general: [
        { name: "SO14", type: "Marksman Rifle" },
        { name: "Striker", type: "Shotgun" },
        { name: "Oden", type: "Assault Rifle" },
        { name: "USS 9", type: "SMG" },
      ],
      thermite: ["Rytec AMR", "Kilo Bolt-Action", "Crossbow", "Man-O-War"],
    },
    perks: {
      blue: ["Persistence", "Alert", "High Alert"],
      red: ["Martyrdom"],
      green: ["Quick Fix", "Tracker"],
    },
  },
  schedule: [
    { label: "Registration opens", date: "May 30, 2026" },
    { label: "Registration closes", date: "June 4, 2026 at 2:00 PM" },
    { label: "Team draft / reveal", date: "June 6, 2026" },
    { label: "Group stage", date: "June 6, 2026" },
    { label: "Grand finals", date: "June 6, 2026" },
  ],
  mpFormat: {
    series: "Best of 3",
    description: "Modes are Search & Destroy and Domination.",
    tiebreaker: "Hardpoint",
    modes: [
      {
        name: "Search & Destroy",
        rules: ["Rounds: 6", "Time limit: 90 seconds"],
        maps: ["Tunisia", "Firing Range", "Hackney Yard"],
      },
      {
        name: "Domination",
        rules: ["Score limit: 250", "Time limit: 600 seconds"],
        maps: ["Standoff", "Firing Range", "Vacant"],
      },
    ],
    tiebreakerMode: {
      name: "Hardpoint",
      rules: ["Score limit: 250", "Time limit: 600 seconds"],
      maps: ["Summit", "Firing Range", "Standoff"],
    },
  },
};

export const ROSTER_SIZE = 5;
