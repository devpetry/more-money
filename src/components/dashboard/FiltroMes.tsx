"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter } from "lucide-react";

interface FiltroMesProps {
  mesSelecionado?: Date;
  setMesSelecionado: (data?: Date) => void;
  carregarDashboard: (filtro?: string) => void;
  mesAplicado?: Date | undefined;
  setMesAplicado: (data?: Date) => void;
  setPeriodoPersonalizado?: (periodo?: { inicio: string; fim: string }) => void;
}

export default function FiltroMes({
  mesSelecionado,
  setMesSelecionado,
  carregarDashboard,
  mesAplicado,
  setMesAplicado,
  setPeriodoPersonalizado,
}: FiltroMesProps) {
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState<"mes" | "periodo">("mes");

  const [periodoSelecionado, setPeriodoSelecionado] = useState<{
    inicio?: string;
    fim?: string;
  }>({});
  const [periodoAplicado, setPeriodoAplicado] = useState<{
    inicio?: string;
    fim?: string;
  }>({});

  const estaFiltrando =
    !!mesAplicado || (!!periodoAplicado.inicio && !!periodoAplicado.fim);

  const aplicarFiltro = () => {
    if (tipoFiltro === "mes" && mesSelecionado) {
      setMesAplicado(mesSelecionado);
      carregarDashboard(format(mesSelecionado, "yyyy-MM"));
      setPeriodoPersonalizado?.(undefined);
      setPeriodoAplicado({});
    } else if (
      tipoFiltro === "periodo" &&
      periodoSelecionado.inicio &&
      periodoSelecionado.fim
    ) {
      carregarDashboard(
        `${periodoSelecionado.inicio}|${periodoSelecionado.fim}`
      );
      setMesAplicado(undefined);
      setPeriodoPersonalizado?.({
        inicio: periodoSelecionado.inicio,
        fim: periodoSelecionado.fim,
      });
      setPeriodoAplicado(periodoSelecionado);
    }
    setFiltroAberto(false);
  };

  const limparFiltro = () => {
    setMesSelecionado(undefined);
    setMesAplicado(undefined);
    setPeriodoSelecionado({});
    setPeriodoAplicado({});
    setPeriodoPersonalizado?.(undefined);
    carregarDashboard();
    setFiltroAberto(false);
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-semibold border-b border-gray-700">
        Dashboard
      </h1>

      <Popover open={filtroAberto} onOpenChange={setFiltroAberto}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`rounded-xl px-4 h-10 flex items-center gap-2 transition-all duration-200 border ${
              estaFiltrando
                ? "bg-[#FFC107] text-[#0D1117] border-[#FFC107] hover:bg-[#e0ac05] hover:border-[#e0ac05] hover:text-[#0D1117]"
                : "bg-[#0D1117] border-gray-700 text-[#E0E0E0] hover:border-[#2196F3]/40"
            }`}
          >
            <Filter className="h-4 w-4" />
            {estaFiltrando ? "Filtrando" : "Filtrar"}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="bg-[#161B22] border border-gray-800 shadow-lg shadow-black/30 text-[#E0E0E0] rounded-2xl p-5 w-[300px] space-y-4 transition-all duration-200"
          align="end"
        >
          {/* Tipo de filtro */}
          <div className="flex gap-3 justify-center">
            <button
              className={`rounded-xl px-3 py-1 border text-sm transition-all ${
                tipoFiltro === "mes"
                  ? "bg-[#0D1117] border-[#2196F3] text-[#E0E0E0]"
                  : "bg-[#0D1117] border-gray-700 text-gray-400 hover:border-[#2196F3]/40 hover:text-[#E0E0E0]"
              }`}
              onClick={() => setTipoFiltro("mes")}
            >
              Mês/Ano
            </button>
            <button
              className={`rounded-xl px-3 py-1 border text-sm transition-all ${
                tipoFiltro === "periodo"
                  ? "bg-[#0D1117] border-[#2196F3] text-[#E0E0E0]"
                  : "bg-[#0D1117] border-gray-700 text-gray-400 hover:border-[#2196F3]/40 hover:text-[#E0E0E0]"
              }`}
              onClick={() => setTipoFiltro("periodo")}
            >
              Personalizado
            </button>
          </div>

          {/* Filtro condicional */}
          {tipoFiltro === "mes" ? (
            <div className="flex flex-col gap-3">
              {/* Seleção de mês */}
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
                    setMesSelecionado(new Date(ano, parseInt(valor), 1));
                  }}
                  className="bg-[#0D1117] border border-gray-700 rounded-xl p-2 text-sm text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#2196F3] hover:border-[#2196F3]/40 transition-all"
                >
                  <option value="" disabled>
                    Selecione o mês
                  </option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>
                      {format(new Date(2025, i, 1), "MMMM", { locale: ptBR })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seleção de ano */}
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
                    setMesSelecionado(new Date(parseInt(valor), mes, 1));
                  }}
                  className="bg-[#0D1117] border border-gray-700 rounded-xl p-2 text-sm text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#2196F3] hover:border-[#2196F3]/40 transition-all"
                >
                  <option value="" disabled>
                    Selecione o ano
                  </option>
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
          ) : (
            <div className="flex flex-col gap-3">
              {/* Data início */}
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-400">Data de início</label>
                <input
                  type="date"
                  value={periodoSelecionado.inicio || ""}
                  onChange={(e) =>
                    setPeriodoSelecionado({
                      ...periodoSelecionado,
                      inicio: e.target.value,
                    })
                  }
                  className="bg-[#0D1117] border border-gray-700 rounded-xl p-2 text-sm text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#2196F3] hover:border-[#2196F3]/40 transition-all"
                />
              </div>

              {/* Data fim */}
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-400">Data de fim</label>
                <input
                  type="date"
                  value={periodoSelecionado.fim || ""}
                  onChange={(e) =>
                    setPeriodoSelecionado({
                      ...periodoSelecionado,
                      fim: e.target.value,
                    })
                  }
                  className="bg-[#0D1117] border border-gray-700 rounded-xl p-2 text-sm text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#2196F3] hover:border-[#2196F3]/40 transition-all"
                />
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-between pt-2">
            <Button
              onClick={aplicarFiltro}
              disabled={
                (tipoFiltro === "mes" && !mesSelecionado) ||
                (tipoFiltro === "periodo" &&
                  (!periodoSelecionado.inicio || !periodoSelecionado.fim))
              }
              className="font-semibold rounded-xl px-4 py-2 bg-[#0D1117] hover:bg-[#0D1117] border border-gray-700 text-[#E0E0E0] hover:border-[#2196F3]/40 transition-all disabled:text-gray-500 disabled:border-gray-800 disabled:cursor-not-allowed"
            >
              Aplicar
            </Button>
            <Button
              onClick={limparFiltro}
              className="rounded-xl px-4 py-2 bg-[#0D1117] hover:bg-[#0D1117] border border-gray-700 text-[#E0E0E0] hover:border-[#2196F3]/40 transition-all"
            >
              Limpar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
