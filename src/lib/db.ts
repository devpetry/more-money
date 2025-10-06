import { Pool } from "pg";

// Pool de conexões
export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
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
