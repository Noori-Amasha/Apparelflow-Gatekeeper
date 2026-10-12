import { Router } from "express";

import authRoutes from "../modules/auth/routes";
import recipeRoutes from "../modules/recipes/routes";
import cuttingOrderRoutes from "../modules/cutting-orders/routes";
import verificationRoutes from "../modules/verification/routes";
import sewingRoutes from "../modules/sewing/routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/recipes", recipeRoutes);
router.use("/cutting-orders", cuttingOrderRoutes);
router.use("/verification", verificationRoutes);
router.use("/sewing", sewingRoutes);

export default router;
