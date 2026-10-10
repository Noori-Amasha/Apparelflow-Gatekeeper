import { Recipe } from "../models/Recipe";
import { DatabaseClient, query } from "../query";

export class RecipeRepository {
  static async findAll(): Promise<Recipe[]> {
    return query<Recipe>(
      `SELECT *
       FROM recipes
       ORDER BY recipe_code`,
    );
  }

  static async findById(
    id: string,
    client?: DatabaseClient,
  ): Promise<Recipe | null> {
    const rows = await query<Recipe>(
      `SELECT *
       FROM recipes
       WHERE id = $1`,
      [id],
      client,
    );

    return rows[0] ?? null;
  }
}
