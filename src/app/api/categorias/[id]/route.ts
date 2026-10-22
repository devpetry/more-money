import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";

// GET - Obter detalhes de uma categoria específica
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await context.params;

    const rows = await query(
      `SELECT id, nome, tipo, usuario_id, "criado_em", "atualizado_em"
       FROM "Categorias"
       WHERE id = $1 AND usuario_id = $2`,
      [id, auth.usuarioId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Erro ao buscar categoria:", error);
    return NextResponse.json(
      { error: "Erro ao buscar categoria" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar uma categoria existente
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await context.params;
    const categoriaId = Number(id);
    if (isNaN(categoriaId)) {
      return NextResponse.json(
        { error: "ID da categoria inválido" },
        { status: 400 }
      );
    }

    const { nome, tipo } = await req.json();

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

    const rows = await query(
      `UPDATE "Categorias"
       SET 
         nome = $1,
         tipo = $2,
         "atualizado_em" = NOW()
       WHERE id = $3 AND usuario_id = $4
       RETURNING id, nome, tipo, usuario_id, "criado_em", "atualizado_em"`,
      [nome, tipo, categoriaId, auth.usuarioId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar categoria" },
      { status: 500 }
    );
  }
}

// DELETE - Remover categoria
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await context.params;
    const categoriaId = Number(id);

    if (!categoriaId) {
      return NextResponse.json(
        { error: "ID da categoria ausente na rota." },
        { status: 400 }
      );
    }

    const rows = await query(
      `DELETE FROM "Categorias"
       WHERE id = $1 AND usuario_id = $2
       RETURNING id`,
      [categoriaId, auth.usuarioId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Categoria removida com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao remover categoria:", error);
    return NextResponse.json(
      { error: "Erro interno ao remover categoria" },
      { status: 500 }
    );
  }
}
