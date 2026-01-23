// 🌍 Base API URL (Backend URL) - FORCE full URL
export const API_URL = "/api";

// ⬇️ Helper to fetch with token
async function request(path: string, method: string, body?: any) {
  let token = "";
  if (typeof window !== "undefined") {
    token = localStorage.getItem("token") || "";
  }

  const fullUrl = `${API_URL}${path}`;
  console.log(`🔍 Requesting: ${method} ${fullUrl}`); // Debug log

  const res = await fetch(fullUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  // 🔐 If unauthorized → logout and redirect
  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`HTTP error! status: ${res.status} - ${msg}`);
  }

  return res.json();
}

// 📌 Exported wrapper API
export const api = {
  get: (path: string) => request(path, "GET"),
  post: (path: string, body?: any) => request(path, "POST", body),
  put: (path: string, body?: any) => request(path, "PUT", body),
  delete: (path: string) => request(path, "DELETE"),
};

// 🔧 Authorization header (if needed separately)
export function authHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : "";
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

/* ------------------------------------------------------------------
   🔌 API-Specific Helpers
-------------------------------------------------------------------*/

// 🖥️ Get Active Nodes
export async function getNodes() {
  return api.get("/headscale/nodes");
}

// 🔑 Create PreAuth Key
export async function createPreauthKey() {
  return api.post("/headscale/keys");
}

// 👤 Create User in Headscale
export async function createUser(name: string) {
  return api.post("/headscale/users", { name });
}

// 🔑 Login + Store Token
export async function login(email: string, password: string) {
  const data = await api.post("/auth/login", { email, password });
  localStorage.setItem("token", data.token);
  return data;
}

// 📝 Register User
export async function register(name: string, email: string, password: string) {
  return api.post("/auth/register", { name, email, password });
}
