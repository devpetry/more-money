// Regras de cartões e faturas (issue #23): ciclos, estados, pagamentos e
// lançamentos de cartão. Sem imports de alias (@/...), para que o mesmo
// arquivo rode sob `node --test`.
//
// Modelo: cada cartão tem um ciclo por mês (`ciclo` = dia 1 do mês do
// fechamento padrão). A compra em `d` entra no primeiro ciclo cujo fechamento
// é posterior a `d`; compra no dia do fechamento vai para o ciclo seguinte.
// O estado da fatura é derivado (nada é gravado):
//   aberta    : não fechada
//   pendente  : fechada, sem pagamentos e com total > 0
//   parcial   : fechada e 0 < pago < total
//   paga      : fechada e pago >= total (inclui fatura fechada de total zero,
//               sem pagamento fictício)
// Fechada = fechamento manual (fechada_em) OU data_fechamento <= hoje em
// America/Sao_Paulo (fechamento automático: sem job, nada a reexecutar).
//
// Concorrência: toda operação que altera lançamentos/pagamentos de um cartão
// primeiro trava a linha do cartão (SELECT ... FOR UPDATE, sempre em ordem de
// id) dentro de uma transação, o que serializa pagamentos, estornos e edições.

export type StatusFatura = "aberta" | "pendente" | "parcial" | "paga";
export type Linha = Record<string, string | number | boolean | null>;

export interface Db {
  query(text: string, params?: unknown[]): Promise<{ rows: Linha[] }>;
}

export class ErroNegocio extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/* ------------------------------ datas (puras) ----------------------------- */

const pad = (n: number) => String(n).padStart(2, "0");

export function ultimoDiaDoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

export function dataValida(valor: unknown): valor is string {
  if (typeof valor !== "string") return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!m) return false;
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return mes >= 1 && mes <= 12 && dia >= 1 && dia <= ultimoDiaDoMes(ano, mes);
}

// "YYYY-MM" -> "YYYY-MM-01" (ou null se inválido)
export function cicloDeParametro(valor: string): string | null {
  const m = /^(\d{4})-(\d{2})$/.exec(valor);
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) return null;
  return `${valor}-01`;
}

export function primeiroDiaDoMes(data: string): string {
  return `${data.slice(0, 7)}-01`;
}

export function somarMeses(ciclo: string, n: number): string {
  const indice = Number(ciclo.slice(0, 4)) * 12 + (Number(ciclo.slice(5, 7)) - 1) + n;
  const ano = Math.floor(indice / 12);
  return `${String(ano).padStart(4, "0")}-${pad((indice % 12) + 1)}-01`;
}

// Dia `dia` do mês de `ciclo`, limitado ao último dia (meses curtos)
export function dataNoMes(ciclo: string, dia: number): string {
  const ano = Number(ciclo.slice(0, 4));
  const mes = Number(ciclo.slice(5, 7));
  return `${ciclo.slice(0, 7)}-${pad(Math.min(dia, ultimoDiaDoMes(ano, mes)))}`;
}

export function fechamentoPadrao(ciclo: string, diaFechamento: number): string {
  return dataNoMes(ciclo, diaFechamento);
}

// Primeiro vencimento posterior ao fechamento (dias inexistentes vão para o último dia do mês)
export function vencimentoPadrao(
  ciclo: string,
  diaFechamento: number,
  diaVencimento: number
): string {
  const noMes = dataNoMes(ciclo, diaVencimento);
  return noMes > fechamentoPadrao(ciclo, diaFechamento)
    ? noMes
    : dataNoMes(somarMeses(ciclo, 1), diaVencimento);
}

// Meses antes/depois do mês da compra em que se procura o ciclo
const JANELA_DE_CICLOS = 3;

/**
 * Ciclo (fatura) de uma compra: o primeiro cujo fechamento é posterior à data
 * (e a data não é anterior ao fechamento do ciclo anterior). `fechamentoDoCiclo`
 * devolve o fechamento efetivo (ajustado ou padrão). Sem ciclo coerente na
 * janela, devolve null: não há atribuição silenciosa.
 */
export function cicloDaCompra(
  data: string,
  fechamentoDoCiclo: (ciclo: string) => string
): string | null {
  const base = primeiroDiaDoMes(data);
  for (let i = -JANELA_DE_CICLOS; i <= JANELA_DE_CICLOS; i++) {
    const ciclo = somarMeses(base, i);
    if (data < fechamentoDoCiclo(ciclo)) {
      return data >= fechamentoDoCiclo(somarMeses(ciclo, -1)) ? ciclo : null;
    }
  }
  return null;
}

