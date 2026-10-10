import { RequestHandler } from "express";
import { z } from "zod";
import * as service from "./service";

export const getRecipes: RequestHandler = async (_req, res, next) => {
  try {
    const recipes = await service.getRecipes();

    res.json(recipes);
  } catch (error) {
    next(error);
  }
};

export const getRecipeById: RequestHandler = async (req, res, next) => {
  try {
    const recipeId = z.string().uuid().parse(req.params.id);

    const recipe = await service.getRecipeById(recipeId);

    res.json(recipe);
  } catch (error) {
    next(error);
  }
};
