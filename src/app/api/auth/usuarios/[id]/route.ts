import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Obter detalhes de um usuário específico
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ✅ agora params é aguardado

    const rows = await query(
      `SELECT id, nome, email, "tipo_usuario", "empresa_id", "criado_em", "atualizado_em"
       FROM "Usuario"
       WHERE id = $1`,
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
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ✅ também await aqui
    const { nome, email } = await req.json();

    const rows = await query(
      `UPDATE "Usuario" 
       SET nome=$1, email=$2, "atualizado_em"=NOW() 
       WHERE id=$3 
       RETURNING id, nome, email, "tipo_usuario", "empresa_id", "criado_em", "atualizado_em"`,
      [nome, email, id]
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

// DELETE - Remover usuário
export async function DELETE(
  req: Request,
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

    const rows = await query(`DELETE FROM "Usuario" WHERE id=$1 RETURNING id`, [
      userId,
    ]);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Usuário removido com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao remover usuário:", error);
    return NextResponse.json(
      { error: "Erro interno ao remover usuário" },
      { status: 500 }
    );
  }
}