// Ajuste manual de datas de uma fatura; null = válido
// dd/mm/aaaa, o mesmo padrão de formatDate (src/lib/date.ts)
const dataBr = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

export function validarAjuste(a: {
  fechamento: unknown;
  vencimento: unknown;
  fechamentoAnterior: string;
  fechamentoProximo: string;
}): string | null {
  if (!dataValida(a.fechamento) || !dataValida(a.vencimento)) {
    return "Informe datas de fechamento e vencimento válidas.";
  }
  if (a.fechamento <= a.fechamentoAnterior || a.fechamento >= a.fechamentoProximo) {
    return `O fechamento deve ficar depois do fechamento da fatura anterior (${dataBr(a.fechamentoAnterior)}) e antes do fechamento da fatura seguinte (${dataBr(a.fechamentoProximo)}).`;
  }
  if (a.vencimento < a.fechamento) {
    return "O vencimento não pode ser anterior ao fechamento.";
  }
  return null;
}

export function validarCartao(corpo: Record<string, unknown>) {
  const nome = typeof corpo.nome === "string" ? corpo.nome.trim() : "";
  const diaFechamento = Number(corpo.dia_fechamento);
  const diaVencimento = Number(corpo.dia_vencimento);
  if (!nome) throw new ErroNegocio("O campo 'nome' é obrigatório.");
  for (const dia of [diaFechamento, diaVencimento]) {
    if (!Number.isInteger(dia) || dia < 1 || dia > 31) {
      throw new ErroNegocio("Os dias de fechamento e vencimento devem ser de 1 a 31.");
    }
  }
  return { nome, diaFechamento, diaVencimento };
}

/* ------------------------------ valores (puros) --------------------------- */

/**
 * Centavos exatos a partir de um decimal (string ou número), sem multiplicar
 * ponto flutuante: Math.round(1.005 * 100) daria 100. A terceira casa arredonda
 * meio-para-longe-do-zero, igual ao round(numeric, 2) do PostgreSQL, então
 * valor armazenado, total da fatura e pagamentos usam a mesma regra.
 * Entrada inválida (texto, notação científica) devolve NaN.
 */
export function paraCentavos(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const texto =
    typeof v === "number" ? (Number.isFinite(v) ? v.toFixed(10) : "") : v.trim();
  const m = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(texto);
  if (!m || (!m[2] && !m[3])) return NaN;
  const fracao = (m[3] ?? "").padEnd(3, "0");
  const centavos =
    Number(m[2] || "0") * 100 + Number(fracao.slice(0, 2)) + (Number(fracao[2]) >= 5 ? 1 : 0);
  return centavos === 0 ? 0 : m[1] === "-" ? -centavos : centavos;
}

export const deCentavos = (c: number) => (c / 100).toFixed(2);

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function statusFatura(f: {
  fechada: boolean;
  // data_fechamento já alcançada (fechamento automático)
  fechadaPorData: boolean;
  totalCentavos: number;
  pagoCentavos: number;
}): StatusFatura {
  if (!f.fechada) return "aberta";
  // Fechada de total zero é paga só a partir da data de fechamento; fechada
  // manualmente antes disso segue fechada, aguardando a data
  if (f.totalCentavos === 0) return f.fechadaPorData ? "paga" : "pendente";
  if (f.pagoCentavos >= f.totalCentavos) return "paga";
  return f.pagoCentavos > 0 ? "parcial" : "pendente";
}

const rotuloCiclo = (ciclo: string) => `${ciclo.slice(5, 7)}/${ciclo.slice(0, 4)}`;

/* ------------------------------ consultas --------------------------------- */

export interface Cartao {
  id: string;
  nome: string;
  dia_fechamento: number;
  dia_vencimento: number;
}

export interface FaturaResumo {
  id: string | null; // null: ciclo ainda sem linha (apenas visualização)
  cartao_id: string;
  ciclo: string;
  data_fechamento: string;
  data_vencimento: string;
  fechada_em: string | null;
  fechada: boolean;
  total: number;
  pago: number;
  restante: number;
  status: StatusFatura;
}

const HOJE = "(now() AT TIME ZONE 'America/Sao_Paulo')::date";
const DATA = "'YYYY-MM-DD'";

