"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  CalendarRange,
  ChartNoAxesCombined,
  Plus,
  ReceiptText,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import FiltroMes from "./dashboard/FiltroMes";
import ModalLancamento from "./ModalLancamento";
import { formatDate, formatTimestamp } from "@/lib/date";
import { formatCurrency, formatCurrencyCompact } from "@/lib/currency";
import { cn } from "@/lib/utils";
import PageHeader from "./layout/PageHeader";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { TipoBadge } from "./ui/badge";
import { DataTable } from "./ui/data-table";
import { EmptyState, InlineAlert, LoadingState, Skeleton } from "./ui/feedback";

interface EvolucaoMensal {
  mes: string;
  receita: number;
  despesa: number;
}

interface DespesaCategoria {
  categoria: string;
  total: number;
  quantidade: number;
}

interface ReceitaCategoria {
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
  evolucaoMensal: EvolucaoMensal[];
  despesasPorCategoria: DespesaCategoria[];
  receitasPorCategoria: ReceitaCategoria[];
  ultimosLancamentos: Lancamento[];
}

type CategoriaResumo = DespesaCategoria | ReceitaCategoria;

const SERIES = [
  { key: "receita", label: "Receitas", color: "hsl(var(--success))" },
  { key: "despesa", label: "Despesas", color: "hsl(var(--destructive))" },
] as const;

export default function Dashboard({ nomeUsuario }: { nomeUsuario: string }) {
  const [dados, setDados] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalLancamentoOpen, setIsModalLancamentoOpen] = useState(false);
  const [mesAplicado, setMesAplicado] = useState<Date | undefined>(undefined);
  const [periodoPersonalizado, setPeriodoPersonalizado] = useState<
    { inicio: string; fim: string } | undefined
  >();
  const [mesSelecionado, setMesSelecionado] = useState<Date | undefined>(
    undefined
  );

  useEffect(() => {
    carregarDashboard();
  }, []);

  async function carregarDashboard(mes?: string) {
    try {
      const url = mes
        ? `/api/dashboard?mes=${mes}`
        : "/api/dashboard";
      const res = await fetch(url);
      const data: DashboardData = await res.json();
      setDados(data);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  const periodoEmExibicao = periodoPersonalizado
    ? `Período em exibição: ${formatDate(periodoPersonalizado.inicio)} até ${formatDate(periodoPersonalizado.fim)}`
    : mesAplicado
      ? (() => {
          const ano = mesAplicado.getFullYear();
          const mes = mesAplicado.getMonth();
          const inicio = new Date(ano, mes, 1);
          const fim = new Date(ano, mes + 1, 0);
          const formatar = (d: Date) =>
            d.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
            });
          return `Período em exibição: ${formatar(inicio)} até ${formatar(fim)}`;
        })()
      : `Período em exibição: ${new Date().getFullYear()}`;

  return (
    <>
      <PageHeader
        title={`Olá, ${nomeUsuario}`}
        description="Acompanhe suas receitas, despesas e saldo."
        actions={
          <>
            <FiltroMes
              mesSelecionado={mesSelecionado}
              setMesSelecionado={setMesSelecionado}
              carregarDashboard={carregarDashboard}
              mesAplicado={mesAplicado}
              setMesAplicado={setMesAplicado}
              setPeriodoPersonalizado={setPeriodoPersonalizado}
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-80 rounded-2xl" />
          </div>
        </LoadingState>
      ) : !dados ? (
        <InlineAlert tone="error">Erro ao carregar o dashboard.</InlineAlert>
      ) : (
        <div className="space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground sm:text-sm">
            <CalendarRange aria-hidden className="size-4" />
            {periodoEmExibicao}
          </p>

          {/* Indicadores */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Indicador
              titulo="Saldo"
              valor={dados.saldo}
              icone={dados.saldo >= 0 ? TrendingUp : TrendingDown}
              tom={dados.saldo >= 0 ? "success" : "destructive"}
              destaque
            />
            <Indicador
              titulo="Receitas"
              valor={dados.totalReceitas}
              icone={ArrowUpRight}
              tom="success"
            />
            <Indicador
              titulo="Despesas"
              valor={dados.totalDespesas}
              icone={ArrowDownRight}
              tom="destructive"
            />
          </div>

          {/* Gráfico de Evolução */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução Mensal</CardTitle>
              <ul className="flex items-center gap-4 text-xs text-muted-foreground">
                {SERIES.map((serie) => (
                  <li key={serie.key} className="flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: serie.color }}
                    />
                    {serie.label}
                  </li>
                ))}
              </ul>
            </CardHeader>
            <CardContent className="pl-1 sm:pl-2">
              {(dados.evolucaoMensal ?? []).length > 0 ? (
                <div className="h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dados.evolucaoMensal}
                      margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
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
                        cursor={{ stroke: "hsl(var(--border))" }}
                        formatter={(value, name) => [
                          formatCurrency(Number(value)),
                          name === "receita" ? "Receitas" : "Despesas",
                        ]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.75rem",
                          color: "hsl(var(--popover-foreground))",
                          fontSize: 13,
                        }}
                        labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                      />
                      {SERIES.map((serie) => (
                        <Line
                          key={serie.key}
                          type="monotone"
                          dataKey={serie.key}
                          stroke={serie.color}
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: serie.color, strokeWidth: 0 }}
                          activeDot={{ r: 5, strokeWidth: 0 }}
                        />
                      ))}
                    </LineChart>
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

          {/* Categorias */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TabelaCategorias
              titulo="Despesas por Categoria"
              itens={dados.despesasPorCategoria ?? []}
              vazio="Nenhuma despesa encontrada."
            />
            <TabelaCategorias
              titulo="Receitas por Categoria"
              itens={dados.receitasPorCategoria ?? []}
              vazio="Nenhuma receita encontrada."
            />
          </div>

          {/* Últimos Lançamentos */}
          <Card>
            <CardHeader>
              <CardTitle>Últimos Lançamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={dados.ultimosLancamentos ?? []}
                caption="Últimos lançamentos"
                rowKey={(_, index) => index}
                columns={[
                  {
                    key: "descricao",
                    header: "Descrição",
                    cell: (l) => <span className="font-medium">{l.descricao}</span>,
                    hideOnCard: true,
                  },
                  {
                    key: "tipo",
                    header: "Tipo",
                    cell: (l) => <TipoBadge tipo={l.tipo} />,
                  },
                  {
                    key: "valor",
                    header: "Valor",
                    cell: (l) => (
                      <span className="whitespace-nowrap tabular-nums">
                        {formatCurrency(l.valor)}
                      </span>
                    ),
                    align: "right",
                    hideOnCard: true,
                  },
                  {
                    key: "lancamento",
                    header: "Lançamento",
                    cell: (l) => (
                      <span className="tabular-nums">{formatTimestamp(l.criado_em)}</span>
                    ),
                    className: "whitespace-nowrap",
                  },
                  {
                    key: "pagamento",
                    header: "Pagamento",
                    cell: (l) => <span className="tabular-nums">{formatDate(l.data)}</span>,
                    className: "whitespace-nowrap",
                  },
                ]}
                cardTitle={(l) => l.descricao}
                cardAside={(l) => (
                  <span className="whitespace-nowrap font-semibold tabular-nums">
                    {formatCurrency(l.valor)}
                  </span>
                )}
                empty={
                  <EmptyState
                    icon={ReceiptText}
                    title="Nenhum lançamento encontrado."
                    className="py-6"
                  />
                }
              />
            </CardContent>
          </Card>
        </div>
      )}

      <ModalLancamento
        isOpen={isModalLancamentoOpen}
        onClose={() => setIsModalLancamentoOpen(false)}
        onSuccess={() => carregarDashboard()}
        mode="create"
        lancamentoId={null}
      />
    </>
  );
}

