import { RecipeRepository } from "../../database/repositories/RecipeRepository";
import { RecipeComponentRepository } from "../../database/repositories/RecipeComponentRepository";
import { ApiError } from "../../utils/ApiError";

export async function getRecipes() {
  return RecipeRepository.findAll();
}

export async function getRecipeById(recipeId: string) {
  const recipe = await RecipeRepository.findById(recipeId);

  if (!recipe) {
    throw new ApiError(404, "Recipe not found");
  }

  const components = await RecipeComponentRepository.findByRecipe(recipeId);

  return {
    ...recipe,
    components,
  };
}
