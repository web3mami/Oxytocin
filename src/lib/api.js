const API_BASE = "";

export async function fetchPlayerCount() {
  const res = await fetch(`${API_BASE}/api/players`);
  if (!res.ok) throw new Error("Could not load registration count");
  const data = await res.json();
  return data.count ?? 0;
}

/** @param {string} adminKey */
export async function fetchAdminPlayers(adminKey) {
  const res = await fetch(`${API_BASE}/api/admin/players`, {
    headers: { Authorization: `Bearer ${adminKey}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not load registrations");
  }
  return data;
}

/** @param {string} adminKey @param {object} payload */
export async function addAdminPlayer(adminKey, payload) {
  const res = await fetch(`${API_BASE}/api/admin/players`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not add registration");
  }
  return data.player;
}

/** @param {string} adminKey @param {string | number} id */
export async function deleteAdminPlayer(adminKey, id) {
  const res = await fetch(
    `${API_BASE}/api/admin/players?id=${encodeURIComponent(String(id))}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminKey}` },
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not delete registration");
  }
  return data;
}

/** @param {string} adminKey */
export async function draftBrTeams(adminKey) {
  const res = await fetch(`${API_BASE}/api/admin/draft-br`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminKey}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not draft BR teams");
  }
  return data;
}

/** @param {string} adminKey @param {{ squads: Array<object>, meta?: object }} payload */
export async function publishBrRoster(adminKey, payload) {
  const res = await fetch(`${API_BASE}/api/admin/publish-br-roster`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not publish BR roster");
  }
  return data;
}

/** @param {string} adminKey */
export async function fetchMpRoster(adminKey) {
  const res = await fetch(`${API_BASE}/api/admin/mp/roster`, {
    headers: { Authorization: `Bearer ${adminKey}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not load MP roster");
  }
  return data;
}

/** @param {string} adminKey @param {Array<object>} teams */
export async function saveMpRoster(adminKey, teams) {
  const res = await fetch(`${API_BASE}/api/admin/mp/roster`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${adminKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ teams }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not save MP roster");
  }
  return data;
}

/** @param {string} adminKey @param {Array<object>} teams */
export async function publishMpRoster(adminKey, teams) {
  const res = await fetch(`${API_BASE}/api/admin/mp/roster/publish`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ teams }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not publish MP roster");
  }
  return data;
}

/** @param {string} adminKey */
export async function fetchMpFixtures(adminKey) {
  const res = await fetch(`${API_BASE}/api/admin/mp/fixtures`, {
    headers: { Authorization: `Bearer ${adminKey}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not load MP draw");
  }
  return data;
}

/** @param {string} adminKey @param {Array<object>} matches */
export async function saveMpFixtures(adminKey, matches) {
  const res = await fetch(`${API_BASE}/api/admin/mp/fixtures`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${adminKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ matches }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not save MP draw");
  }
  return data;
}

/** @param {string} adminKey @param {Array<object>} matches */
export async function publishMpFixtures(adminKey, matches) {
  const res = await fetch(`${API_BASE}/api/admin/mp/fixtures/publish`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ matches }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not publish MP draw");
  }
  return data;
}

/** @param {string} adminKey */
export async function fetchMpBracket(adminKey) {
  const res = await fetch(`${API_BASE}/api/admin/mp/bracket`, {
    headers: { Authorization: `Bearer ${adminKey}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not load MP bracket");
  }
  return data;
}

/** @param {string} adminKey */
export async function generateMpBracket(adminKey) {
  const res = await fetch(`${API_BASE}/api/admin/mp/bracket/generate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminKey}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not generate MP bracket");
  }
  return data;
}

/** @param {string} adminKey @param {object} bracket */
export async function saveMpBracket(adminKey, bracket) {
  const res = await fetch(`${API_BASE}/api/admin/mp/bracket`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${adminKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ bracket }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not save MP bracket");
  }
  return data;
}

/** @param {string} adminKey @param {object} bracket */
export async function publishMpBracket(adminKey, bracket) {
  const res = await fetch(`${API_BASE}/api/admin/mp/bracket/publish`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ bracket }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not publish MP bracket");
  }
  return data;
}

export async function fetchBattleRosters() {
  const res = await fetch(`${API_BASE}/api/roster`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not load rosters");
  }
  return data;
}

/** @deprecated Public roster is admin-only; use fetchPlayerCount */
export async function fetchPlayers() {
  const res = await fetch(`${API_BASE}/api/players`);
  if (!res.ok) throw new Error("Could not load players");
  return res.json();
}

/** @param {object} payload */
export async function submitRegistration(payload) {
  const res = await fetch(`${API_BASE}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Registration failed");
  }
  return data;
}
