import express from "express";

import {
  createDemoCollection,
  demoMetrics,
  estimateDemoCollection,
  listDemoDropoffPoints,
} from "../controllers/ecorouteDemo.controller.js";

const router = express.Router();

router.get("/dropoff-points", listDemoDropoffPoints);
router.post("/pickup-estimate", estimateDemoCollection);
router.post("/pickup-requests", createDemoCollection);
router.get("/metrics", demoMetrics);

export default router;
