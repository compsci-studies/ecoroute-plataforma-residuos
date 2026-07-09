import assert from "node:assert/strict";
import test from "node:test";

import {
  createDemoPickupRequest,
  estimateDemoPickup,
  getDropoffPoints,
} from "../services/ecorouteDemo.service.js";

test("EcoRoute demo returns real São Paulo drop-off points by material", async () => {
  const result = await getDropoffPoints({
    material: "vidro",
    latitude: -23.55052,
    longitude: -46.63331,
    limit: 5,
  });

  assert.equal(result.points.length > 0, true);
  assert.equal(result.points.every((point) => Number.isFinite(point.latitude)), true);
  assert.equal(result.points.every((point) => Number.isFinite(point.longitude)), true);
  assert.equal(result.materialOptions.some((option) => option.id === "vidro"), true);
});

test("EcoRoute demo estimates collection price in BRL without MongoDB", async () => {
  const estimate = await estimateDemoPickup({
    latitude: -23.5996566,
    longitude: -46.6233112,
    material: "entulho",
    weightKg: 80,
    volumeM3: 0.8,
  });

  assert.equal(estimate.currency, "BRL");
  assert.equal(estimate.estimatedPrice > 0, true);
  assert.equal(estimate.distanceKm > 0, true);
  assert.equal(["easy", "medium", "hard"].includes(estimate.level), true);
});

test("EcoRoute demo creates a simulated collection protocol", async () => {
  const request = await createDemoPickupRequest({
    latitude: -23.5996566,
    longitude: -46.6233112,
    material: "reciclaveis",
    requesterName: "Cliente Teste",
    contact: "cliente@demo.com",
  });

  assert.match(request.id, /^ECO-[A-F0-9]{8}$/);
  assert.equal(request.status, "AGENDAMENTO_SIMULADO");
  assert.equal(request.estimate.currency, "BRL");
});
