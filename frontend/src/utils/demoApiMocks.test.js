import assert from "node:assert/strict";
import test from "node:test";

import { DEMO_AUTH_TOKENS } from "./demoAuth.js";
import { getDemoApiMockResponse } from "./demoApiMocks.js";

const request = (method, url, data) => ({
  method,
  url,
  data: data ? JSON.stringify(data) : undefined,
  headers: { Authorization: `Bearer ${DEMO_AUTH_TOKENS.customer}` },
});

test("customer demo session calculates a pickup estimate without calling the backend", () => {
  const response = getDemoApiMockResponse(
    request("post", "/pickups/estimate", {
      latitude: -23.55052,
      longitude: -46.63331,
      category: "recyclable",
      level: "medium",
    }),
    DEMO_AUTH_TOKENS.customer,
  );

  assert.equal(response.status, 200);
  assert.equal(response.data.success, true);
  assert.equal(response.data.currency, "BRL");
  assert.ok(response.data.estimatedPrice > 0);
  assert.ok(response.data.distanceKm > 0);
  assert.equal(response.data.priceBreakdown.levelMultiplier, 1.8);
});

test("customer demo session creates the pickup after accepting the estimate", () => {
  const response = getDemoApiMockResponse(
    request("post", "/pickups", {
      latitude: -23.55052,
      longitude: -46.63331,
      address: "Praça da Sé, São Paulo - SP",
      category: "recyclable",
      level: "medium",
    }),
    DEMO_AUTH_TOKENS.customer,
  );

  assert.equal(response.status, 201);
  assert.equal(response.data.pickup.status, "PAYMENT_REQUIRED");
  assert.equal(response.data.pickup.paymentStatus, "UNPAID");
  assert.equal(response.data.pickup.location.address, "Praça da Sé, São Paulo - SP");

  const resumed = getDemoApiMockResponse(
    request("get", `/pickups/${response.data.pickup.id}`),
    DEMO_AUTH_TOKENS.customer,
  );

  assert.equal(resumed.data.pickup.status, "PAYMENT_REQUIRED");
  assert.equal(resumed.data.pickup.routeDistanceKm, response.data.pickup.routeDistanceKm);
  assert.equal(resumed.data.pickup.location.address, "Praça da Sé, São Paulo - SP");
});
