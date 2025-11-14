"use client";

import { Search } from "lucide-react";

interface BarraPesquisaProps {
  termo: string;
  setTermo: (valor: string) => void;
}

export default function BarraPesquisa({ termo, setTermo }: BarraPesquisaProps) {
  return (
    <div className="flex w-full sm:w-1/3">
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

        <input
          id="pesquisa"
          type="text"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Digite uma descrição..."
          className="w-full pl-10 pr-4 h-10 bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none border transition-all duration-200 border-gray-700 hover:border-[#2196F3]/50 focus:border-[#2196F3]/60 focus:ring-1 focus:ring-[#2196F3]/30 placeholder:text-gray-500"
        />
      </div>
    </div>
  );
}
