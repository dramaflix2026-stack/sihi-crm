import { Pool } from 'pg';
const globalForDb = globalThis as unknown as { sihiPool?: Pool };
export function db(): Pool {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL não configurada');
  if (!globalForDb.sihiPool) globalForDb.sihiPool = new Pool({connectionString:process.env.DATABASE_URL, max:5, connectionTimeoutMillis:8000, ssl: false});
  return globalForDb.sihiPool;
}
