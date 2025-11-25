"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

dayjs.locale("pt-br");

export default function PaginacaoMensal({
  mesAtual,
  onChange,
}: {
  mesAtual: string;
  onChange: (value: string) => void;
}) {
  const data = dayjs(mesAtual);

  function voltarMes() {
    onChange(data.subtract(1, "month").format("YYYY-MM"));
  }

  function avancarMes() {
    onChange(data.add(1, "month").format("YYYY-MM"));
  }

  return (
    <div className="flex items-center justify-center gap-2 select-none px-2">
      {/* Botão voltar */}
      <button
        onClick={voltarMes}
        className="bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none border transition-all duration-200 border-gray-700 hover:border-[#2196F3]/50 focus:border-[#2196F3]/60 focus:ring-1 focus:ring-[#2196F3]/30 placeholder:text-gray-500"
      >
        <ChevronLeft/>
      </button>

      {/* Texto do mês */}
      <span className="text-sm font-semibold text-center">
        {data.format("MMMM[ de ]YYYY").replace(/^(.)/, (m) => m.toUpperCase())}
      </span>

      {/* Botão avançar */}
      <button
        onClick={avancarMes}
        className="bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none border transition-all duration-200 border-gray-700 hover:border-[#2196F3]/50 focus:border-[#2196F3]/60 focus:ring-1 focus:ring-[#2196F3]/30 placeholder:text-gray-500"
      >
        <ChevronRight/>
      </button>
    </div>
  );
}
