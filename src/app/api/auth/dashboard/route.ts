import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const usuarioId = parseInt(session.user.id, 10);

    const [totais] = await query(
      `
      SELECT 
        COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) AS total_receitas,
        COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) AS total_despesas
      FROM "Lancamentos"
      WHERE usuario_id = $1
    `,
      [usuarioId]
    );

    const totalReceitas = parseFloat(totais?.total_receitas || 0);
    const totalDespesas = parseFloat(totais?.total_despesas || 0);
    const saldo = totalReceitas - totalDespesas;

    const evolucaoMensal = await query(
      `
      SELECT 
        TO_CHAR(data, 'MM/YYYY') AS mes,
        COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) AS receita,
        COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) AS despesa
      FROM "Lancamentos"
      WHERE usuario_id = $1
        AND data >= NOW() - INTERVAL '6 months'
      GROUP BY mes
      ORDER BY MIN(data)
    `,
      [usuarioId]
    );

    const despesasPorCategoria = await query(
      `
      SELECT 
        c.nome AS categoria,
        COUNT(l.id) AS quantidade,
        COALESCE(SUM(l.valor), 0) AS total
      FROM "Lancamentos" l
      JOIN "Categorias" c ON l.categoria_id = c.id
      WHERE l.usuario_id = $1 AND l.tipo = 'despesa'
      GROUP BY c.nome
      ORDER BY total DESC
    `,
      [usuarioId]
    );

    const ultimosLancamentos = await query(
      `
      SELECT descricao, tipo, valor, data
      FROM "Lancamentos"
      WHERE usuario_id = $1
      ORDER BY data DESC
      LIMIT 5
    `,
      [usuarioId]
    );

    const data = {
      saldo,
      totalReceitas,
      totalDespesas,
      evolucaoMensal: evolucaoMensal || [],
      despesasPorCategoria: despesasPorCategoria || [],
      ultimosLancamentos: ultimosLancamentos || [],
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);
    return NextResponse.json(
      {
        error: "Erro ao carregar dashboard",
        saldo: 0,
        totalReceitas: 0,
        totalDespesas: 0,
        evolucaoMensal: [],
        despesasPorCategoria: [],
        ultimosLancamentos: [],
      },
      { status: 500 }
    );
  }
}
