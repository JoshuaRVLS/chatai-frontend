import { PrismaClient } from "../generated/prisma";

declare global {
  var db: PrismaClient | undefined;
}

const prismaClientOptions: any = {
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
};

if (process.env.DATABASE_URL) {
  prismaClientOptions.datasourceUrl = process.env.DATABASE_URL;
}

export const db = global.db || new PrismaClient(prismaClientOptions);

if (process.env.NODE_ENV !== "production") global.db = db;
