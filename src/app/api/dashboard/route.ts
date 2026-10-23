import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;
    const { usuarioId } = auth;

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
      FROM lancamentos l
      WHERE l.usuario_id = $1
        AND ($2::date IS NULL OR l.data >= $2)
        AND ($3::date IS NULL OR l.data < $3)
      `,
      [usuarioId, startDate, nextMonthStart]
    );

    const totalReceitas = parseFloat(totais?.total_receitas || 0);
    const totalDespesas = parseFloat(totais?.total_despesas || 0);

    // Saldo por carteira. O filtro de período fica no ON (e não no WHERE) para
    // que carteiras sem lançamentos no período apareçam com saldo 0.
    const carteirasRows = await query(
      `
      SELECT c.id, c.nome,
        COALESCE(SUM(CASE WHEN l.tipo = 'receita' THEN l.valor
                          WHEN l.tipo = 'despesa' THEN -l.valor END), 0)::text AS saldo
      FROM carteiras c
      LEFT JOIN lancamentos l ON l.carteira_id = c.id
        AND l.usuario_id = c.usuario_id
        AND ($2::date IS NULL OR l.data >= $2)
        AND ($3::date IS NULL OR l.data < $3)
      WHERE c.usuario_id = $1
      GROUP BY c.id, c.nome
      ORDER BY c.nome ASC
      `,
      [usuarioId, startDate, nextMonthStart]
    );

    // Centavos inteiros: o total é a soma exata dos saldos exibidos.
    const carteiras = carteirasRows.map((c) => ({
      id: c.id,
      nome: c.nome,
      centavos: Math.round(parseFloat(c.saldo) * 100),
    }));
    const saldo =
      carteiras.reduce((soma, c) => soma + c.centavos, 0) / 100;

    const evolucaoMensal = await query(
      `
      SELECT 
        TO_CHAR(l.data, 'MM/YYYY') AS mes,
        COALESCE(SUM(CASE WHEN l.tipo = 'receita' THEN l.valor ELSE 0 END), 0) AS receita,
        COALESCE(SUM(CASE WHEN l.tipo = 'despesa' THEN l.valor ELSE 0 END), 0) AS despesa
      FROM lancamentos l
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
      FROM lancamentos l
      JOIN categorias c ON l.categoria_id = c.id
      WHERE l.usuario_id = $1
        AND l.tipo = 'despesa'
        AND ($2::date IS NULL OR l.data >= $2)
        AND ($3::date IS NULL OR l.data < $3)
      GROUP BY c.nome
      ORDER BY total DESC
      `,
      [usuarioId, startDate, nextMonthStart]
    );

    const receitasPorCategoria = await query(
      `
      SELECT 
        c.nome AS categoria,
        COUNT(l.id) AS quantidade,
        COALESCE(SUM(l.valor), 0) AS total
      FROM lancamentos l
      JOIN categorias c ON l.categoria_id = c.id
      WHERE l.usuario_id = $1
        AND l.tipo = 'receita'
        AND ($2::date IS NULL OR l.data >= $2)
        AND ($3::date IS NULL OR l.data < $3)
      GROUP BY c.nome
      ORDER BY total DESC
      `,
      [usuarioId, startDate, nextMonthStart]
    );

    const ultimosLancamentos = await query(
      `
      SELECT descricao, tipo, valor, criado_em,
        TO_CHAR(data, 'YYYY-MM-DD') AS data
      FROM lancamentos
      WHERE usuario_id = $1
        AND ($2::date IS NULL OR data >= $2)
        AND ($3::date IS NULL OR data < $3)
      ORDER BY criado_em DESC
      LIMIT 5
      `,
      [usuarioId, startDate, nextMonthStart]
    );

    const data = {
      saldo,
      carteiras: carteiras.map((c) => ({
        id: c.id,
        nome: c.nome,
        saldo: c.centavos / 100,
      })),
      totalReceitas,
      totalDespesas,
      evolucaoMensal: evolucaoMensal || [],
      despesasPorCategoria: despesasPorCategoria || [],
      receitasPorCategoria: receitasPorCategoria || [],
      ultimosLancamentos: ultimosLancamentos || [],
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);
    return NextResponse.json(
      {
        error: "Erro ao carregar dashboard",
        saldo: 0,
        carteiras: [],
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
