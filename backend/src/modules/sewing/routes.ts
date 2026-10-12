import { Router } from "express";

import { UserRole } from "../../database/enums/UserRole";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";

import * as controller from "./controller";

const router = Router();

router.use(requireAuth);

router.use(requireRole(UserRole.SEWING_SUPERVISOR));

router.get("/queue", controller.getQueue);

router.get("/started", controller.getStarted);

router.get("/orders/:id", controller.getOrder);

router.post("/orders/:id/start", controller.start);

export default router;
