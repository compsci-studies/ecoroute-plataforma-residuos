import mongoose from "mongoose";

/**
 * PricingConfig — singleton document holding configurable pickup pricing rates.
 *
 * Only one active config exists at a time. Super admins can update rates;
 * admins and drivers can view them read-only.
 */
const pricingConfigSchema = new mongoose.Schema(
  {
    categoryBase: {
      recyclable: { type: Number, default: 25 },
      nonRecyclable: { type: Number, default: 45 },
      mixed: { type: Number, default: 55 },
    },

    levelMultiplier: {
      easy: { type: Number, default: 1.0 },
      medium: { type: Number, default: 1.6 },
      hard: { type: Number, default: 2.4 },
    },

    distanceRatePerKm: { type: Number, default: 2.8 },
    minimumCharge: { type: Number, default: 30 },
    currency: { type: String, default: "BRL" },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

const PricingConfig = mongoose.model("PricingConfig", pricingConfigSchema);
export default PricingConfig;
