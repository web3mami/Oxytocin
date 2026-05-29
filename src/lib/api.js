const API_BASE = "";

export async function fetchTeams() {
  const res = await fetch(`${API_BASE}/api/teams`);
  if (!res.ok) throw new Error("Could not load teams");
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
