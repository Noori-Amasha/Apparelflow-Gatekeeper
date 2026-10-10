import { Router } from "express";

import { UserRole } from "../../database/enums/UserRole";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";

import * as controller from "./controller";

const router = Router();

router.use(requireAuth);

router.use(requireRole(UserRole.CUTTING_SUPERVISOR));

router.get("/", controller.getOrders);

router.get("/:id", controller.getOrderById);

router.post("/", controller.createOrder);

router.patch("/:id/fabric", controller.updateFabricUsage);

router.post("/:id/submit", controller.submitOrder);

export default router;