const COLUNAS_FATURA = `
  f.id, f.cartao_id,
  TO_CHAR(f.ciclo, ${DATA}) AS ciclo,
  TO_CHAR(f.data_fechamento, ${DATA}) AS data_fechamento,
  TO_CHAR(f.data_vencimento, ${DATA}) AS data_vencimento,
  f.fechada_em::text AS fechada_em,
  (f.fechada_em IS NOT NULL OR f.data_fechamento <= ${HOJE}) AS fechada,
  (f.data_fechamento <= ${HOJE}) AS fechada_por_data,
  COALESCE((SELECT SUM(l.valor) FROM lancamentos l WHERE l.fatura_id = f.id), 0)::text AS total,
  COALESCE((SELECT SUM(p.valor) FROM pagamentos_fatura p
            WHERE p.fatura_id = f.id AND p.estornado_em IS NULL), 0)::text AS pago`;

function resumir(r: Linha): FaturaResumo {
  const totalCentavos = paraCentavos(r.total as string);
  const pagoCentavos = paraCentavos(r.pago as string);
  const fechada = Boolean(r.fechada);
  return {
    id: (r.id as string | null) ?? null,
    cartao_id: r.cartao_id as string,
    ciclo: r.ciclo as string,
    data_fechamento: r.data_fechamento as string,
    data_vencimento: r.data_vencimento as string,
    fechada_em: (r.fechada_em as string | null) ?? null,
    fechada,
    total: totalCentavos / 100,
    pago: pagoCentavos / 100,
    restante: Math.max(totalCentavos - pagoCentavos, 0) / 100,
    status: statusFatura({
      fechada,
      fechadaPorData: Boolean(r.fechada_por_data),
      totalCentavos,
      pagoCentavos,
    }),
  };
}

async function hoje(db: Db): Promise<string> {
  const { rows } = await db.query(`SELECT TO_CHAR(${HOJE}, ${DATA}) AS hoje`);
  return rows[0].hoje as string;
}

export async function buscarCartao(
  db: Db,
  usuarioId: string,
  cartaoId: string
): Promise<Cartao> {
  const { rows } = await db.query(
    `SELECT id, nome, dia_fechamento, dia_vencimento
     FROM cartoes WHERE id = $1 AND usuario_id = $2`,
    [cartaoId, usuarioId]
  );
  if (rows.length === 0) throw new ErroNegocio("Cartão não encontrado.", 404);
  return rows[0] as unknown as Cartao;
}

// Trava os cartões (ordem de id, sem deadlock entre transações) e valida a posse
async function travarCartoes(
  db: Db,
  usuarioId: string,
  ids: string[]
): Promise<Cartao[]> {
  const unicos = [...new Set(ids)];
  const { rows } = await db.query(
    `SELECT id, nome, dia_fechamento, dia_vencimento
     FROM cartoes WHERE id = ANY($1::uuid[]) AND usuario_id = $2
     ORDER BY id FOR UPDATE`,
    [unicos, usuarioId]
  );
  if (rows.length !== unicos.length) {
    throw new ErroNegocio("Cartão não encontrado.", 404);
  }
  return rows as unknown as Cartao[];
}

// Fechamento efetivo (fatura ajustada, se existir; senão o padrão) dos ciclos próximos
async function resolverFechamentos(db: Db, cartao: Cartao, base: string) {
  const { rows } = await db.query(
    `SELECT TO_CHAR(ciclo, ${DATA}) AS ciclo,
            TO_CHAR(data_fechamento, ${DATA}) AS data_fechamento
     FROM faturas
     WHERE cartao_id = $1 AND ciclo BETWEEN $2::date AND $3::date`,
    [cartao.id, somarMeses(base, -(JANELA_DE_CICLOS + 1)), somarMeses(base, JANELA_DE_CICLOS + 1)]
  );
  const mapa = new Map(rows.map((r) => [r.ciclo as string, r.data_fechamento as string]));
  return (ciclo: string) =>
    mapa.get(ciclo) ?? fechamentoPadrao(ciclo, cartao.dia_fechamento);
}

async function carregarFatura(
  db: Db,
  usuarioId: string,
  cartaoId: string,
  ciclo: string
): Promise<FaturaResumo | null> {
  const { rows } = await db.query(
    `SELECT ${COLUNAS_FATURA} FROM faturas f
     WHERE f.cartao_id = $1 AND f.ciclo = $2::date AND f.usuario_id = $3`,
    [cartaoId, ciclo, usuarioId]
  );
  return rows.length ? resumir(rows[0]) : null;
}

