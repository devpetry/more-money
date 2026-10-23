"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FilterButton } from "@/components/ui/filter-button";
import { Field } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

interface Categoria {
  id: string;
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
        const res = await fetch("/api/categorias", { cache: "no-store" });
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
        <FilterButton ativo={filtrosAtivos} />
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[min(18rem,calc(100vw-2rem))]">
        <p className="mb-4 font-display text-sm font-semibold">
          Filtrar lançamentos
        </p>

        <div className="flex flex-col gap-4">
          <Field id="filtro-tipo" label="Tipo">
            <NativeSelect
              value={tipoTemp ?? ""}
              onChange={(e) => {
                const value = e.target.value || undefined;
                setTipoTemp(value);
                setCategoriaTemp(undefined);
              }}
              className="h-10"
            >
              <option value="" disabled>
                Todos
              </option>
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </NativeSelect>
          </Field>

          <Field id="filtro-categoria" label="Categoria">
            <NativeSelect
              value={categoriaTemp ?? ""}
              onChange={(e) => setCategoriaTemp(e.target.value || undefined)}
              className="h-10"
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
            </NativeSelect>
          </Field>
        </div>

        <div className="mt-5 flex justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              limparFiltros();
              setFiltrosAtivos(false);
              setFiltroAberto(false);
            }}
          >
            Limpar filtros
          </Button>

          <Button
            size="sm"
            disabled={!tipoTemp && !categoriaTemp}
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
        </div>
      </PopoverContent>
    </Popover>
  );
}
