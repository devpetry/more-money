"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";

interface EvolucaoMensal {
  mes: string;
  receita: number;
  despesa: number;
}

interface DespesaCategoria {
  categoria: string;
  total: number;
  [key: string]: string | number;
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

  useEffect(() => {
    carregarDashboard();
  }, []);

  async function carregarDashboard() {
    try {
      const res = await fetch("/api/auth/dashboard");
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

  const COLORS = ["#00E676", "#2196F3", "#FFC107", "#FF5252", "#9C27B0"];

  return (
    <div className="p-6 bg-[#0D1117] min-h-screen text-[#E0E0E0]">
      <h1 className="text-2xl font-semibold mb-6 border-b border-gray-700 pb-2">
        Dashboard
      </h1>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#161B22] p-5 rounded-2xl shadow-md border border-gray-800">
          <div className="flex justify-between items-center">
            <h3 className="text-sm text-gray-400">Saldo Atual</h3>
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
            <h3 className="text-sm text-gray-400">Receitas (mês)</h3>
            <ArrowUpRight className="text-[#2196F3]" />
          </div>
          <p className="text-2xl font-bold mt-2 text-[#2196F3]">
            R$ {dados.totalReceitas.toFixed(2)}
          </p>
        </div>

        <div className="bg-[#161B22] p-5 rounded-2xl shadow-md border border-gray-800">
          <div className="flex justify-between items-center">
            <h3 className="text-sm text-gray-400">Despesas (mês)</h3>
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

      {/* Gráfico de pizza: Despesas por Categoria */}
      <div className="bg-[#161B22] p-5 rounded-2xl shadow-md border border-gray-800 mb-8">
        <h2 className="text-lg font-medium mb-4">Despesas por Categoria</h2>
        <div className="flex justify-center">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dados.despesasPorCategoria as DespesaCategoria[]}
                dataKey="total"
                nameKey="categoria"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ percent, index }) =>
                  typeof index === "number" && dados.despesasPorCategoria[index]
                    ? `${dados.despesasPorCategoria[index].categoria} ${((Number(percent) || 0) * 100).toFixed(0)}%`
                    : ""
                }
              >
                {dados.despesasPorCategoria.map(
                  (_: DespesaCategoria, index: number) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  )
                )}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#161B22",
                  border: "1px solid #333",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
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