// Cria a fatura do ciclo só quando necessário (compra, fechamento, ajuste)
async function garantirFatura(
  db: Db,
  usuarioId: string,
  cartao: Cartao,
  ciclo: string
): Promise<FaturaResumo> {
  await db.query(
    `INSERT INTO faturas (cartao_id, usuario_id, ciclo, data_fechamento, data_vencimento)
     VALUES ($1, $2, $3::date, $4::date, $5::date)
     ON CONFLICT (cartao_id, ciclo) DO NOTHING`,
    [
      cartao.id,
      usuarioId,
      ciclo,
      fechamentoPadrao(ciclo, cartao.dia_fechamento),
      vencimentoPadrao(ciclo, cartao.dia_fechamento, cartao.dia_vencimento),
    ]
  );
  return (await carregarFatura(db, usuarioId, cartao.id, ciclo))!;
}

async function carregarFaturaPorId(db: Db, id: string): Promise<FaturaResumo> {
  const { rows } = await db.query(
    `SELECT ${COLUNAS_FATURA} FROM faturas f WHERE f.id = $1`,
    [id]
  );
  return resumir(rows[0]);
}

// Ciclo sem linha: mostrado com as datas padrão, sem gravar nada
async function faturaVirtual(db: Db, cartao: Cartao, ciclo: string): Promise<FaturaResumo> {
  const fechamento = fechamentoPadrao(ciclo, cartao.dia_fechamento);
  const fechada = fechamento <= (await hoje(db));
  return {
    id: null,
    cartao_id: cartao.id,
    ciclo,
    data_fechamento: fechamento,
    data_vencimento: vencimentoPadrao(ciclo, cartao.dia_fechamento, cartao.dia_vencimento),
    fechada_em: null,
    fechada,
    total: 0,
    pago: 0,
    restante: 0,
    status: statusFatura({
      fechada,
      fechadaPorData: fechada,
      totalCentavos: 0,
      pagoCentavos: 0,
    }),
  };
}

export async function listarFaturas(
  db: Db,
  usuarioId: string,
  cartaoId: string
): Promise<FaturaResumo[]> {
  const cartao = await buscarCartao(db, usuarioId, cartaoId);
  const { rows } = await db.query(
    `SELECT ${COLUNAS_FATURA} FROM faturas f
     WHERE f.cartao_id = $1 AND f.usuario_id = $2
     ORDER BY f.ciclo DESC`,
    [cartaoId, usuarioId]
  );
  const faturas = rows.map(resumir);

  // Ciclo corrente sempre visível, mesmo sem linha
  const hojeIso = await hoje(db);
  const fechamentos = await resolverFechamentos(db, cartao, primeiroDiaDoMes(hojeIso));
  const atual = cicloDaCompra(hojeIso, fechamentos);
  if (atual && !faturas.some((f) => f.ciclo === atual)) {
    faturas.push(await faturaVirtual(db, cartao, atual));
    faturas.sort((a, b) => (a.ciclo < b.ciclo ? 1 : -1));
  }
  return faturas;
}

export async function detalharFatura(
  db: Db,
  usuarioId: string,
  cartaoId: string,
  ciclo: string
) {
  const cartao = await buscarCartao(db, usuarioId, cartaoId);
  const fatura =
    (await carregarFatura(db, usuarioId, cartaoId, ciclo)) ??
    (await faturaVirtual(db, cartao, ciclo));
  if (!fatura.id) return { fatura, lancamentos: [], pagamentos: [] };

  const lancamentos = await db.query(
    `SELECT l.id, l.descricao, l.valor::text AS valor,
            TO_CHAR(l.data, ${DATA}) AS data, c.nome AS categoria_nome
     FROM lancamentos l
     LEFT JOIN categorias c ON c.id = l.categoria_id
     WHERE l.fatura_id = $1 AND l.usuario_id = $2
     ORDER BY l.data, l.criado_em`,
    [fatura.id, usuarioId]
  );
  const pagamentos = await db.query(
    `SELECT p.id, p.valor::text AS valor, TO_CHAR(p.data, ${DATA}) AS data,
            p.carteira_id, w.nome AS carteira_nome,
            p.estornado_em::text AS estornado_em, p.criado_em::text AS criado_em
     FROM pagamentos_fatura p
     JOIN carteiras w ON w.id = p.carteira_id
     WHERE p.fatura_id = $1 AND p.usuario_id = $2
     ORDER BY p.criado_em, p.id`,
    [fatura.id, usuarioId]
  );
  return { fatura, lancamentos: lancamentos.rows, pagamentos: pagamentos.rows };
}

/* ------------------------- operações sobre a fatura ----------------------- */

const msgPaga = (f: FaturaResumo) =>
  `A fatura ${rotuloCiclo(f.ciclo)} está paga: não é possível incluir, editar ou excluir lançamentos dela. Estorne o pagamento para alterá-la.`;

