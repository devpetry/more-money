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
  carregarDashboard: (mes?: string) => void;
}

export default function FiltroMes({
  mesSelecionado,
  setMesSelecionado,
  carregarDashboard,
}: FiltroMesProps) {
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [mesAplicado, setMesAplicado] = useState<Date | undefined>(undefined);

  const estaFiltrando = !!mesAplicado;

  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-semibold border-b border-gray-700 pb-2">
        Dashboard
      </h1>

      <Popover open={filtroAberto} onOpenChange={setFiltroAberto}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`rounded-xl px-4 py-2 flex items-center transition-all duration-200 border ${
              estaFiltrando
                ? "bg-[#FFC107] text-[#0D1117] border-[#FFC107] hover:bg-[#e0ac05] hover:border-[#e0ac05] hover:text-[#0D1117]"
                : "bg-[#0D1117] border-gray-700 text-[#E0E0E0] hover:bg-[#1c2330] hover:border-[#2196F3]/40"
            }`}
          >
            <Filter
              className={`h-4 w-4 mr-2 transition-colors ${
                estaFiltrando
                  ? "text-[#0D1117] hover:text-[#0D1117] focus:text-[#0D1117]"
                  : "text-gray-300"
              }`}
            />
            {mesAplicado
              ? format(mesAplicado, "MMMM yyyy", { locale: ptBR })
              : "Filtrar"}
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
                <option value="" disabled>Selecione o mês</option>
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
                <option value="" disabled>Selecione o ano</option>
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
                setMesAplicado(mesSelecionado);
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
                setMesAplicado(undefined);
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
  );
}
