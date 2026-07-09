export const DEMO_AUTH_FLAG = "ecoroute-demo-auth";
export const DEMO_AUTH_TOKENS = Object.freeze({
  customer: "ecoroute-demo-customer-token-2026",
  driver: "ecoroute-demo-driver-token-2026",
  admin: "ecoroute-demo-admin-token-2026",
});
export const DEMO_AUTH_TOKEN = DEMO_AUTH_TOKENS.customer;

export const DEMO_CREDENTIALS = Object.freeze({
  email: "demo@ecoroute.com.br",
  password: "EcoRoute@2026",
});

export const DEMO_DRIVER_CREDENTIALS = Object.freeze({
  email: "prestador@ecoroute.com.br",
  password: "EcoRoute@2026",
});

export const DEMO_ADMIN_CREDENTIALS = Object.freeze({
  email: "dono@ecoroute.com.br",
  password: "EcoRoute@2026",
});

export const DEMO_USER = Object.freeze({
  id: "demo-customer-001",
  name: "Cliente Demonstração",
  email: DEMO_CREDENTIALS.email,
  phone: "(11) 4002-8922",
  role: "customer_admin",
  orgId: "demo-org-sp",
  address: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP",
  location: {
    latitude: -23.561684,
    longitude: -46.655981,
    address: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP",
  },
});

export const DEMO_DRIVER_USER = Object.freeze({
  id: "demo-driver-001",
  name: "Prestador Demonstração",
  email: DEMO_DRIVER_CREDENTIALS.email,
  phone: "(11) 97777-2026",
  role: "driver",
  orgId: "demo-org-sp",
  address: "Rua Augusta, 1200 - Consolação, São Paulo - SP",
  location: {
    latitude: -23.555771,
    longitude: -46.662308,
    address: "Rua Augusta, 1200 - Consolação, São Paulo - SP",
  },
});

export const DEMO_ADMIN_USER = Object.freeze({
  id: "demo-admin-001",
  name: "Dono Demonstração",
  email: DEMO_ADMIN_CREDENTIALS.email,
  phone: "(11) 98888-2026",
  role: "super_admin",
  orgId: null,
  address: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP",
  location: {
    latitude: -23.561684,
    longitude: -46.655981,
    address: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP",
  },
});

export function getDemoLogin(email, password) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const rawPassword = String(password || "");

  if (normalizedEmail === DEMO_CREDENTIALS.email && rawPassword === DEMO_CREDENTIALS.password) {
    return { sessionType: "customer", token: DEMO_AUTH_TOKENS.customer, user: DEMO_USER };
  }

  if (normalizedEmail === DEMO_DRIVER_CREDENTIALS.email && rawPassword === DEMO_DRIVER_CREDENTIALS.password) {
    return { sessionType: "driver", token: DEMO_AUTH_TOKENS.driver, user: DEMO_DRIVER_USER };
  }

  if (normalizedEmail === DEMO_ADMIN_CREDENTIALS.email && rawPassword === DEMO_ADMIN_CREDENTIALS.password) {
    return { sessionType: "admin", token: DEMO_AUTH_TOKENS.admin, user: DEMO_ADMIN_USER };
  }

  return null;
}

export function isDemoLogin(email, password) {
  return Boolean(getDemoLogin(email, password));
}

export function isDemoToken(token) {
  return Object.values(DEMO_AUTH_TOKENS).includes(token);
}

export function getDemoUserByToken(token) {
  if (token === DEMO_AUTH_TOKENS.admin) return DEMO_ADMIN_USER;
  if (token === DEMO_AUTH_TOKENS.driver) return DEMO_DRIVER_USER;
  if (token === DEMO_AUTH_TOKENS.customer) return DEMO_USER;
  return null;
}

export function getDemoSessionType() {
  if (typeof localStorage === "undefined") return null;
  const value = localStorage.getItem(DEMO_AUTH_FLAG);
  if (value === "admin") return "admin";
  if (value === "driver") return "driver";
  if (value === "customer" || value === "1") return "customer";
  return null;
}

export function getDemoUserForSession() {
  const sessionType = getDemoSessionType();
  if (sessionType === "admin") return DEMO_ADMIN_USER;
  if (sessionType === "driver") return DEMO_DRIVER_USER;
  if (sessionType === "customer") return DEMO_USER;
  return null;
}

export function hasDemoSession() {
  return Boolean(getDemoSessionType());
}

export function isDriverDemoSession() {
  return getDemoSessionType() === "driver";
}

export function isAdminDemoSession() {
  return getDemoSessionType() === "admin";
}

export function enableDemoSession(sessionType = "customer") {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(DEMO_AUTH_FLAG, sessionType);
  }
}

export function disableDemoSession() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(DEMO_AUTH_FLAG);
  }
}
