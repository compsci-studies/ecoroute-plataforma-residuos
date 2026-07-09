import { randomUUID } from "crypto";

import { SAO_PAULO_DROPOFF_POINTS, MATERIAL_OPTIONS } from "../data/saoPauloDropoffPoints.js";
import { getRoute } from "./openRouteService.js";
import { calculatePrice } from "./pricingEngine.js";
import { BadRequestError } from "../utils/httpErrors.js";

const RECICLA_SAMPA_URL = "https://www.reciclasampa.com.br/painel/auxiliar/getEcoponto.php";

const ECOROUTE_DEPOT = {
  latitude: -23.55052,
  longitude: -46.63331,
  address: "Base operacional EcoRoute - Se, São Paulo - SP",
};

const demoRequests = [];

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getMaterialOption(material) {
  const normalized = normalizeText(material || "reciclaveis");
  return MATERIAL_OPTIONS.find((option) => {
    const id = normalizeText(option.id);
    const label = normalizeText(option.label);
    return id === normalized || label === normalized;
  }) || MATERIAL_OPTIONS[0];
}

function materialMatches(point, material) {
  const option = getMaterialOption(material);
  if (!option.id || option.id === "reciclaveis") return true;
  const accepted = point.accepts?.map(normalizeText) || [];
  if (option.id === "papel") return accepted.includes("papel") || accepted.includes("papelao");
  return accepted.includes(normalizeText(option.id));
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function withDistance(point, latitude, longitude) {
  if (latitude === null || longitude === null) return point;
  return {
    ...point,
    distanceKm: Math.round(
      haversineKm(latitude, longitude, point.latitude, point.longitude) * 100
    ) / 100,
  };
}

function sortByDistance(points) {
  return [...points].sort((a, b) => {
    if (a.distanceKm === undefined && b.distanceKm === undefined) return a.name.localeCompare(b.name);
    if (a.distanceKm === undefined) return 1;
    if (b.distanceKm === undefined) return -1;
    return a.distanceKm - b.distanceKm;
  });
}

function stripHtml(value = "") {
  return String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function parseReciclaSampaPoints(payload, materialOption) {
  const raw = payload?.pontos;
  if (!raw || typeof raw !== "string") return [];

  return raw
    .split("|")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry, index) => {
      const parts = entry.split("+");
      const address = stripHtml(parts[0]);
      const name = stripHtml(parts[1]);
      const latitude = toNumber(parts[2]);
      const longitude = toNumber(parts[3]);
      const html = parts.slice(5).join(" ");

      if (!name || latitude === null || longitude === null) return null;

      return {
        id: `recicla-sampa-${normalizeText(name).replace(/[^a-z0-9]+/g, "-")}-${index}`,
        name,
        address,
        region: "São Paulo",
        latitude,
        longitude,
        accepts: [materialOption.id || "reciclaveis"],
        hours: stripHtml(html.match(/Horario de funcionamento:<\/u><\/span><br>\s*([^<]+)/i)?.[1] || "-"),
        source: "Recicla Sampa",
        sourceUrl: "https://www.reciclasampa.com.br/pontos-de-coleta",
      };
    })
    .filter(Boolean);
}

async function fetchReciclaSampaPoints({ address, material }) {
  const materialOption = getMaterialOption(material);
  if (!address || String(address).trim().length < 5) return [];

  const params = new URLSearchParams({
    termo: address,
    item: materialOption.reciclaSampaItemId || "",
  });

  const response = await fetch(RECICLA_SAMPA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "User-Agent": "EcoRoute academic prototype",
    },
    body: params.toString(),
    signal: AbortSignal.timeout(6000),
  });

  if (!response.ok) {
    throw new Error(`Recicla Sampa HTTP ${response.status}`);
  }

  return parseReciclaSampaPoints(await response.json(), materialOption);
}

