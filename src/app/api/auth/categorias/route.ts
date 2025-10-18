import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Listar todas as categorias
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const usuarioId = parseInt(session.user.id, 10);
    if (isNaN(usuarioId)) {
      return NextResponse.json(
        { error: "ID do usuário inválido" },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT id, nome, tipo, empresa_id, usuario_id, "criado_em"
       FROM "Categorias"
       WHERE usuario_id = $1
       ORDER BY id ASC`,
      [usuarioId]
    );

    return NextResponse.json(result ?? []);
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar categorias" },
      { status: 500 }
    );
  }
}

// POST - Criar nova categoria
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const usuarioId = parseInt(session.user.id, 10);
    if (isNaN(usuarioId)) {
      return NextResponse.json(
        { error: "ID do usuário inválido" },
        { status: 400 }
      );
    }

    const { nome, tipo, empresa_id } = await req.json();

    if (!nome || !tipo) {
      return NextResponse.json(
        { error: "Campos 'nome' e 'tipo' são obrigatórios." },
        { status: 400 }
      );
    }

    if (!["receita", "despesa"].includes(tipo)) {
      return NextResponse.json(
        { error: "O campo 'tipo' deve ser 'receita' ou 'despesa'." },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO "Categorias" (nome, tipo, empresa_id, usuario_id, "criado_em", "atualizado_em")
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, nome, tipo, empresa_id, usuario_id, "criado_em"`,
      [nome, tipo, empresa_id || null, usuarioId]
    );

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    return NextResponse.json(
      { error: "Erro ao criar categoria" },
      { status: 500 }
    );
  }
}