function Indicador({
  titulo,
  valor,
  icone: Icone,
  tom,
  destaque = false,
}: {
  titulo: string;
  valor: number;
  icone: React.ComponentType<{ className?: string }>;
  tom: "success" | "destructive";
  destaque?: boolean;
}) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden p-5 sm:p-6",
        destaque &&
          "border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card"
      )}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">{titulo}</h2>
        <span
          aria-hidden
          className={cn(
            "grid size-9 place-items-center rounded-lg",
            tom === "success"
              ? "bg-success/10 text-success"
              : "bg-destructive/10 text-destructive"
          )}
        >
          <Icone className="size-[18px]" />
        </span>
      </div>
      <p
        className={cn(
          "mt-3 font-display text-2xl font-bold tracking-tight tabular-nums sm:text-[1.75rem]",
          tom === "success" ? "text-success" : "text-destructive"
        )}
      >
        {formatCurrency(valor)}
      </p>
    </Card>
  );
}

function TabelaCategorias({
  titulo,
  itens,
  vazio,
}: {
  titulo: string;
  itens: CategoriaResumo[];
  vazio: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          data={itens}
          caption={titulo}
          rowKey={(_, index) => index}
          columns={[
            {
              key: "categoria",
              header: "Categoria",
              cell: (item) => <span className="capitalize">{item.categoria}</span>,
              hideOnCard: true,
            },
            {
              key: "quantidade",
              header: "Nº de Lançamentos",
              cell: (item) => <span className="tabular-nums">{item.quantidade}</span>,
              align: "center",
              className: "whitespace-nowrap",
            },
            {
              key: "total",
              header: "Valor Total",
              cell: (item) => (
                <span className="whitespace-nowrap font-medium tabular-nums">
                  {formatCurrency(item.total)}
                </span>
              ),
              align: "right",
              hideOnCard: true,
            },
          ]}
          cardTitle={(item) => <span className="capitalize">{item.categoria}</span>}
          cardAside={(item) => (
            <span className="whitespace-nowrap font-semibold tabular-nums">
              {formatCurrency(item.total)}
            </span>
          )}
          empty={<p className="py-4 text-sm text-muted-foreground">{vazio}</p>}
        />
      </CardContent>
    </Card>
  );
}
