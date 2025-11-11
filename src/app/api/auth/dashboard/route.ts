import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const usuarioId = parseInt(session.user.id as string, 10);

    const { searchParams } = new URL(req.url);
    const mesParam = searchParams.get("mes");

    let startDate: string | null = null;
    let nextMonthStart: string | null = null;

    if (mesParam) {
      const [anoStr, mesStr] = mesParam.split("-");
      const ano = parseInt(anoStr, 10);
      const mes = parseInt(mesStr, 10);

      if (!Number.isNaN(ano) && !Number.isNaN(mes) && mes >= 1 && mes <= 12) {
        const mm = String(mes).padStart(2, "0");
        startDate = `${anoStr}-${mm}-01`;

        const nextMonth = mes === 12 ? 1 : mes + 1;
        const nextYear = mes === 12 ? ano + 1 : ano;
        const nextMm = String(nextMonth).padStart(2, "0");
        nextMonthStart = `${nextYear}-${nextMm}-01`;
      }
    } else {
      const anoAtual = new Date().getFullYear();
      startDate = `${anoAtual}-01-01`;
      nextMonthStart = `${anoAtual + 1}-01-01`;
    }

    const [totais] = await query(
      `
      SELECT 
        COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) AS total_receitas,
        COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) AS total_despesas
      FROM "Lancamentos" l
      WHERE l.usuario_id = $1
        AND ($2::date IS NULL OR l.data >= $2)
        AND ($3::date IS NULL OR l.data < $3)
      `,
      [usuarioId, startDate, nextMonthStart]
    );

    const totalReceitas = parseFloat(totais?.total_receitas || 0);
    const totalDespesas = parseFloat(totais?.total_despesas || 0);
    const saldo = totalReceitas - totalDespesas;

    const evolucaoMensal = await query(
      `
      SELECT 
        TO_CHAR(l.data, 'MM/YYYY') AS mes,
        COALESCE(SUM(CASE WHEN l.tipo = 'receita' THEN l.valor ELSE 0 END), 0) AS receita,
        COALESCE(SUM(CASE WHEN l.tipo = 'despesa' THEN l.valor ELSE 0 END), 0) AS despesa
      FROM "Lancamentos" l
      WHERE l.usuario_id = $1
        AND ($2::date IS NULL OR l.data >= $2)
        AND ($3::date IS NULL OR l.data < $3)
      GROUP BY mes
      ORDER BY MIN(l.data)
      `,
      [usuarioId, startDate, nextMonthStart]
    );

    const despesasPorCategoria = await query(
      `
      SELECT 
        c.nome AS categoria,
        COUNT(l.id) AS quantidade,
        COALESCE(SUM(l.valor), 0) AS total
      FROM "Lancamentos" l
      JOIN "Categorias" c ON l.categoria_id = c.id
      WHERE l.usuario_id = $1
        AND l.tipo = 'despesa'
        AND ($2::date IS NULL OR l.data >= $2)
        AND ($3::date IS NULL OR l.data < $3)
      GROUP BY c.nome
      ORDER BY total DESC
      `,
      [usuarioId, startDate, nextMonthStart]
    );

    const ultimosLancamentos = await query(
      `
      SELECT descricao, tipo, valor, data
      FROM "Lancamentos"
      WHERE usuario_id = $1
        AND ($2::date IS NULL OR data >= $2)
        AND ($3::date IS NULL OR data < $3)
      ORDER BY data DESC
      LIMIT 5
      `,
      [usuarioId, startDate, nextMonthStart]
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
