import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Obter detalhes de uma empresa específica
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const rows = await query(
      `SELECT id, nome, cnpj, "criado_em", "atualizado_em"
       FROM "Empresa"
       WHERE id = $1
       AND data_exclusao IS NULL`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Erro ao buscar empresa:", error);
    return NextResponse.json(
      { error: "Erro ao buscar empresa" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar empresa
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const empresaId = Number(id);

    const { nome, cnpj } = await req.json();

    const rows = await query(
      `UPDATE "Empresa"
       SET nome=$1, cnpj=$2, "atualizado_em"=NOW()
       WHERE id=$3
       RETURNING id, nome, cnpj, "criado_em", "atualizado_em"`,
      [nome, cnpj, empresaId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Erro ao atualizar empresa:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar empresa" },
      { status: 500 }
    );
  }
}

// DELETE - Remover empresa (soft delete)
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const empresaId = String(id);

    if (!empresaId) {
      return NextResponse.json(
        { error: "ID da empresa ausente na rota." },
        { status: 400 }
      );
    }

    const rows = await query(
      `UPDATE "Empresa" 
       SET data_exclusao = NOW() 
       WHERE id = $1 
       AND data_exclusao IS NULL 
       RETURNING id`,
      [empresaId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Empresa não encontrada ou já excluída" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Empresa marcada como excluída com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao marcar empresa como excluída:", error);
    return NextResponse.json(
      { error: "Erro interno ao marcar empresa como excluída" },
      { status: 500 }
    );
  }
}
