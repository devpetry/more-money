import { NextResponse } from "next/server";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Pool de conexões
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

export async function POST(request: Request) {
  const body = await request.json();
  const { token, password } = body;

  if (!token || !password) {
    return NextResponse.json(
      { success: false, message: "Token e nova senha são obrigatórios." },
      { status: 400 }
    );
  }

  const client = await pool.connect();

  try {
    // Hash do token recebido para comparar com o que está no banco
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Verifica se o token existe e ainda não expirou
    const res = await client.query(
      `SELECT "id", "senha_hash" FROM "Usuario" 
       WHERE "token_recuperacao" = $1 
       AND "expiracao_token_recuperacao" > NOW()`,
      [hashedToken]
    );

    const usuario = res.rows[0];
    if (!usuario) {
      return NextResponse.json(
        { success: false, message: "Token inválido ou expirado." },
        { status: 400 }
      );
    }

    // Gera hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Verifica se a nova senha é diferente da anterior
    const isSamePassword = await bcrypt.compare(password, usuario.senha_hash);
    if (isSamePassword) {
      return NextResponse.json(
        {
          success: false,
          message: "A nova senha deve ser diferente da anterior.",
        },
        { status: 400 }
      );
    } else {
      // Atualiza senha e limpa token
      await client.query(
        `UPDATE "Usuario"
       SET "senha_hash" = $1,
           "token_recuperacao" = NULL,
           "expiracao_token_recuperacao" = NULL
       WHERE id = $2`,
        [hashedPassword, usuario.id]
      );
    }

    return NextResponse.json(
      { success: true, message: "Senha redefinida com sucesso!" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Erro ao redefinir senha:", err);
    return NextResponse.json(
      { success: false, message: "Erro interno. Tente novamente." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
