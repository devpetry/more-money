import { spawnSync } from "node:child_process";

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

// Só o deploy de produção da Vercel altera o banco; previews e builds locais não.
if (process.env.VERCEL_ENV === "production") run("node", ["scripts/migrate.mjs"]);
run("next", ["build"]);
