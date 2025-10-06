import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

// GET - Listar todos os usuários
export async function GET() {
  try {
    const result = await query(
      'SELECT id, nome, email, "tipo_usuario", "empresa_id", "criado_em" FROM "Usuario" ORDER BY id ASC',
      []
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
      { status: 500 }
    );
  }
}

// POST - Criar novo usuário
export async function POST(req: Request) {
  try {
    const { nome, email, senha } = await req.json();

    const senha_hash = await bcrypt.hash(senha, 10);

    if (!nome || !email || !senha) {
      return NextResponse.json(
        { error: "Campos 'nome', 'email' e 'senha' são obrigatórios." },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO "Usuario" (nome, email, "senha_hash", "criado_em", "atualizado_em")
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, nome, email, "tipo_usuario", "empresa_id", "criado_em"`,
      [nome, email, senha_hash]
    );

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 }
    );
  }
}
