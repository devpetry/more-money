import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { CadastroSchema } from "@/schemas/auth";

const MSG_EMAIL_DUPLICADO = "Já existe uma conta com este e-mail.";

// POST - Cadastro público. O perfil é sempre PADRAO (literal no SQL);
// qualquer outro campo enviado pelo cliente é descartado pelo schema.
export async function POST(req: Request) {
  // Exigir JSON impede que um site de terceiros dispare o cadastro com uma
  // requisição "simples" (text/plain), que dispensa preflight de CORS.
  const mediaType = req.headers
    .get("content-type")
    ?.split(";")[0]
    .trim()
    .toLowerCase();
  if (mediaType !== "application/json") {
    return NextResponse.json(
      { error: "Content-Type deve ser application/json." },
      { status: 415 }
    );
  }

  const body = await req.json().catch(() => null);

  const validation = CadastroSchema.safeParse(body);
  if (!validation.success) {
    const issue = validation.error.issues[0];
    return NextResponse.json(
      {
        error:
          !issue || issue.code === "invalid_type"
            ? "Dados inválidos."
            : issue.message,
      },
      { status: 400 }
    );
  }

  const { nome, email, senha } = validation.data;

  try {
    const existingUser = await query(
      `SELECT id FROM usuarios 
      WHERE email = $1 AND data_exclusao IS NULL 
      LIMIT 1`,
      [email]
    );

    if (existingUser.length > 0) {
      return NextResponse.json({ error: MSG_EMAIL_DUPLICADO }, { status: 409 });
    }

    const senha_hash = await bcrypt.hash(senha, 10);

    const result = await query(
      `INSERT INTO usuarios 
      (nome, email, "tipo_usuario", "senha_hash", "criado_em", "atualizado_em") 
      VALUES ($1, $2, 'PADRAO', $3, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
      RETURNING id, nome, email`,
      [nome, email, senha_hash]
    );

    // Sem linha retornada: o e-mail já existe (cadastro concorrente ou conta
    // excluída, que mantém o e-mail reservado pela constraint UNIQUE).
    if (result.length === 0) {
      return NextResponse.json({ error: MSG_EMAIL_DUPLICADO }, { status: 409 });
    }

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao criar conta" },
      { status: 500 }
    );
  }
}
