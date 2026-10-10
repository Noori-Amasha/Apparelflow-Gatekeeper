import { RecipeComponent } from "../models/RecipeComponent";
import { DatabaseClient, query } from "../query";

export class RecipeComponentRepository {
  static async findByRecipe(
    recipeId: string,
    client?: DatabaseClient,
  ): Promise<RecipeComponent[]> {
    return query<RecipeComponent>(
      `SELECT *
       FROM recipe_components
       WHERE recipe_id = $1
       ORDER BY component_name`,
      [recipeId],
      client,
    );
  }

  static async findById(id: string): Promise<RecipeComponent | null> {
    const rows = await query<RecipeComponent>(
      `SELECT *
       FROM recipe_components
       WHERE id = $1`,
      [id],
    );

    return rows[0] ?? null;
  }
}