const msgDestinoPaga = (f: FaturaResumo) =>
  `A data informada pertence à fatura ${rotuloCiclo(f.ciclo)}, que está paga: não é possível mover a compra para ela. Estorne o pagamento ou escolha outra data.`;

// Fatura quitada com valor: bloqueia lançamentos e datas. Fatura fechada de
// total zero conta como paga, mas pode ser reaberta por uma compra esquecida.
const quitada = (f: FaturaResumo) => f.status === "paga" && paraCentavos(f.total) > 0;

const SEM_CICLO =
  "Não foi possível determinar a fatura da compra: confira as datas de fechamento das faturas do cartão.";

const msgFechada = (f: FaturaResumo) =>
  `A fatura ${rotuloCiclo(f.ciclo)} está fechada e ainda não foi paga; o valor dela foi recalculado.`;

export async function ajustarDatasFatura(
  db: Db,
  usuarioId: string,
  cartaoId: string,
  ciclo: string,
  datas: { fechamento: unknown; vencimento: unknown }
): Promise<FaturaResumo & { aviso: string | null }> {
  const [cartao] = await travarCartoes(db, usuarioId, [cartaoId]);
  const fatura = await garantirFatura(db, usuarioId, cartao, ciclo);
  if (quitada(fatura)) {
    throw new ErroNegocio(
      "Fatura paga: as datas não podem ser alteradas. Estorne o pagamento para ajustá-las.",
      409
    );
  }
  const fechamentos = await resolverFechamentos(db, cartao, ciclo);
  const erro = validarAjuste({
    ...datas,
    fechamentoAnterior: fechamentos(somarMeses(ciclo, -1)),
    fechamentoProximo: fechamentos(somarMeses(ciclo, 1)),
  });
  if (erro) throw new ErroNegocio(erro);

  // Fechamento futuro reabre a fatura (inclusive a fechada manualmente);
  // pagamentos já registrados são mantidos
  await db.query(
    `UPDATE faturas
     SET data_fechamento = $1::date, data_vencimento = $2::date,
         fechada_em = CASE WHEN $1::date > ${HOJE} THEN NULL ELSE fechada_em END,
         atualizado_em = NOW()
     WHERE id = $3`,
    [datas.fechamento, datas.vencimento, fatura.id]
  );
  const aviso = await reassociarCompras(db, usuarioId, cartao, ciclo);
  return { ...(await carregarFaturaPorId(db, fatura.id!)), aviso };
}

// Após mudar o fechamento do ciclo, recalcula a fatura das compras dele e do
// ciclo seguinte (as únicas cuja fronteira mudou). Compras de faturas pagas não
// se movem: se o novo fechamento exigir isso, o ajuste inteiro é recusado.
async function reassociarCompras(
  db: Db,
  usuarioId: string,
  cartao: Cartao,
  ciclo: string
): Promise<string | null> {
  const fechamentos = await resolverFechamentos(db, cartao, ciclo);
  const { rows } = await db.query(
    `SELECT l.id, TO_CHAR(l.data, ${DATA}) AS data, l.fatura_id, TO_CHAR(f.ciclo, ${DATA}) AS ciclo
     FROM lancamentos l JOIN faturas f ON f.id = l.fatura_id
     WHERE f.cartao_id = $1 AND f.usuario_id = $2 AND f.ciclo IN ($3::date, $4::date)
     ORDER BY l.data, l.criado_em, l.id`,
    [cartao.id, usuarioId, ciclo, somarMeses(ciclo, 1)]
  );

  const movimentos = rows
    .map((r) => ({
      id: r.id as string,
      faturaId: r.fatura_id as string,
      origem: r.ciclo as string,
      destino: cicloDaCompra(r.data as string, fechamentos),
    }))
    .filter((m) => m.destino !== m.origem);
  if (movimentos.length === 0) return null;
  if (movimentos.some((m) => m.destino === null)) {
    throw new ErroNegocio(SEM_CICLO, 409);
  }

  // Restrições: nenhuma fatura quitada pode perder nem receber compras
  const verificadas = new Set<string>();
  for (const m of movimentos) {
    for (const c of [m.origem, m.destino as string]) {
      if (verificadas.has(c)) continue;
      verificadas.add(c);
      const f = await carregarFatura(db, usuarioId, cartao.id, c);
      if (f && quitada(f)) {
        throw new ErroNegocio(
          `Não é possível ajustar o fechamento: compras mudariam de fatura e a fatura ${rotuloCiclo(c)} está paga. Estorne o pagamento dela antes.`,
          409
        );
      }
    }
  }

  let fechadas = false;
  for (const m of movimentos) {
    const destino = await garantirFatura(db, usuarioId, cartao, m.destino as string);
    fechadas = fechadas || destino.fechada;
    await db.query(`UPDATE lancamentos SET fatura_id = $1 WHERE id = $2`, [destino.id, m.id]);
  }
  for (const faturaId of new Set(movimentos.map((m) => m.faturaId))) {
    await garantirTotalCobreOPago(db, faturaId);
  }
  return `${movimentos.length} compra(s) mudaram de fatura com o novo fechamento.${
    fechadas ? " Alguma delas foi para uma fatura fechada e ainda não paga." : ""
  }`;
}

