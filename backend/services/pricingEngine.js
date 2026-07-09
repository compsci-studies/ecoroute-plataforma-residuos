import PricingConfig from "../models/PricingConfig.model.js";

// ── In-memory config cache (refreshed every 60 s) ────────────────────────────
let cachedConfig = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000;

export const DEFAULT_PRICING_CONFIG = {
  categoryBase: {
    recyclable: 25,
    nonRecyclable: 45,
    mixed: 55,
  },
  levelMultiplier: {
    easy: 1.0,
    medium: 1.6,
    hard: 2.4,
  },
  distanceRatePerKm: 2.8,
  minimumCharge: 30,
  currency: "BRL",
};

const CATEGORY_KEY_MAP = {
  recyclable: "recyclable",
  "non-recyclable": "nonRecyclable",
  both: "mixed",
};

/**
 * Load the singleton PricingConfig (auto-create with defaults if missing).
 */
async function loadConfig() {
  if (cachedConfig && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedConfig;
  }

  if (PricingConfig.db.readyState !== 1) {
    return DEFAULT_PRICING_CONFIG;
  }

  let config;
  try {
    config = await PricingConfig.findOne().lean();
    if (!config) {
      config = await PricingConfig.create({});
      config = await PricingConfig.findById(config._id).lean();
    }
  } catch (err) {
    console.warn("[pricing] Falling back to EcoRoute defaults:", err.message);
    config = DEFAULT_PRICING_CONFIG;
  }

  cachedConfig = config;
  cacheTimestamp = Date.now();
  return config;
}

/**
 * Calculate the estimated pickup price.
 *
 * @param {{ category: string, level: string, distanceKm: number }} params
 * @returns {Promise<{ estimatedPrice: number, priceBreakdown: Object, currency: string }>}
 */
export async function calculatePrice({ category, level, distanceKm }) {
  const config = await loadConfig();

  const catKey = CATEGORY_KEY_MAP[category] || "nonRecyclable";
  const categoryBase = config.categoryBase?.[catKey] ?? 800;
  const lvlMultiplier = config.levelMultiplier?.[level] ?? 1;
  const distanceRate = config.distanceRatePerKm ?? 50;
  const minCharge = config.minimumCharge ?? 500;

  const distanceCharge = Math.round(distanceKm * distanceRate);
  const rawTotal = Math.round(categoryBase * lvlMultiplier + distanceCharge);
  const total = Math.max(minCharge, rawTotal);

  return {
    estimatedPrice: Math.round(total * 100) / 100,
    priceBreakdown: {
      categoryBase,
      levelMultiplier: lvlMultiplier,
      distanceCharge,
      total,
    },
    currency: config.currency || "BRL",
  };
}
