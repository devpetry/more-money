import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const TIPO_USUARIO_MAP = {
  "1": "ADMIN",
  "3": "COLABORADOR",
} as const;

function resolveTipoUsuarioGravavel(tipo_usuario: unknown): string | null {
  if (
    tipo_usuario === undefined ||
    tipo_usuario === null ||
    tipo_usuario === ""
  ) {
    return null;
  }
  const key = String(tipo_usuario);
  if (key === "2") {
    return null;
  }
  return TIPO_USUARIO_MAP[key as keyof typeof TIPO_USUARIO_MAP] ?? null;
}

// GET - Obter detalhes de um usuário específico
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const rows = await query(
      `SELECT id, nome, email, "tipo_usuario", "criado_em", "atualizado_em"
       FROM "Usuarios"
       WHERE id = $1
       AND data_exclusao IS NULL`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao buscar usuário" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar usuário
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { nome, email, tipo_usuario } = await req.json();

    const enum_tipo_usuario = resolveTipoUsuarioGravavel(tipo_usuario);

    if (!enum_tipo_usuario) {
      return NextResponse.json(
        { error: "Tipo de usuário inválido." },
        { status: 400 }
      );
    }

    const rows = await query(
      `UPDATE "Usuarios" 
       SET nome = $1, email = $2, "tipo_usuario" = $3, "atualizado_em" = NOW()
       WHERE id = $4
       RETURNING id, nome, email, "tipo_usuario", "criado_em", "atualizado_em"`,
      [nome, email, enum_tipo_usuario, id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar usuário" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const userId = String(id);

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário ausente na rota." },
        { status: 400 }
      );
    }

    const rows = await query(
      `UPDATE "Usuarios"
       SET data_exclusao = NOW()
       WHERE id = $1
       AND data_exclusao IS NULL
       RETURNING id`,
      [userId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Usuário não encontrado ou já excluído" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Usuário marcado como excluído com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao marcar usuário como excluído:", error);
    return NextResponse.json(
      { error: "Erro interno ao marcar usuário como excluído" },
      { status: 500 }
    );
  }
}