export async function fecharFatura(
  db: Db,
  usuarioId: string,
  cartaoId: string,
  ciclo: string
): Promise<FaturaResumo> {
  const [cartao] = await travarCartoes(db, usuarioId, [cartaoId]);
  const fatura = await garantirFatura(db, usuarioId, cartao, ciclo);
  if (fatura.fechada) throw new ErroNegocio("A fatura já está fechada.", 409);
  if (paraCentavos(fatura.total) === 0) {
    throw new ErroNegocio(
      "Fatura sem lançamentos: ela é fechada automaticamente na data de fechamento.",
      409
    );
  }

  await db.query(
    `UPDATE faturas SET fechada_em = NOW(), atualizado_em = NOW() WHERE id = $1`,
    [fatura.id]
  );
  return carregarFaturaPorId(db, fatura.id!);
}

export async function registrarPagamento(
  db: Db,
  usuarioId: string,
  cartaoId: string,
  ciclo: string,
  entrada: { valor: unknown; data: unknown; carteiraId: unknown }
): Promise<FaturaResumo> {
  const { valor, data, carteiraId } = entrada;
  const centavos = paraCentavos(valor as string | number);
  if (!Number.isFinite(centavos) || centavos <= 0) {
    throw new ErroNegocio("O valor do pagamento deve ser maior que zero.");
  }
  if (!dataValida(data)) throw new ErroNegocio("Informe a data efetiva do pagamento.");
  if (typeof carteiraId !== "string") {
    throw new ErroNegocio("Informe a carteira utilizada no pagamento.");
  }

  await travarCartoes(db, usuarioId, [cartaoId]);
  const fatura = await carregarFatura(db, usuarioId, cartaoId, ciclo);
  if (!fatura || !fatura.fechada) {
    throw new ErroNegocio("Só é possível pagar faturas fechadas.", 409);
  }
  if (paraCentavos(fatura.restante) <= 0) {
    throw new ErroNegocio("Esta fatura não possui valor pendente.", 409);
  }
  if (centavos > paraCentavos(fatura.restante)) {
    throw new ErroNegocio(
      `O pagamento não pode exceder o valor pendente da fatura (${brl.format(fatura.restante)}).`,
      409
    );
  }

  const carteira = await db.query(
    `SELECT 1 FROM carteiras WHERE id = $1 AND usuario_id = $2`,
    [carteiraId, usuarioId]
  );
  if (carteira.rows.length === 0) throw new ErroNegocio("Carteira inválida.");

  await db.query(
    `INSERT INTO pagamentos_fatura (fatura_id, usuario_id, carteira_id, valor, data)
     VALUES ($1, $2, $3, $4, $5::date)`,
    [fatura.id, usuarioId, carteiraId, deCentavos(centavos), data]
  );
  return carregarFaturaPorId(db, fatura.id!);
}

// Estorno preserva o pagamento original: só marca estornado_em
export async function estornarPagamento(
  db: Db,
  usuarioId: string,
  cartaoId: string,
  ciclo: string,
  pagamentoId: string
): Promise<FaturaResumo> {
  await travarCartoes(db, usuarioId, [cartaoId]);
  const fatura = await carregarFatura(db, usuarioId, cartaoId, ciclo);
  if (!fatura?.id) throw new ErroNegocio("Pagamento não encontrado.", 404);

  const { rows } = await db.query(
    `UPDATE pagamentos_fatura SET estornado_em = NOW()
     WHERE id = $1 AND fatura_id = $2 AND usuario_id = $3 AND estornado_em IS NULL
     RETURNING id`,
    [pagamentoId, fatura.id, usuarioId]
  );
  if (rows.length === 0) {
    throw new ErroNegocio("Pagamento não encontrado ou já estornado.", 404);
  }
  return carregarFaturaPorId(db, fatura.id);
}

/* -------------------------- lançamentos de cartão ------------------------- */

