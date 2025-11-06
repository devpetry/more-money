"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Filter } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

interface Lancamento {
  descricao: string;
  tipo: "receita" | "despesa";
  valor: number;
  data: string;
}

interface DashboardData {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  evolucaoMensal: EvolucaoMensal[];
  despesasPorCategoria: DespesaCategoria[];
  ultimosLancamentos: Lancamento[];
}

export default function Dashboard() {
  const [dados, setDados] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const [mesSelecionado, setMesSelecionado] = useState<Date | undefined>(
    undefined
  );
  const [filtroAberto, setFiltroAberto] = useState(false);

  useEffect(() => {
    carregarDashboard();
  }, []);

  async function carregarDashboard(mes?: string) {
    try {
      const url = mes
        ? `/api/auth/dashboard?mes=${mes}`
        : "/api/auth/dashboard";
      const res = await fetch(url);
      const data: DashboardData = await res.json();
      setDados(data);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading)
    return (
      <div className="text-center text-[#E0E0E0] mt-10">
        Carregando dados...
      </div>
    );

  if (!dados)
    return (
      <div className="text-center text-[#FF5252] mt-10">
        Erro ao carregar o dashboard.
      </div>
    );

  return (
    <div className="p-6 bg-[#0D1117] min-h-screen text-[#E0E0E0]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold border-b border-gray-700 pb-2">
          Dashboard
        </h1>

        <Popover open={filtroAberto} onOpenChange={setFiltroAberto}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="bg-[#161B22] border border-gray-700 text-[#E0E0E0] hover:bg-[#1C2128] rounded-xl px-4 py-2 flex items-center transition-all duration-200"
            >
              <Filter className="h-4 w-4 mr-2 text-gray-300" />
              {mesSelecionado
                ? format(mesSelecionado, "MMMM yyyy", { locale: ptBR })
                : "Filtrar mês"}
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className="bg-[#161B22] border border-gray-800 shadow-lg shadow-black/30 text-[#E0E0E0] rounded-2xl p-5 w-[280px] space-y-4 transition-all duration-200"
            align="end"
          >
            <div className="flex flex-col gap-3">
              {/* Select de Mês */}
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-400">Mês</label>
                <select
                  value={mesSelecionado ? mesSelecionado.getMonth() : ""}
                  onChange={(e) => {
                    const valor = e.target.value;
                    if (valor === "") return;
                    const ano = mesSelecionado
                      ? mesSelecionado.getFullYear()
                      : new Date().getFullYear();
                    const novoMes = new Date(ano, parseInt(valor), 1);
                    setMesSelecionado(novoMes);
                  }}
                  className="bg-[#0D1117] border border-gray-700 rounded-xl p-2 text-sm text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#2196F3] transition-all"
                >
                  <option value="">Selecione o mês</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>
                      {format(new Date(2025, i, 1), "MMMM", { locale: ptBR })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select de Ano */}
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-400">Ano</label>
                <select
                  value={mesSelecionado ? mesSelecionado.getFullYear() : ""}
                  onChange={(e) => {
                    const valor = e.target.value;
                    if (valor === "") return;
                    const mes = mesSelecionado
                      ? mesSelecionado.getMonth()
                      : new Date().getMonth();
                    const novoAno = new Date(parseInt(valor), mes, 1);
                    setMesSelecionado(novoAno);
                  }}
                  className="bg-[#0D1117] border border-gray-700 rounded-xl p-2 text-sm text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#2196F3] transition-all"
                >
                  <option value="">Selecione o ano</option>
                  {Array.from({ length: 11 }, (_, i) => {
                    const ano = 2020 + i;
                    return (
                      <option key={ano} value={ano}>
                        {ano}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!mesSelecionado}
                className={`font-semibold rounded-xl px-4 py-2 transition-all duration-200 border-none ${
                  mesSelecionado
                    ? "bg-[#161B22] hover:bg-[#2196F3] hover:text-[#161B22]"
                    : "bg-[#0D1117] text-gray-500 cursor-not-allowed"
                }`}
                onClick={() => {
                  if (!mesSelecionado) return;
                  setFiltroAberto(false);
                  const mes = format(mesSelecionado, "yyyy-MM");
                  carregarDashboard(mes);
                }}
              >
                Aplicar
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="bg-[#161B22] hover:bg-[#FF5252] text-[#FF5252] hover:text-[#161B22] rounded-xl px-4 py-2 transition-all duration-200"
                onClick={() => {
                  setMesSelecionado(undefined);
                  setFiltroAberto(false);
                  carregarDashboard();
                }}
              >
                Limpar filtro
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#161B22] p-5 rounded-2xl shadow-md border border-gray-800">
          <div className="flex justify-between items-center">
            <h3 className="text-sm text-gray-400">Saldo</h3>
            <TrendingUp className="text-[#00E676]" />
          </div>
          <p
            className={`text-2xl font-bold mt-2 ${
              dados.saldo >= 0 ? "text-[#00E676]" : "text-[#FF5252]"
            }`}
          >
            R$ {dados.saldo.toFixed(2)}
          </p>
        </div>

        <div className="bg-[#161B22] p-5 rounded-2xl shadow-md border border-gray-800">
          <div className="flex justify-between items-center">
            <h3 className="text-sm text-gray-400">Receitas</h3>
            <ArrowUpRight className="text-[#2196F3]" />
          </div>
          <p className="text-2xl font-bold mt-2 text-[#2196F3]">
            R$ {dados.totalReceitas.toFixed(2)}
          </p>
        </div>

        <div className="bg-[#161B22] p-5 rounded-2xl shadow-md border border-gray-800">
          <div className="flex justify-between items-center">
            <h3 className="text-sm text-gray-400">Despesas</h3>
            <ArrowDownRight className="text-[#FF5252]" />
          </div>
          <p className="text-2xl font-bold mt-2 text-[#FF5252]">
            R$ {dados.totalDespesas.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Gráfico de linha: Evolução Mensal */}
      <div className="bg-[#161B22] p-5 rounded-2xl shadow-md border border-gray-800 mb-8">
        <h2 className="text-lg font-medium mb-4">Evolução Mensal</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dados.evolucaoMensal}>
            <XAxis dataKey="mes" stroke="#E0E0E0" />
            <YAxis stroke="#E0E0E0" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#161B22",
                border: "1px solid #333",
              }}
            />
            <Line
              type="monotone"
              dataKey="receita"
              stroke="#2196F3"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="despesa"
              stroke="#FF5252"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Despesas por Categoria */}
      <div className="bg-[#161B22] p-5 rounded-2xl shadow-md border border-gray-800 mb-8">
        <h2 className="text-lg font-medium mb-4">Despesas por Categoria</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400 text-sm">
              <th className="pb-2">Categoria</th>
              <th className="pb-2">Nº de Lançamentos</th>
              <th className="pb-2">Valor Total</th>
            </tr>
          </thead>
          <tbody>
            {dados.despesasPorCategoria.length > 0 ? (
              dados.despesasPorCategoria.map(
                (item: DespesaCategoria, index: number) => (
                  <tr
                    key={index}
                    className="border-b border-gray-800 hover:bg-[#0D1117] transition"
                  >
                    <td className="py-2 capitalize">{item.categoria}</td>
                    <td className="py-2">{item.quantidade ?? "-"}</td>
                    <td className="py-2">R$ {Number(item.total).toFixed(2)}</td>
                  </tr>
                )
              )
            ) : (
              <tr>
                <td
                  colSpan={3}
                  className="text-center py-4 text-gray-500 text-sm"
                >
                  Nenhuma despesa encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Últimos Lançamentos */}
      <div className="bg-[#161B22] p-5 rounded-2xl shadow-md border border-gray-800">
        <h2 className="text-lg font-medium mb-4">Últimos Lançamentos</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400 text-sm">
              <th className="pb-2">Descrição</th>
              <th className="pb-2">Tipo</th>
              <th className="pb-2">Valor</th>
              <th className="pb-2">Data</th>
            </tr>
          </thead>
          <tbody>
            {dados.ultimosLancamentos.length > 0 ? (
              dados.ultimosLancamentos.map(
                (lanc: Lancamento, index: number) => (
                  <tr
                    key={index}
                    className="border-b border-gray-800 hover:bg-[#0D1117]"
                  >
                    <td className="py-2">{lanc.descricao}</td>
                    <td
                      className={`py-2 capitalize ${
                        lanc.tipo === "receita"
                          ? "text-[#2196F3]"
                          : "text-[#FF5252]"
                      }`}
                    >
                      {lanc.tipo}
                    </td>
                    <td className="py-2">R$ {Number(lanc.valor).toFixed(2)}</td>
                    <td className="py-2">
                      {new Date(lanc.data).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                )
              )
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="text-center py-4 text-gray-500 text-sm"
                >
                  Nenhum lançamento encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
