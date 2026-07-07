const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request to ${path} failed with ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  getCases: () => request("/api/cases"),
  getCaseStats: () => request("/api/cases/stats"),
  updateCase: (id, patch) =>
    request(`/api/cases/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  logCaseAction: (id, type) =>
    request(`/api/cases/${id}/actions`, { method: "POST", body: JSON.stringify({ type }) }),

  getTrainingModules: () => request("/api/training/modules"),
  getAudienceModes: () => request("/api/training/audience-modes"),
  getQaBank: (moduleId) =>
    request(`/api/training/qa-bank${moduleId ? `?moduleId=${moduleId}` : ""}`),
  getSessionHistory: () => request("/api/training/sessions"),
  logSession: (session) =>
    request("/api/training/sessions", { method: "POST", body: JSON.stringify(session) }),

  sendConciergeMessage: (message, history) =>
    request("/api/concierge/message", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),
};
