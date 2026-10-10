import { createUser } from "../src/modules/auth/service";
import { createUserSchema } from "../src/modules/auth/validation";
import { pool } from "../src/database/pool";

async function main() {
  const [email, role, ...nameParts] = process.argv.slice(2);

  const password = process.env.NEW_USER_PASSWORD;

  const data = createUserSchema.parse({
    email,
    role,
    full_name: nameParts.join(" "),
    password,
  });

  const user = await createUser(data);

  console.log("User created successfully");
  console.log("Email:", user.email);
  console.log("Role:", user.role);
}

main()
  .catch((error) => {
    console.error("User creation failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
