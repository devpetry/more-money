import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
  max: 5,
});

export async function query(
  text: string,
  params: (string | number | null | undefined)[]
) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res.rows;
  } catch (error) {
    console.error("Erro na query:", error);
    throw error;
  } finally {
    client.release();
  }
}
