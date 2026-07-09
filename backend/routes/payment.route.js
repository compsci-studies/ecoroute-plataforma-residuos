import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import {
  initiatePayment,
  pixSuccess,
  pixFailure,
  markCashCollected,
  getPaymentByPickup,
  getAllPayments,
} from "../controllers/payment.controller.js";

const router = express.Router();

// Customer initiates a payment (cash or PagSeguro Pix) for one of their pickups
router.post(
  "/initiate",
  authMiddleware,
  roleMiddleware("customer_admin"),
  initiatePayment
);

// PagSeguro Pix redirect callbacks — UNAUTHENTICATED on purpose.
// Security is enforced by HMAC signature verification + server-to-server
// status confirmation inside the controller.
router.get("/pix/success", pixSuccess);
router.get("/pix/failure", pixFailure);
router.post("/pix/success", pixSuccess);
router.post("/pix/failure", pixFailure);

// Driver settles a cash payment during collection, before completing a pickup
router.post(
  "/:pickupId/cash-collected",
  authMiddleware,
  roleMiddleware("driver"),
  markCashCollected
);

// Read endpoints
router.get("/pickup/:pickupId", authMiddleware, getPaymentByPickup);
router.get(
  "/all",
  authMiddleware,
  roleMiddleware("admin", "super_admin"),
  getAllPayments
);

export default router;
