import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "db", "migrations");
const BASELINE = "0001_baseline.sql";
const LOCK_ID = 727274;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL não definida");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

try {
  await client.query("SELECT pg_advisory_lock($1)", [LOCK_ID]);
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      nome text PRIMARY KEY,
      aplicada_em timestamptz NOT NULL DEFAULT now()
    )`);

  const aplicadas = new Set(
    (await client.query("SELECT nome FROM schema_migrations")).rows.map((r) => r.nome),
  );

  // Bancos criados antes das migrations já têm o schema do baseline.
  if (aplicadas.size === 0) {
    const { rows } = await client.query(`SELECT to_regclass('public."Usuarios"') AS t`);
    if (rows[0].t) {
      await client.query("INSERT INTO schema_migrations (nome) VALUES ($1)", [BASELINE]);
      aplicadas.add(BASELINE);
      console.log(`${BASELINE}: schema já existente, marcada como aplicada`);
    }
  }

  const arquivos = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  let rodadas = 0;
  for (const arquivo of arquivos) {
    if (aplicadas.has(arquivo)) continue;
    const sql = await readFile(join(dir, arquivo), "utf8");
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (nome) VALUES ($1)", [arquivo]);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw new Error(`${arquivo}: ${err.message}`);
    }
    console.log(`${arquivo}: aplicada`);
    rodadas++;
  }
  console.log(rodadas ? `${rodadas} migration(s) aplicada(s)` : "Banco em dia, nada a aplicar");
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
