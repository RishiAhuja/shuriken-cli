import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import pg from "pg";
import { PrismaClient } from "../generated/prisma";

dotenv.config({ path: "../../.env" });

const scryptAsync = promisify(scrypt);
const SALT_LENGTH = 32;
const KEY_LENGTH = 64;

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting database seeding...");

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME;

  if (adminEmail && adminPassword && adminName) {
    const existing = await prisma.user.findUnique({
      where: { email: adminEmail.toLowerCase() },
    });

    if (existing) {
      console.log(`Admin user already exists: ${existing.email}`);
    } else {
      const passwordHash = await hashPassword(adminPassword);
      const user = await prisma.user.create({
        data: {
          email: adminEmail.toLowerCase(),
          name: adminName,
          passwordHash,
          status: "ACTIVE",
          emailVerified: true,
        },
      });
      console.log(`Created admin user: ${user.email}`);
    }
  } else {
    console.log(
      "Skipping admin seed — set ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME in .env",
    );
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
