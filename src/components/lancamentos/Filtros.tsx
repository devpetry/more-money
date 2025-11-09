"use client";

import { useEffect, useState } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

interface Categoria {
  id: number;
  nome: string;
  tipo: "receita" | "despesa";
}

interface FiltrosProps {
  tipo?: string;
  categoria?: string;
  setTipo: (valor?: string) => void;
  setCategoria: (valor?: string) => void;
  aplicarFiltros: () => void;
  limparFiltros: () => void;
}

export default function Filtros({
  tipo,
  categoria,
  setTipo,
  setCategoria,
  aplicarFiltros,
  limparFiltros,
}: FiltrosProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [filtrosAtivos, setFiltrosAtivos] = useState(false);
  const [tipoTemp, setTipoTemp] = useState<string | undefined>(tipo);
  const [categoriaTemp, setCategoriaTemp] = useState<string | undefined>(
    categoria
  );

  useEffect(() => {
    if (filtroAberto) {
      setTipoTemp(tipo);
      setCategoriaTemp(categoria);
    }
  }, [filtroAberto, tipo, categoria]);

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch("/api/auth/categorias", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setCategorias(data || []);
        }
      } catch (e) {
        console.error("Erro ao buscar categorias:", e);
      }
    }
    carregar();
  }, []);

  return (
    <Popover open={filtroAberto} onOpenChange={setFiltroAberto}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`rounded-xl px-4 py-2 flex items-center transition-all duration-200 border ${
            filtrosAtivos
              ? "bg-[#FFC107] text-[#0D1117] border-[#FFC107] hover:bg-[#e0ac05] hover:border-[#e0ac05] hover:text-[#0D1117]"
              : "bg-[#0D1117] border-gray-700 text-[#E0E0E0] hover:bg-[#1c2330] hover:border-[#2196F3]/40"
          }`}
        >
          <Filter
            className={`h-4 w-4 mr-2 transition-colors ${
              filtrosAtivos ? "text-[#0D1117]" : "text-gray-300"
            }`}
          />
          {filtrosAtivos ? "Filtrando" : "Filtrar"}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="bg-[#161B22] border border-gray-800 shadow-lg shadow-black/30 text-[#E0E0E0] rounded-2xl p-5 w-[280px] space-y-4 transition-all duration-200"
      >
        <div className="flex flex-col gap-3">
          {/* Tipo */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-400">Tipo</label>
            <select
              value={tipoTemp ?? ""}
              onChange={(e) => {
                const value = e.target.value || undefined;
                setTipoTemp(value);
                setCategoriaTemp(undefined);
              }}
              className="bg-[#0D1117] border border-gray-700 rounded-xl p-2 text-sm text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#2196F3] transition-all"
            >
              <option value="" disabled>
                Todos
              </option>
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
          </div>

          {/* Categoria */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-400">Categoria</label>

            <select
              value={categoriaTemp ?? ""}
              onChange={(e) => setCategoriaTemp(e.target.value || undefined)}
              className="bg-[#0D1117] border border-gray-700 rounded-xl p-2 text-sm text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#2196F3] transition-all"
            >
              <option value="" disabled>
                Todas
              </option>

              {categorias
                .filter((c) => !tipoTemp || c.tipo === tipoTemp)
                .map((cat) => (
                  <option key={cat.id} value={cat.nome}>
                    {cat.nome}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!tipoTemp && !categoriaTemp}
            className={`font-semibold rounded-xl px-4 py-2 transition-all duration-200 border-none ${
              tipoTemp || categoriaTemp
                ? "bg-[#161B22] hover:bg-[#2196F3] hover:text-[#161B22]"
                : "bg-[#0D1117] text-gray-500 cursor-not-allowed"
            }`}
            onClick={() => {
              setTipo(tipoTemp);
              setCategoria(categoriaTemp);

              aplicarFiltros();
              setFiltrosAtivos(Boolean(tipoTemp || categoriaTemp));
              setFiltroAberto(false);
            }}
          >
            Aplicar
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="bg-[#161B22] hover:bg-[#FF5252] text-[#FF5252] hover:text-[#161B22] rounded-xl px-4 py-2 transition-all duration-200"
            onClick={() => {
              limparFiltros();
              setFiltrosAtivos(false);
              setFiltroAberto(false);
            }}
          >
            Limpar filtros
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
