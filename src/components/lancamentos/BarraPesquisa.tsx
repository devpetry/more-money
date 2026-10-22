"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface BarraPesquisaProps {
  termo: string;
  setTermo: (valor: string) => void;
}

export default function BarraPesquisa({ termo, setTermo }: BarraPesquisaProps) {
  return (
    <div className="relative w-full lg:max-w-sm">
      <label htmlFor="pesquisa" className="sr-only">
        Pesquisar lançamentos por descrição
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        id="pesquisa"
        type="text"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        placeholder="Buscar descrição"
        className="h-10 pl-10"
      />
    </div>
  );
}
