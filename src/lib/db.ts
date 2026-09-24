import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

interface Cached {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const g = globalThis as unknown as { mongooseCache?: Cached };

if (!g.mongooseCache) {
  g.mongooseCache = { conn: null, promise: null };
}

const cached = g.mongooseCache;

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    // maxPoolSize bajo: en serverless cada instancia abre su propio pool, así
    // se evita agotar las conexiones de Atlas bajo picos (día del evento).
    cached.promise = mongoose.connect(MONGODB_URI, { maxPoolSize: 10 });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
