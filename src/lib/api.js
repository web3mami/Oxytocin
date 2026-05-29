const API_BASE = "";

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
