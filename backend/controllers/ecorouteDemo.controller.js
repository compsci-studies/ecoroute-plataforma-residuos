import {
  createDemoPickupRequest,
  estimateDemoPickup,
  getDemoMetrics,
  getDropoffPoints,
  getRecentDemoRequests,
} from "../services/ecorouteDemo.service.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";

export async function listDemoDropoffPoints(req, res) {
  try {
    const result = await getDropoffPoints(req.query);
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err, "Failed to load drop-off points");
  }
}

export async function estimateDemoCollection(req, res) {
  try {
    const estimate = await estimateDemoPickup(req.body);
    return sendSuccess(res, estimate);
  } catch (err) {
    return sendError(res, err, "Failed to estimate demo collection");
  }
}

export async function createDemoCollection(req, res) {
  try {
    const request = await createDemoPickupRequest(req.body);
    return sendSuccess(res, { request }, 201);
  } catch (err) {
    return sendError(res, err, "Failed to create demo collection");
  }
}

export function demoMetrics(req, res) {
  return sendSuccess(res, {
    metrics: getDemoMetrics(),
    recentRequests: getRecentDemoRequests(),
  });
}
