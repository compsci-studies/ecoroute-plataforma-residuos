import express from "express";
import {
  predictArea,
  generateSchedule,
  getMLSchedules,
  getMLScheduleById,
  confirmSchedule,
  getMLHealth,
  getMLAnalytics,
  getDriverMLAssignments,
  getPublicMLSchedule,
  redispatchArea,
  completeAreaAssignment,
  getScheduleCompletions,
} from "./controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";

const router = express.Router();

// Operational summary. Customers must not receive fleet, area, or volume-planning data.
router.get("/public", authMiddleware, roleMiddleware("admin", "super_admin"), getPublicMLSchedule);

// All remaining routes require authentication
router.use(authMiddleware);

// Driver endpoints (must be before /:id to avoid route conflict)
router.get("/driver-assignments", roleMiddleware("driver"), getDriverMLAssignments);
router.post("/:id/complete-area", roleMiddleware("driver"), completeAreaAssignment);

// Completion history — drivers see their own, admins see all
router.get("/completions", roleMiddleware("driver", "admin", "super_admin"), getScheduleCompletions);

// ML service health check
router.get("/health", roleMiddleware("admin", "super_admin"), getMLHealth);

// ML analytics for Reports page — super_admin only
router.get("/analytics", roleMiddleware("super_admin"), getMLAnalytics);

// Admin/Super-admin endpoints
router.post("/predict", roleMiddleware("admin", "super_admin"), predictArea);
router.post("/generate", roleMiddleware("super_admin"), generateSchedule);
router.get("/", roleMiddleware("admin", "super_admin"), getMLSchedules);
router.get("/:id", roleMiddleware("admin", "super_admin"), getMLScheduleById);
router.post("/:id/confirm", roleMiddleware("super_admin"), confirmSchedule);
router.post("/:id/redispatch", roleMiddleware("admin", "super_admin"), redispatchArea);

export default router;
