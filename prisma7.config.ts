import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
import { defineConfig } from "prisma/config";

// O Prisma CLI (db pull, migrate) necessita de Session Mode (porta 5432)
const cliUrl = process.env["DIRECT_URL"] || process.env["DATABASE_URL"];

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: cliUrl,
  },
});
