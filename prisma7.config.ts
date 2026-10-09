
import "dotenv/config";

import { defineConfig, env } from "prisma/config";

/**
 * Prisma CLI configuration.
 *
 * Configures the schema, migrations, seed command,
 * and PostgreSQL connection for Prisma 7.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },

  datasource: {
    url: env("DATABASE_URL"),
  },
});
