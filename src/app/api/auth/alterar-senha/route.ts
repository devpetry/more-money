import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

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
    await client.query("BEGIN");

    // Cria o hash do token recebido para comparar com o armazenado no banco
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Verifica se o token existe e ainda não expirou
    const res = await client.query(
      `SELECT "id", "senha_hash" FROM "Usuarios" 
       WHERE "token_recuperacao" = $1 
       AND "expiracao_token_recuperacao" > NOW()`,
      [hashedToken]
    );

    const usuario = res.rows[0];

    // Se não encontrou ou o token expirou, interrompe a operação
    if (!usuario) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { success: false, message: "Token inválido ou expirado." },
        { status: 400 }
      );
    }

    // Gera o hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Impede o uso da mesma senha anterior
    const same = await bcrypt.compare(password, usuario.senha_hash);

    if (same) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        {
          success: false,
          message: "A nova senha deve ser diferente da anterior.",
        },
        { status: 400 }
      );
    }

    // Atualiza a senha e remove o token de recuperação
    await client.query(
      `UPDATE "Usuarios"
       SET "senha_hash" = $1,
           "token_recuperacao" = NULL,
           "expiracao_token_recuperacao" = NULL
       WHERE id = $2`,
      [hashedPassword, usuario.id]
    );

    await client.query("COMMIT");

    return NextResponse.json(
      { success: true, message: "Senha redefinida com sucesso!" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Erro ao redefinir senha:", err);
    await client.query("ROLLBACK");
    return NextResponse.json(
      { success: false, message: "Erro interno. Tente novamente." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
