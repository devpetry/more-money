import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Obter detalhes de uma categoria específica
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const rows = await query(
      `SELECT id, nome, tipo, empresa_id, usuario_id, "criado_em", "atualizado_em"
       FROM "Categorias"
       WHERE id = $1`,
      [id]
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

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params;
    const categoriaId = Number(id);
    if (isNaN(categoriaId)) {
      return NextResponse.json(
        { error: "ID da categoria inválido" },
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

    const rows = await query(
      `UPDATE "Categorias"
       SET 
         nome = $1,
         tipo = $2,
         empresa_id = $3,
         usuario_id = $4,
         "atualizado_em" = NOW()
       WHERE id = $5
       RETURNING id, nome, tipo, empresa_id, usuario_id, "criado_em", "atualizado_em"`,
      [nome, tipo, empresa_id || null, usuarioId, categoriaId]
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

// DELETE - Remover categoria (remoção definitiva)
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
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
       WHERE id = $1
       RETURNING id`,
      [categoriaId]
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
