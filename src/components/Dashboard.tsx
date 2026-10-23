"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarRange,
  ChartNoAxesCombined,
  PiggyBank,
  Plus,
  ReceiptText,
  TrendingDown,
  Wallet,
} from "lucide-react";
import SeletorPeriodo from "./lancamentos/SeletorPeriodo";
import {
  descreverVisualizacao,
  intervaloDaVisualizacao,
  visualizacaoAnoAtual,
  type Visualizacao,
} from "@/lib/lancamentos-periodo";
import ModalLancamento from "./ModalLancamento";
import { formatDate } from "@/lib/date";
import { formatCurrency, formatCurrencyCompact } from "@/lib/currency";
import { cn } from "@/lib/utils";
import PageHeader from "./layout/PageHeader";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { EmptyState, InlineAlert, LoadingState, Skeleton } from "./ui/feedback";

interface EvolucaoMensal {
  mes: string;
  receita: number;
  despesa: number;
}

interface CategoriaResumo {
  categoria: string;
  total: number;
  quantidade: number;
}

interface Lancamento {
  descricao: string;
  tipo: "receita" | "despesa";
  valor: number;
  data: string;
  criado_em: string;
}

interface DashboardData {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  carteiras: { id: string; nome: string; saldo: number }[];
  evolucaoMensal: EvolucaoMensal[];
  despesasPorCategoria: CategoriaResumo[];
  receitasPorCategoria: CategoriaResumo[];
  ultimosLancamentos: Lancamento[];
}

const SERIES = [
  { key: "receita", label: "Receitas", color: "hsl(var(--success))" },
  { key: "despesa", label: "Despesas", color: "hsl(var(--destructive))" },
] as const;

// Quantas categorias aparecem antes de agrupar o restante em "Outras"
const CATEGORIAS_VISIVEIS = 5;

const num = (v: unknown) => Number(v) || 0;

