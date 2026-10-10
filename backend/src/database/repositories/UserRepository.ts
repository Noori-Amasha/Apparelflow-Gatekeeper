import { User } from "../models/User";
import { UserRole } from "../enums/UserRole";
import { query } from "../query";

export class UserRepository {
  static async findById(id: string): Promise<User | null> {
    const rows = await query<User>(
      `SELECT *
       FROM users
       WHERE id = $1`,
      [id],
    );

    return rows[0] ?? null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const rows = await query<User>(
      `SELECT *
       FROM users
       WHERE LOWER(email) = LOWER($1)`,
      [email],
    );

    return rows[0] ?? null;
  }

  static async findAll() {
    return query<
      Pick<User, "id" | "email" | "role" | "full_name" | "created_at">
    >(
      `SELECT id, email, role, full_name, created_at
       FROM users
       ORDER BY full_name`,
    );
  }

  static async create(data: {
    email: string;
    password_hash: string;
    full_name: string;
    role: UserRole;
  }): Promise<User> {
    const rows = await query<User>(
      `INSERT INTO users (
        email,
        password_hash,
        full_name,
        role
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [data.email, data.password_hash, data.full_name, data.role],
    );

    return rows[0];
  }
}
