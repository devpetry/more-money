import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type CamposAtualizaveis = {
  descricao?: string;
  valor?: number;
  tipo?: "receita" | "despesa";
  categoria_id?: number | null;
  data?: string;
  status?: "pendente" | "pago" | "cancelado" | "agendado" | "atrasado";
};

// GET - Obter detalhes de um lançamento específico
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const usuarioId = parseInt(session.user.id, 10);
    const lancamentoId = parseInt(id, 10);

    if (isNaN(usuarioId) || isNaN(lancamentoId)) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const result = await query(
      `SELECT l.id, l.descricao, l.valor, l.tipo, l.status, l.data,
              l.categoria_id, c.nome AS categoria_nome,
              l.empresa_id, l.usuario_id, l.criado_em, l.atualizado_em
       FROM "Lancamentos" l
       LEFT JOIN "Categorias" c ON c.id = l.categoria_id
       WHERE l.id = $1 AND l.usuario_id = $2
       LIMIT 1`,
      [lancamentoId, usuarioId]
    );

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Lançamento não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Erro ao buscar lançamento:", error);
    return NextResponse.json(
      { error: "Erro ao buscar lançamento." },
      { status: 500 }
    );
  }
}

// PUT - Atualizar um lançamento existente
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const usuarioId = parseInt(session.user.id, 10);
    const lancamentoId = parseInt(id, 10);

    if (isNaN(usuarioId) || isNaN(lancamentoId)) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const body = (await req.json()) as Record<string, unknown>;

    const camposPermitidos = [
      "descricao",
      "valor",
      "tipo",
      "categoria_id",
      "data",
      "status",
    ];

    const camposAtualizar: Partial<CamposAtualizaveis> = {};

    for (const key of Object.keys(body)) {
      if (camposPermitidos.includes(key)) {
        (camposAtualizar as unknown as Record<string, unknown>)[key] =
          body[key];
      }
    }

    if (Object.keys(camposAtualizar).length === 0) {
      return NextResponse.json(
        { error: "Nenhum campo válido enviado para atualização." },
        { status: 400 }
      );
    }

    if (camposAtualizar.status) {
      const statusValidos = [
        "pendente",
        "pago",
        "cancelado",
        "agendado",
        "atrasado",
      ];

      if (!statusValidos.includes(camposAtualizar.status)) {
        return NextResponse.json(
          { error: "Status inválido." },
          { status: 400 }
        );
      }
    }

    const setClauses = Object.keys(camposAtualizar).map(
      (key, index) => `${key} = $${index + 1}`
    );

    const valores = Object.values(camposAtualizar);

    setClauses.push(`"atualizado_em" = NOW()`);

    const result = await query(
      `
      UPDATE "Lancamentos"
      SET ${setClauses.join(", ")}
      WHERE id = $${valores.length + 1} 
        AND usuario_id = $${valores.length + 2}
      RETURNING *
    `,
      [...valores, lancamentoId, usuarioId]
    );

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Lançamento não encontrado ou não pertence ao usuário." },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Erro ao atualizar lançamento:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar lançamento." },
      { status: 500 }
    );
  }
}

// DELETE - Remover lançamento
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const usuarioId = parseInt(session.user.id, 10);
    const lancamentoId = parseInt(id, 10);

    if (isNaN(usuarioId) || isNaN(lancamentoId)) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const result = await query(
      `DELETE FROM "Lancamentos"
       WHERE id = $1 AND usuario_id = $2
       RETURNING id`,
      [lancamentoId, usuarioId]
    );

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Lançamento não encontrado ou não pertence ao usuário." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Lançamento removido com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir lançamento:", error);
    return NextResponse.json(
      { error: "Erro ao excluir lançamento." },
      { status: 500 }
    );
  }
}
