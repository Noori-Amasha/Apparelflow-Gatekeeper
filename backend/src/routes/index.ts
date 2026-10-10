import { Router } from "express";

import authRoutes from "../modules/auth/routes";
import recipeRoutes from "../modules/recipes/routes";
import cuttingOrderRoutes from "../modules/cutting-orders/routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/recipes", recipeRoutes);
router.use("/cutting-orders", cuttingOrderRoutes);

export default router;
