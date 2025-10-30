import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

const TIPO_USUARIO_MAP = {
  "1": "ADMIN",
  "2": "GERENTE",
  "3": "COLABORADOR",
};

// GET - Listar todos os usuários
export async function GET() {
  try {
    const result = await query(
      `SELECT id, nome, email, "tipo_usuario", "empresa_id", "criado_em" 
      FROM "Usuarios" 
      WHERE data_exclusao IS NULL 
      ORDER BY id ASC`,
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
    const body = await req.json();
    const { nome, email, tipo_usuario, senha, empresa_id: empresaRaw } = body.data;
    const empresa_id = !empresaRaw || empresaRaw === "" ? null : empresaRaw;

    if (!nome || !email || !tipo_usuario || !senha) {
      return NextResponse.json(
        {
          error:
            "Campos 'nome', 'email', 'tipo_usuario' e 'senha' são obrigatórios.",
        },
        { status: 400 }
      );
    }

    const existingUser = await query(
      `SELECT id FROM "Usuarios" 
      WHERE email = $1 AND data_exclusao IS NULL 
      LIMIT 1`,
      [email]
    );

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Já existe um usuário ativo com este e-mail." },
        { status: 409 }
      );
    }

    const senha_hash = await bcrypt.hash(String(senha), 10);

    const enum_tipo_usuario =
      TIPO_USUARIO_MAP[tipo_usuario as keyof typeof TIPO_USUARIO_MAP];

    const result = await query(
      `INSERT INTO "Usuarios" 
      (nome, email, "empresa_id", "tipo_usuario", "senha_hash", "criado_em", "atualizado_em") 
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, nome, email, "tipo_usuario", "empresa_id", "criado_em"`,
      [nome, email, empresa_id, enum_tipo_usuario, senha_hash]
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