export async function getDropoffPoints({ material, latitude, longitude, address, limit = 14 } = {}) {
  const lat = toNumber(latitude);
  const lng = toNumber(longitude);
  const max = Math.min(Math.max(Number(limit) || 14, 1), 30);

  let points = [];
  let liveSourceUsed = false;
  let liveError = null;

  try {
    const livePoints = await fetchReciclaSampaPoints({ address, material });
    if (livePoints.length > 0) {
      points = livePoints;
      liveSourceUsed = true;
    }
  } catch (err) {
    liveError = err.message;
  }

  if (points.length === 0) {
    points = SAO_PAULO_DROPOFF_POINTS.filter((point) => materialMatches(point, material));
  }

  const sorted = sortByDistance(points.map((point) => withDistance(point, lat, lng))).slice(0, max);

  return {
    points: sorted,
    materialOptions: MATERIAL_OPTIONS,
    source: liveSourceUsed ? "recicla-sampa-live" : "ecoroute-official-cache",
    liveError,
  };
}

function inferCategory(material) {
  const materialId = getMaterialOption(material).id;
  if (["papel", "plastico", "metal", "vidro", "oleo", "pilhas", "lampadas", "eletronicos"].includes(materialId)) {
    return "recyclable";
  }
  if (["entulho", "moveis", "eletrodomesticos"].includes(materialId)) {
    return "non-recyclable";
  }
  return "both";
}

function inferLevel({ weightKg, volumeM3 }) {
  const weight = toNumber(weightKg) || 0;
  const volume = toNumber(volumeM3) || 0;
  if (weight >= 120 || volume >= 1.5) return "hard";
  if (weight >= 35 || volume >= 0.5) return "medium";
  return "easy";
}

function requireCoordinates(latitude, longitude) {
  const lat = toNumber(latitude);
  const lng = toNumber(longitude);

  if (lat === null || lng === null) {
    throw new BadRequestError("Latitude and longitude are required");
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new BadRequestError("Invalid latitude or longitude");
  }

  return { latitude: lat, longitude: lng };
}

export async function estimateDemoPickup(payload = {}) {
  const destination = requireCoordinates(payload.latitude, payload.longitude);
  const materialOption = getMaterialOption(payload.material);
  const level = payload.level || inferLevel(payload);
  const route = await getRoute(ECOROUTE_DEPOT, destination);
  const pricing = await calculatePrice({
    category: inferCategory(materialOption.id),
    level,
    distanceKm: route.distanceKm,
  });

  return {
    estimatedPrice: pricing.estimatedPrice,
    currency: pricing.currency,
    priceBreakdown: pricing.priceBreakdown,
    category: inferCategory(materialOption.id),
    level,
    material: materialOption,
    distanceKm: route.distanceKm,
    durationMinutes: route.durationMinutes,
    routeGeometry: route.geometry,
    fallback: route.fallback || false,
    depotLocation: ECOROUTE_DEPOT,
    pickupWindow: route.distanceKm > 18 ? "Ate 48h uteis" : "Ate 24h uteis",
  };
}

export async function createDemoPickupRequest(payload = {}) {
  const estimate = await estimateDemoPickup(payload);
  const request = {
    id: `ECO-${randomUUID().slice(0, 8).toUpperCase()}`,
    status: "AGENDAMENTO_SIMULADO",
    requesterName: String(payload.requesterName || "Cliente demo").trim(),
    contact: String(payload.contact || "").trim(),
    address: String(payload.address || "").trim(),
    notes: String(payload.notes || "").trim(),
    createdAt: new Date().toISOString(),
    estimate,
  };

  demoRequests.unshift(request);
  if (demoRequests.length > 50) demoRequests.pop();

  return request;
}

export function getDemoMetrics() {
  return {
    dropoffPoints: SAO_PAULO_DROPOFF_POINTS.length,
    materialOptions: MATERIAL_OPTIONS.length,
    simulatedRequests: demoRequests.length,
    city: "São Paulo",
  };
}

export function getRecentDemoRequests() {
  return demoRequests.slice(0, 10);
}
