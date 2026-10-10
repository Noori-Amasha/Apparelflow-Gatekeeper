import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import * as controller from "./controller";

const router = Router();

router.use(requireAuth);

router.get("/", controller.getRecipes);

router.get("/:id", controller.getRecipeById);

export default router;