export default function Dashboard({ nomeUsuario }: { nomeUsuario: string }) {
  const [dados, setDados] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalLancamentoOpen, setIsModalLancamentoOpen] = useState(false);
  const [visualizacao, setVisualizacao] =
    useState<Visualizacao>(visualizacaoAnoAtual);

  useEffect(() => {
    carregarDashboard(visualizacao);
  }, [visualizacao]);

  async function carregarDashboard(v: Visualizacao) {
    try {
      const { inicio, fim } = intervaloDaVisualizacao(v);
      const params = new URLSearchParams();
      if (!inicio && !fim) params.set("tudo", "1");
      if (inicio) params.set("inicio", inicio);
      if (fim) params.set("fim", fim);
      const res = await fetch(`/api/dashboard?${params}`);
      const data: DashboardData = await res.json();
      setDados(data);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  const periodoEmExibicao = `Período em exibição: ${descreverVisualizacao(visualizacao)}`;

  return (
    <>
      <PageHeader
        title={`Olá, ${nomeUsuario}`}
        description="Acompanhe suas receitas, despesas e saldo."
        actions={
          <>
            <SeletorPeriodo
              visualizacao={visualizacao}
              onChange={setVisualizacao}
            />
            <Button onClick={() => setIsModalLancamentoOpen(true)}>
              <Plus aria-hidden />
              Novo Lançamento
            </Button>
          </>
        }
      />

      {loading ? (
        <LoadingState label="Carregando dados...">
          <div className="grid gap-4 lg:grid-cols-12">
            <Skeleton className="h-56 rounded-2xl lg:col-span-6" />
            <Skeleton className="h-56 rounded-2xl lg:col-span-3" />
            <Skeleton className="h-56 rounded-2xl lg:col-span-3" />
            <Skeleton className="h-80 rounded-2xl lg:col-span-8" />
            <Skeleton className="h-80 rounded-2xl lg:col-span-4" />
          </div>
        </LoadingState>
      ) : !dados ? (
        <InlineAlert tone="error">Erro ao carregar o dashboard.</InlineAlert>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground sm:text-sm">
            <CalendarRange aria-hidden className="size-4" />
            {periodoEmExibicao}
          </p>

          {/* Resumo: saldo, receitas e despesas */}
          <section
            aria-label="Resumo do período"
            className="grid gap-4 lg:grid-cols-12"
          >
            <CartaoSaldo
              saldo={num(dados.saldo)}
              receitas={num(dados.totalReceitas)}
              despesas={num(dados.totalDespesas)}
              carteiras={dados.carteiras ?? []}
              className="lg:col-span-6"
            />
            <CartaoFluxo
              tipo="receita"
              valor={num(dados.totalReceitas)}
              total={num(dados.totalReceitas) + num(dados.totalDespesas)}
              className="lg:col-span-3"
            />
            <CartaoFluxo
              tipo="despesa"
              valor={num(dados.totalDespesas)}
              total={num(dados.totalReceitas) + num(dados.totalDespesas)}
              className="lg:col-span-3"
            />
          </section>

          {/* Evolução e destino das despesas */}
          <section className="grid gap-4 sm:gap-6 lg:grid-cols-12">
            <Card className="lg:col-span-8">
              <CardHeader>
                <div>
                  <CardTitle>Evolução mensal</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Quanto entrou e quanto saiu em cada mês
                  </p>
                </div>
                <ul className="flex items-center gap-4 text-xs text-muted-foreground">
                  {SERIES.map((serie) => (
                    <li key={serie.key} className="flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className="size-2.5 rounded-sm"
                        style={{ backgroundColor: serie.color }}
                      />
                      {serie.label}
                    </li>
                  ))}
                </ul>
              </CardHeader>
              <CardContent className="pl-1 pt-4 sm:pl-2">
                {(dados.evolucaoMensal ?? []).length > 0 ? (
                  <div className="h-64 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dados.evolucaoMensal.map((m) => ({
                          ...m,
                          receita: num(m.receita),
                          despesa: num(m.despesa),
                        }))}
                        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                        barGap={4}
                        barCategoryGap="28%"
                      >
                        <CartesianGrid
                          vertical={false}
                          strokeDasharray="4 4"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="mes"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={10}
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        />
                        <YAxis
                          width={76}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={formatCurrencyCompact}
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        />
                        <Tooltip
                          cursor={{ fill: "hsl(var(--muted))", opacity: 0.6 }}
                          content={<TooltipEvolucao />}
                        />
                        {SERIES.map((serie) => (
                          <Bar
                            key={serie.key}
                            dataKey={serie.key}
                            fill={serie.color}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={28}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState
                    icon={ChartNoAxesCombined}
                    title="Sem dados para o período."
                  />
                )}
              </CardContent>
            </Card>

            <RankingCategorias
              titulo="Para onde foi o dinheiro"
              subtitulo="Despesas por categoria"
              itens={dados.despesasPorCategoria ?? []}
              tom="destructive"
              vazio="Nenhuma despesa no período."
              className="lg:col-span-4"
            />
          </section>

          {/* Atividade recente e origem das receitas */}
          <section className="grid gap-4 sm:gap-6 lg:grid-cols-12">
            <Card className="lg:col-span-7">
              <CardHeader>
                <div>
                  <CardTitle>Últimos lançamentos</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    As cinco movimentações mais recentes
                  </p>
                </div>
                <Link
                  href="/lista-lancamentos"
                  className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Ver todos
                  <ArrowRight aria-hidden className="size-4" />
                </Link>
              </CardHeader>
              <CardContent className="pt-3">
                {(dados.ultimosLancamentos ?? []).length > 0 ? (
                  <ul className="divide-y">
                    {dados.ultimosLancamentos.map((l, i) => (
                      <LinhaLancamento key={i} lancamento={l} />
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    icon={ReceiptText}
                    title="Nenhum lançamento encontrado."
                    className="py-6"
                  />
                )}
              </CardContent>
            </Card>

            <RankingCategorias
              titulo="De onde vem o dinheiro"
              subtitulo="Receitas por categoria"
              itens={dados.receitasPorCategoria ?? []}
              tom="success"
              vazio="Nenhuma receita no período."
              className="lg:col-span-5"
            />
          </section>
        </div>
      )}

      <ModalLancamento
        isOpen={isModalLancamentoOpen}
        onClose={() => setIsModalLancamentoOpen(false)}
        onSuccess={() => carregarDashboard(visualizacao)}
        mode="create"
        lancamentoId={null}
      />
    </>
  );
}

/** Saldo total em destaque, com a taxa de economia e o saldo de cada carteira. */
function CartaoSaldo({
  saldo,
  receitas,
  despesas,
  carteiras,
  className,
}: {
  saldo: number;
  receitas: number;
  despesas: number;
  carteiras: { id: string; nome: string; saldo: number }[];
  className?: string;
}) {
  const positivo = saldo >= 0;
  const economia = receitas > 0 ? Math.round(((receitas - despesas) / receitas) * 100) : null;
  const somaAbs = carteiras.reduce((s, c) => s + Math.abs(num(c.saldo)), 0);

  return (
    <Card
      className={cn(
        "flex flex-col gap-6 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-5 sm:p-6",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-muted-foreground">Saldo total</h2>
          <p
            className={cn(
              "mt-2 break-words font-display text-4xl font-bold tracking-tight tabular-nums sm:text-5xl",
              positivo ? "text-foreground" : "text-destructive"
            )}
          >
            {formatCurrency(saldo)}
          </p>
        </div>
        {economia !== null && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
              economia >= 0
                ? "border-success/25 bg-success/10 text-success"
                : "border-destructive/25 bg-destructive/10 text-destructive"
            )}
            title="Parte das receitas que sobrou no período"
          >
            {economia >= 0 ? (
              <PiggyBank aria-hidden className="size-3.5" />
            ) : (
              <TrendingDown aria-hidden className="size-3.5" />
            )}
            {economia >= 0 ? `Sobrou ${economia}%` : `Faltou ${Math.abs(economia)}%`}
          </span>
        )}
      </div>

      {carteiras.length > 0 && (
        <div className="mt-auto">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Por carteira
          </h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {carteiras.map((c) => {
              const valor = num(c.saldo);
              const parte = somaAbs > 0 ? (Math.abs(valor) / somaAbs) * 100 : 0;
              return (
                <li key={c.id} className="rounded-xl border bg-card/70 p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Wallet aria-hidden className="size-4 shrink-0" />
                    <span className="truncate">{c.nome}</span>
                  </div>
                  <p
                    className={cn(
                      "mt-1 font-display text-lg font-semibold tabular-nums",
                      valor < 0 && "text-destructive"
                    )}
                  >
                    {formatCurrency(valor)}
                  </p>
                  <div
                    aria-hidden
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className={cn(
                        "h-full rounded-full",
                        valor < 0 ? "bg-destructive" : "bg-primary"
                      )}
                      style={{ width: `${parte}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}

/** Receitas ou despesas do período, com a fatia do total movimentado. */
function CartaoFluxo({
  tipo,
  valor,
  total,
  className,
}: {
  tipo: "receita" | "despesa";
  valor: number;
  total: number;
  className?: string;
}) {
  const receita = tipo === "receita";
  const Icone = receita ? ArrowDownLeft : ArrowUpRight;
  const parte = total > 0 ? Math.round((valor / total) * 100) : 0;

  return (
    <Card className={cn("flex flex-col justify-between gap-6 p-5 sm:p-6", className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          {receita ? "Receitas" : "Despesas"}
        </h2>
        <span
          aria-hidden
          className={cn(
            "grid size-9 place-items-center rounded-lg",
            receita ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}
        >
          <Icone className="size-[18px]" />
        </span>
      </div>
      <div>
        <p
          className={cn(
            "break-words font-display text-2xl font-bold tracking-tight tabular-nums sm:text-3xl",
            receita ? "text-success" : "text-destructive"
          )}
        >
          {formatCurrency(valor)}
        </p>
        <div
          aria-hidden
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <div
            className={cn("h-full rounded-full", receita ? "bg-success" : "bg-destructive")}
            style={{ width: `${parte}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {total > 0
            ? `${parte}% de tudo que foi movimentado`
            : "Sem movimentações no período"}
        </p>
      </div>
    </Card>
  );
}

/** Categorias ordenadas por valor, com barra proporcional e participação. */
function RankingCategorias({
  titulo,
  subtitulo,
  itens,
  tom,
  vazio,
  className,
}: {
  titulo: string;
  subtitulo: string;
  itens: CategoriaResumo[];
  tom: "success" | "destructive";
  vazio: string;
  className?: string;
}) {
  const ordenados = itens
    .map((i) => ({ ...i, total: num(i.total), quantidade: num(i.quantidade) }))
    .sort((a, b) => b.total - a.total);
  const soma = ordenados.reduce((s, i) => s + i.total, 0);

  const principais = ordenados.slice(0, CATEGORIAS_VISIVEIS);
  const resto = ordenados.slice(CATEGORIAS_VISIVEIS);
  const linhas =
    resto.length > 0
      ? [
          ...principais,
          {
            categoria: `Outras (${resto.length})`,
            total: resto.reduce((s, i) => s + i.total, 0),
            quantidade: resto.reduce((s, i) => s + i.quantidade, 0),
          },
        ]
      : principais;
  const maior = linhas.reduce((m, i) => Math.max(m, i.total), 0);

  return (
    <Card className={className}>
      <CardHeader>
        <div>
          <CardTitle>{titulo}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{subtitulo}</p>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {linhas.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">{vazio}</p>
        ) : (
          <ul className="space-y-4">
            {linhas.map((item) => {
              const parte = soma > 0 ? Math.round((item.total / soma) * 100) : 0;
              return (
                <li key={item.categoria}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium capitalize">
                      {item.categoria}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                  <div
                    aria-hidden
                    className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className={cn(
                        "h-full rounded-full",
                        tom === "success" ? "bg-success" : "bg-destructive"
                      )}
                      style={{ width: `${maior > 0 ? (item.total / maior) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                    {parte}% · {item.quantidade}{" "}
                    {item.quantidade === 1 ? "lançamento" : "lançamentos"}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function LinhaLancamento({ lancamento: l }: { lancamento: Lancamento }) {
  const receita = l.tipo === "receita";
  const Icone = receita ? ArrowDownLeft : ArrowUpRight;
  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span
        aria-hidden
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl",
          receita ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
        )}
      >
        <Icone className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{l.descricao}</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {receita ? "Receita" : "Despesa"} · {formatDate(l.data)}
        </p>
      </div>
      <p
        className={cn(
          "shrink-0 font-semibold tabular-nums",
          receita ? "text-success" : "text-destructive"
        )}
      >
        {receita ? "+" : "−"} {formatCurrency(num(l.valor))}
      </p>
    </li>
  );
}

function TooltipEvolucao({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: readonly { dataKey?: string | number; value?: number | string }[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <ul className="space-y-1">
        {SERIES.map((serie) => {
          const item = payload.find((p) => p.dataKey === serie.key);
          if (!item) return null;
          return (
            <li key={serie.key} className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-2.5 rounded-sm"
                style={{ backgroundColor: serie.color }}
              />
              <span className="text-muted-foreground">{serie.label}</span>
              <span className="ml-auto pl-4 font-semibold tabular-nums">
                {formatCurrency(num(item.value))}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
