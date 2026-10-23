import type { Db } from "./faturas";

// Movimentos de pagamento de fatura ($1 usuário): o pagamento vale na data
// efetiva e o estorno entra negativo na data do estorno (America/Sao_Paulo);
// o registro original é preservado. Período em $2/$3.
const MOVIMENTOS = `(
  SELECT p.fatura_id, p.carteira_id, p.valor, p.data
  FROM pagamentos_fatura p WHERE p.usuario_id = $1
  UNION ALL
  SELECT p.fatura_id, p.carteira_id, -p.valor,
         (p.estornado_em AT TIME ZONE 'America/Sao_Paulo')::date
  FROM pagamentos_fatura p WHERE p.usuario_id = $1 AND p.estornado_em IS NOT NULL
) m`;
const MOVIMENTOS_NO_PERIODO = `($2::date IS NULL OR m.data >= $2)
  AND ($3::date IS NULL OR m.data < $3)`;

/**
 * Indicadores do dashboard no período [inicio, proximoInicio).
 * Compras de cartão (lancamentos.fatura_id) não entram nos indicadores nem no
 * saldo das carteiras: o pagamento da fatura é que conta, pela data efetiva
 * e pela carteira escolhida, e é distribuído entre as categorias na proporção
 * dos lançamentos da fatura (total atual). Estornos entram com sinal negativo
 * na data do estorno.
 */
export async function consultarDashboard(
  db: Db,
  usuarioId: string,
  startDate: string | null,
  nextMonthStart: string | null
) {
  const params = [usuarioId, startDate, nextMonthStart];

  const { rows: [totais] } = await db.query(
    `
    SELECT
      COALESCE(SUM(CASE WHEN l.tipo = 'receita' THEN l.valor ELSE 0 END), 0) AS total_receitas,
      COALESCE(SUM(CASE WHEN l.tipo = 'despesa' THEN l.valor ELSE 0 END), 0)
        + COALESCE((SELECT SUM(m.valor) FROM ${MOVIMENTOS}
                    WHERE ${MOVIMENTOS_NO_PERIODO}), 0) AS total_despesas
    FROM lancamentos l
    WHERE l.usuario_id = $1
      AND l.fatura_id IS NULL
      AND ($2::date IS NULL OR l.data >= $2)
      AND ($3::date IS NULL OR l.data < $3)
    `,
    params
  );

  const totalReceitas = parseFloat(String(totais?.total_receitas || 0));
  const totalDespesas = parseFloat(String(totais?.total_despesas || 0));

  // Saldo por carteira. O filtro de período fica no ON (e não no WHERE) para
  // que carteiras sem lançamentos no período apareçam com saldo 0. Os
  // pagamentos de fatura saem da carteira escolhida, na data efetiva.
  const { rows: carteirasRows } = await db.query(
    `
    SELECT c.id, c.nome,
      (COALESCE(SUM(CASE WHEN l.tipo = 'receita' THEN l.valor
                         WHEN l.tipo = 'despesa' THEN -l.valor END), 0)
       - COALESCE((SELECT SUM(m.valor) FROM ${MOVIMENTOS}
                   WHERE m.carteira_id = c.id AND ${MOVIMENTOS_NO_PERIODO}), 0))::text AS saldo
    FROM carteiras c
    LEFT JOIN lancamentos l ON l.carteira_id = c.id
      AND l.usuario_id = c.usuario_id
      AND ($2::date IS NULL OR l.data >= $2)
      AND ($3::date IS NULL OR l.data < $3)
    WHERE c.usuario_id = $1
    GROUP BY c.id, c.nome
    ORDER BY c.nome ASC
    `,
    params
  );

  // Centavos inteiros: o total é a soma exata dos saldos exibidos.
  const carteiras = carteirasRows.map((c) => ({
    id: c.id,
    nome: c.nome,
    centavos: Math.round(parseFloat(String(c.saldo)) * 100),
  }));
  const saldo = carteiras.reduce((soma, c) => soma + c.centavos, 0) / 100;

  const { rows: evolucaoMensal } = await db.query(
    `
    SELECT
      TO_CHAR(x.data, 'MM/YYYY') AS mes,
      COALESCE(SUM(x.receita), 0) AS receita,
      COALESCE(SUM(x.despesa), 0) AS despesa
    FROM (
      SELECT l.data,
        CASE WHEN l.tipo = 'receita' THEN l.valor ELSE 0 END AS receita,
        CASE WHEN l.tipo = 'despesa' THEN l.valor ELSE 0 END AS despesa
      FROM lancamentos l
      WHERE l.usuario_id = $1
        AND l.fatura_id IS NULL
        AND ($2::date IS NULL OR l.data >= $2)
        AND ($3::date IS NULL OR l.data < $3)
      UNION ALL
      SELECT m.data, 0, m.valor
      FROM ${MOVIMENTOS}
      WHERE ${MOVIMENTOS_NO_PERIODO}
    ) x
    GROUP BY mes
    ORDER BY MIN(x.data)
    `,
    params
  );

  // Despesas por categoria: lançamentos de carteira + parcela proporcional
  // (pago no período / total da fatura) dos lançamentos de cartão
  const { rows: despesasPorCategoria } = await db.query(
    `
    SELECT x.categoria, COUNT(*) AS quantidade, COALESCE(SUM(x.valor), 0) AS total
    FROM (
      SELECT c.nome AS categoria, l.valor
      FROM lancamentos l
      JOIN categorias c ON l.categoria_id = c.id
      WHERE l.usuario_id = $1
        AND l.tipo = 'despesa'
        AND l.fatura_id IS NULL
        AND ($2::date IS NULL OR l.data >= $2)
        AND ($3::date IS NULL OR l.data < $3)
      UNION ALL
      SELECT c.nome AS categoria, pf.pago * l.valor / ft.total AS valor
      FROM lancamentos l
      JOIN categorias c ON l.categoria_id = c.id
      JOIN (SELECT m.fatura_id, SUM(m.valor) AS pago
            FROM ${MOVIMENTOS}
            WHERE ${MOVIMENTOS_NO_PERIODO}
            GROUP BY m.fatura_id
            HAVING SUM(m.valor) <> 0) pf ON pf.fatura_id = l.fatura_id
      JOIN (SELECT fatura_id, SUM(valor) AS total
            FROM lancamentos
            WHERE usuario_id = $1 AND fatura_id IS NOT NULL
            GROUP BY fatura_id) ft ON ft.fatura_id = l.fatura_id
      WHERE l.usuario_id = $1
        AND l.tipo = 'despesa'
    ) x
    GROUP BY x.categoria
    ORDER BY total DESC
    `,
    params
  );

  const { rows: receitasPorCategoria } = await db.query(
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
    params
  );

  const { rows: ultimosLancamentos } = await db.query(
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
    params
  );

  return {
    saldo,
    carteiras: carteiras.map((c) => ({
      id: c.id,
      nome: c.nome,
      saldo: c.centavos / 100,
    })),
    totalReceitas,
    totalDespesas,
    evolucaoMensal,
    despesasPorCategoria,
    receitasPorCategoria,
    ultimosLancamentos,
  };
}
