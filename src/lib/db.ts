import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn('[db] MONGODB_URI is not set. DB connect checks will fail.');
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const cache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cache;

export async function dbConnect(): Promise<typeof mongoose> {
  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is missing');
    }

    const dbName = process.env.MONGODB_DB_NAME;
    cache.promise = mongoose.connect(
      MONGODB_URI,
      dbName
        ? {
            dbName,
            serverSelectionTimeoutMS: 8000
          }
        : {
            serverSelectionTimeoutMS: 8000
          }
    );
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
