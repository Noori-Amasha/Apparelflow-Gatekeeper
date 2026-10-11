import { Router } from "express";

import { UserRole } from "../../database/enums/UserRole";

import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";

import * as controller from "./controller";

const router = Router();

router.use(requireAuth);
router.use(requireRole(UserRole.CUTTING_VERIFIER));

router.get("/queue", controller.getQueue);

router.get("/orders/:id", controller.getOrder);

router.patch("/orders/:id/items/:itemId", controller.updateCount);

router.post("/orders/:id/approve", controller.approve);

router.post("/orders/:id/reject", controller.reject);

export default router;
