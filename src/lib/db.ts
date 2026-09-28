import mongoose from "mongoose";

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

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("[db] MONGODB_URI no está definido en process.env");
    throw new Error("MONGODB_URI is not defined");
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 8000 })
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    console.error("[db] Error conectando a MongoDB:", err);
    throw err;
  }
}

