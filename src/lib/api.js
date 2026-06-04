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