export interface EntradaLancamento {
  descricao: string;
  valor: string | number;
  tipo: string;
  data: string;
  categoriaId: string | null;
  carteiraId: string | null;
  cartaoId: string | null;
}

function validarEntrada(e: EntradaLancamento) {
  if (e.cartaoId && e.tipo !== "despesa") {
    throw new ErroNegocio("Receitas não podem ser associadas a faturas de cartão.");
  }
  if (e.cartaoId && e.carteiraId) {
    throw new ErroNegocio("Informe o cartão ou a carteira, não os dois.");
  }
  if (!e.cartaoId && !e.carteiraId) {
    throw new ErroNegocio("O campo 'carteira_id' é obrigatório e deve ser válido.");
  }
  if (!dataValida(e.data)) throw new ErroNegocio("O campo 'data' é inválido.");
}

// Compra de cartão: valor positivo e em centavos (o banco guarda numeric sem
// limite de casas; sem isso total e pagamentos poderiam divergir)
function valorDaEntrada(e: EntradaLancamento): string | number {
  if (!e.cartaoId) return e.valor;
  const centavos = paraCentavos(e.valor);
  if (!Number.isFinite(centavos) || centavos <= 0) {
    throw new ErroNegocio("O valor da compra no cartão deve ser maior que zero.");
  }
  return deCentavos(centavos);
}

async function validarCarteira(db: Db, usuarioId: string, carteiraId: string) {
  const { rows } = await db.query(
    `SELECT 1 FROM carteiras WHERE id = $1 AND usuario_id = $2`,
    [carteiraId, usuarioId]
  );
  if (rows.length === 0) throw new ErroNegocio("O campo 'carteira_id' é inválido.");
}

// Fatura onde a compra entra; fatura quitada não recebe lançamentos
async function destinoDaCompra(
  db: Db,
  usuarioId: string,
  cartao: Cartao,
  data: string,
  mover = false
) {
  const fechamentos = await resolverFechamentos(db, cartao, primeiroDiaDoMes(data));
  const ciclo = cicloDaCompra(data, fechamentos);
  if (!ciclo) throw new ErroNegocio(SEM_CICLO, 409);
  const fatura = await garantirFatura(db, usuarioId, cartao, ciclo);
  if (quitada(fatura)) {
    throw new ErroNegocio(mover ? msgDestinoPaga(fatura) : msgPaga(fatura), 409);
  }
  return fatura;
}

// O total de uma fatura nunca pode ficar abaixo do que já foi pago
async function garantirTotalCobreOPago(db: Db, faturaId: string) {
  const f = await carregarFaturaPorId(db, faturaId);
  if (paraCentavos(f.pago) > paraCentavos(f.total)) {
    throw new ErroNegocio(
      `Esta alteração deixaria o total da fatura ${rotuloCiclo(f.ciclo)} (${brl.format(f.total)}) abaixo do total já pago (${brl.format(f.pago)}). Estorne o pagamento ou corrija o valor antes de salvar.`,
      409
    );
  }
}

const COLUNAS_LANCAMENTO =
  "id, descricao, valor, tipo, data, categoria_id, carteira_id, fatura_id, usuario_id";

export async function criarLancamento(db: Db, usuarioId: string, e: EntradaLancamento) {
  validarEntrada(e);
  const valor = valorDaEntrada(e);

  let faturaId: string | null = null;
  let aviso: string | null = null;
  if (e.cartaoId) {
    const [cartao] = await travarCartoes(db, usuarioId, [e.cartaoId]);
    const fatura = await destinoDaCompra(db, usuarioId, cartao, e.data);
    faturaId = fatura.id;
    if (fatura.fechada) aviso = msgFechada(fatura);
  } else {
    await validarCarteira(db, usuarioId, e.carteiraId!);
  }

  const { rows } = await db.query(
    `INSERT INTO lancamentos
       (descricao, valor, tipo, data, categoria_id, carteira_id, fatura_id, usuario_id, criado_em, atualizado_em)
     VALUES ($1, $2, $3, $4::date, $5, $6, $7, $8, NOW(), NOW())
     RETURNING ${COLUNAS_LANCAMENTO}, criado_em`,
    [e.descricao, valor, e.tipo, e.data, e.categoriaId, e.carteiraId, faturaId, usuarioId]
  );
  return { lancamento: rows[0], aviso };
}

