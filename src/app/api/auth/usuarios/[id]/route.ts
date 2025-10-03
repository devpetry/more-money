import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// PUT - Atualizar usuário
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { nome, email } = await req.json();

    const rows = await query(
      `UPDATE "Usuario" 
       SET nome=$1, email=$2, "atualizadoEm"=NOW() 
       WHERE id=$3 
       RETURNING id, nome, email, "tipo_usuario", "empresa_id", "criadoEm", "atualizadoEm"`,
      [nome, email, params.id]
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
  { params }: { params: { id: string } }
) {
  try {
    const rows = await query(`DELETE FROM "Usuario" WHERE id=$1 RETURNING id`, [
      params.id,
    ]);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Usuário removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover usuário:", error);
    return NextResponse.json(
      { error: "Erro ao remover usuário" },
      { status: 500 }
    );
  }
}
