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
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Plus,
  TrendingDown,
} from "lucide-react";
import FiltroMes from "./dashboard/FiltroMes";
import ModalLancamento from "./ModalLancamento";

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

export default function Dashboard() {
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
    <>
      <div className="p-6 bg-[#0D1117] min-h-screen text-[#E0E0E0]">
        <FiltroMes
          mesSelecionado={mesSelecionado}
          setMesSelecionado={setMesSelecionado}
          carregarDashboard={carregarDashboard}
          mesAplicado={mesAplicado}
          setMesAplicado={setMesAplicado}
          setPeriodoPersonalizado={setPeriodoPersonalizado}
        />

        <p className="mb-6 text-sm text-gray-500">
          {periodoPersonalizado
            ? `Período em exibição: ${new Date(
                `${periodoPersonalizado.inicio}T00:00:00`
              ).toLocaleDateString("pt-BR")} até ${new Date(
                `${periodoPersonalizado.fim}T00:00:00`
              ).toLocaleDateString("pt-BR")}`
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
              : `Período em exibição: ${new Date().getFullYear()}`}
        </p>

        <button
          onClick={() => setIsModalLancamentoOpen(true)}
          className="fixed bottom-5 right-5 flex items-center gap-2 bg-[#2196F3] text-[#0D1117] font-medium py-2 px-4 rounded-xl shadow-md hover:bg-[#2196F3]/80 transition"
        >
          <Plus size={16} className="text-[#0D1117]" />
          {isModalLancamentoOpen ? "Adicionando..." : "Novo Lançamento"}
        </button>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#161B22] p-5 rounded-2xl shadow-md border border-gray-800">
            <div className="flex justify-between items-center">
              <h3 className="text-sm text-gray-400">Saldo</h3>
              {dados.saldo >= 0 ? (
                <TrendingUp className="text-[#00E676]" />
              ) : (
                <TrendingDown className="text-[#FF5252]" />
              )}
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

        {/* Despesas e Receitas por Categoria */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Despesas por Categoria */}
          <div className="bg-[#161B22] p-5 rounded-2xl shadow-md border border-gray-800">
            <h2 className="text-lg font-medium mb-4">Despesas por Categoria</h2>
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-sm">
                  <th className="pb-2">Categoria</th>
                  <th className="pb-2 text-center">Nº de Lançamentos</th>
                  <th className="pb-2 w-[25%] text-right">Valor Total</th>
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
                        <td className="py-2 text-center">
                          {item.quantidade ?? "-"}
                        </td>
                        <td className="py-2 text-right">
                          R$ {Number(item.total).toFixed(2)}
                        </td>
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

          {/* Receitas por Categoria */}
          <div className="bg-[#161B22] p-5 rounded-2xl shadow-md border border-gray-800">
            <h2 className="text-lg font-medium mb-4">Receitas por Categoria</h2>
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-sm">
                  <th className="pb-2">Categoria</th>
                  <th className="pb-2 text-center">Nº de Lançamentos</th>
                  <th className="pb-2 w-[25%] text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {dados.receitasPorCategoria.length > 0 ? (
                  dados.receitasPorCategoria.map(
                    (item: ReceitaCategoria, index: number) => (
                      <tr
                        key={index}
                        className="border-b border-gray-800 hover:bg-[#0D1117] transition"
                      >
                        <td className="py-2 capitalize">{item.categoria}</td>
                        <td className="py-2 text-center">
                          {item.quantidade ?? "-"}
                        </td>
                        <td className="py-2 text-right">
                          R$ {Number(item.total).toFixed(2)}
                        </td>
                      </tr>
                    )
                  )
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="text-center py-4 text-gray-500 text-sm"
                    >
                      Nenhuma receita encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Últimos Lançamentos */}
        <div className="bg-[#161B22] p-5 rounded-2xl shadow-md border border-gray-800">
          <h2 className="text-lg font-medium mb-4">Últimos Lançamentos</h2>
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400 text-sm">
                <th className="pb-2">Descrição</th>
                <th className="pb-2">Tipo</th>
                <th className="pb-2">Valor</th>
                <th className="pb-2">Lançamento</th>
                <th className="pb-2 w-[10%]">Pagamento</th>
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
                      <td className="py-2">
                        R$ {Number(lanc.valor).toFixed(2)}
                      </td>
                      <td className="py-2">
                        {new Date(lanc.criado_em).toLocaleDateString("pt-BR")}
                      </td>
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