// Fatura (e cartão) atual de um lançamento, sem travar
async function origemDoLancamento(db: Db, usuarioId: string, id: string) {
  const { rows } = await db.query(
    `SELECT l.fatura_id, f.cartao_id
     FROM lancamentos l LEFT JOIN faturas f ON f.id = l.fatura_id
     WHERE l.id = $1 AND l.usuario_id = $2`,
    [id, usuarioId]
  );
  if (rows.length === 0) {
    throw new ErroNegocio("Lançamento não encontrado ou não pertence ao usuário.", 404);
  }
  return {
    faturaId: rows[0].fatura_id as string | null,
    cartaoId: rows[0].cartao_id as string | null,
  };
}

// Com o cartão travado, confirma que o lançamento continua na mesma fatura e
// devolve a data atual (lida sob o lock, não a lida antes de esperar por ele)
async function confirmarOrigem(
  db: Db,
  usuarioId: string,
  id: string,
  faturaId: string | null
): Promise<{ data: string }> {
  const { rows } = await db.query(
    `SELECT fatura_id, TO_CHAR(data, ${DATA}) AS data
     FROM lancamentos WHERE id = $1 AND usuario_id = $2 FOR UPDATE`,
    [id, usuarioId]
  );
  if (rows.length === 0) {
    throw new ErroNegocio("Lançamento não encontrado ou não pertence ao usuário.", 404);
  }
  if ((rows[0].fatura_id ?? null) !== faturaId) {
    throw new ErroNegocio("O lançamento foi alterado por outra operação. Tente novamente.", 409);
  }
  return { data: rows[0].data as string };
}

export async function atualizarLancamento(
  db: Db,
  usuarioId: string,
  id: string,
  e: EntradaLancamento
) {
  validarEntrada(e);
  const valor = valorDaEntrada(e);
  const origem = await origemDoLancamento(db, usuarioId, id);

  const cartoes = [origem.cartaoId, e.cartaoId].filter((c): c is string => Boolean(c));
  const travados = cartoes.length ? await travarCartoes(db, usuarioId, cartoes) : [];
  const { data: dataAtual } = await confirmarOrigem(db, usuarioId, id, origem.faturaId);

  let aviso: string | null = null;
  if (origem.faturaId) {
    const antiga = await carregarFaturaPorId(db, origem.faturaId);
    if (quitada(antiga)) throw new ErroNegocio(msgPaga(antiga), 409);
    if (antiga.fechada) aviso = msgFechada(antiga);
  }

  // A fatura só é recalculada quando o cartão ou a data mudam; editar
  // descrição, valor ou categoria nunca move a compra
  let novaFaturaId: string | null = null;
  if (e.cartaoId) {
    if (e.cartaoId === origem.cartaoId && e.data === dataAtual) {
      novaFaturaId = origem.faturaId;
    } else {
      const cartao = travados.find((c) => c.id === e.cartaoId)!;
      const nova = await destinoDaCompra(db, usuarioId, cartao, e.data, true);
      novaFaturaId = nova.id;
      if (nova.fechada) aviso = msgFechada(nova);
    }
  } else {
    await validarCarteira(db, usuarioId, e.carteiraId!);
  }

  const { rows } = await db.query(
    `UPDATE lancamentos
     SET descricao = $1, valor = $2, tipo = $3, data = $4::date, categoria_id = $5,
         carteira_id = $6, fatura_id = $7, atualizado_em = NOW()
     WHERE id = $8 AND usuario_id = $9
     RETURNING ${COLUNAS_LANCAMENTO}, atualizado_em`,
    [e.descricao, valor, e.tipo, e.data, e.categoriaId, e.carteiraId, novaFaturaId, id, usuarioId]
  );

  for (const faturaId of new Set([origem.faturaId, novaFaturaId])) {
    if (faturaId) await garantirTotalCobreOPago(db, faturaId);
  }
  return { lancamento: rows[0], aviso };
}

export async function excluirLancamento(db: Db, usuarioId: string, id: string) {
  const origem = await origemDoLancamento(db, usuarioId, id);
  if (origem.cartaoId) await travarCartoes(db, usuarioId, [origem.cartaoId]);
  await confirmarOrigem(db, usuarioId, id, origem.faturaId);

  let aviso: string | null = null;
  if (origem.faturaId) {
    const fatura = await carregarFaturaPorId(db, origem.faturaId);
    if (quitada(fatura)) throw new ErroNegocio(msgPaga(fatura), 409);
    if (fatura.fechada) aviso = msgFechada(fatura);
  }

  await db.query(`DELETE FROM lancamentos WHERE id = $1 AND usuario_id = $2`, [id, usuarioId]);
  if (origem.faturaId) await garantirTotalCobreOPago(db, origem.faturaId);
  return { aviso };
}
