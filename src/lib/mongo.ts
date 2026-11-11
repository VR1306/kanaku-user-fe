import { MongoClient, type Db } from "mongodb";

/**
 * Single shared MongoDB connection (server-side only). The client is cached on globalThis so dev
 * hot reloads reuse it. Indexes are created once per process.
 * Collections: users, auth_codes, mfa_attempts, profiles, transactions, budgets, notifications, recurring, categories, sessions.
 */
const g = globalThis as unknown as {
  __kanakuMongo?: Promise<MongoClient>;
  __kanakuIndexes?: Promise<void>;
};

function connect(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Add it to .env.local (see .env.example).");
  const pending = new MongoClient(uri, {
    // Fail fast (and say so) when the database can't be reached, instead of hanging the page.
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    maxPoolSize: 10,
  }).connect();
  // Don't cache a failed connection attempt.
  pending.catch(() => {
    g.__kanakuMongo = undefined;
  });
  return pending;
}

async function ensureIndexes(db: Db) {
  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    // Codes delete themselves once expired.
    db.collection("auth_codes").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("mfa_attempts").createIndex({ lockedUntil: 1 }, { expireAfterSeconds: 3600 }),
    db.collection("transactions").createIndex({ userId: 1, date: -1 }),
    db.collection("budgets").createIndex({ userId: 1, category: 1 }, { unique: true }),
    db.collection("notifications").createIndex({ userId: 1, key: 1 }, { unique: true }),
    db.collection("notifications").createIndex({ userId: 1, createdAt: -1 }),
    db.collection("recurring").createIndex({ userId: 1, nextDue: 1 }),
    db.collection("categories").createIndex({ userId: 1, nameKey: 1 }, { unique: true }),
    db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("tickets").createIndex({ userId: 1, updatedAt: -1 }),
    db.collection("tickets").createIndex({ number: 1 }, { unique: true }),
    db.collection("billing_orders").createIndex({ userId: 1, createdAt: -1 }),
    db.collection("billing_payments").createIndex({ userId: 1, paidAt: -1 }),
    db.collection("sessions").createIndex({ userId: 1, lastSeenAt: -1 }),
  ]);
}

/** The database couldn't be reached (wrong address, blocked by Atlas, no network). */
export class DatabaseUnavailableError extends Error {
  constructor(cause: unknown) {
    super(cause instanceof Error ? cause.message : "Database unavailable");
    this.name = "DatabaseUnavailableError";
  }
}

export async function getDb(): Promise<Db> {
  let client: MongoClient;
  try {
    g.__kanakuMongo ??= connect();
    client = await g.__kanakuMongo;
  } catch (error) {
    if (error instanceof Error && error.message.includes("MONGODB_URI is not set")) throw error;
    throw new DatabaseUnavailableError(error);
  }
  const db = client.db(process.env.MONGODB_DB || "kanaku");
  g.__kanakuIndexes ??= ensureIndexes(db).catch((error) => {
    g.__kanakuIndexes = undefined;
    throw error;
  });
  await g.__kanakuIndexes;
  return db;
}

/** True for a duplicate-key error (unique index violation). */
export const isDuplicateKey = (error: unknown) =>
  typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
