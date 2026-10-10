import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import * as controller from "./controller";

const router = Router();

router.post("/login", controller.login);

router.get("/me", requireAuth, controller.me);

export default router;
