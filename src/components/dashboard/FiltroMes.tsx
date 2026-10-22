"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { FilterButton } from "@/components/ui/filter-button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
    <Popover open={filtroAberto} onOpenChange={setFiltroAberto}>
      <PopoverTrigger asChild>
        <FilterButton ativo={estaFiltrando} />
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[min(19rem,calc(100vw-2rem))]">
        <p className="mb-3 font-display text-sm font-semibold">
          Filtrar período
        </p>

        {/* Tipo de filtro */}
        <div
          role="group"
          aria-label="Tipo de filtro"
          className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
        >
          {(
            [
              ["mes", "Mês/Ano"],
              ["periodo", "Personalizado"],
            ] as const
          ).map(([valor, rotulo]) => (
            <button
              key={valor}
              type="button"
              aria-pressed={tipoFiltro === valor}
              onClick={() => setTipoFiltro(valor)}
              className={cn(
                "h-9 rounded-md text-sm font-medium transition-colors",
                tipoFiltro === valor
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {rotulo}
            </button>
          ))}
        </div>

        {/* Filtro condicional */}
        {tipoFiltro === "mes" ? (
          <div className="flex flex-col gap-4">
            <Field id="filtro-mes" label="Mês">
              <NativeSelect
                value={mesSelecionado ? mesSelecionado.getMonth() : ""}
                onChange={(e) => {
                  const valor = e.target.value;
                  if (valor === "") return;
                  const ano = mesSelecionado
                    ? mesSelecionado.getFullYear()
                    : new Date().getFullYear();
                  setMesSelecionado(new Date(ano, parseInt(valor), 1));
                }}
                className="h-10 capitalize"
              >
                <option value="" disabled>
                  Selecione o mês
                </option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {format(new Date(2025, i, 1), "MMMM", { locale: ptBR })}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field id="filtro-ano" label="Ano">
              <NativeSelect
                value={mesSelecionado ? mesSelecionado.getFullYear() : ""}
                onChange={(e) => {
                  const valor = e.target.value;
                  if (valor === "") return;
                  const mes = mesSelecionado
                    ? mesSelecionado.getMonth()
                    : new Date().getMonth();
                  setMesSelecionado(new Date(parseInt(valor), mes, 1));
                }}
                className="h-10"
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
              </NativeSelect>
            </Field>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Field id="filtro-inicio" label="Data de início">
              <Input
                type="date"
                value={periodoSelecionado.inicio || ""}
                onChange={(e) =>
                  setPeriodoSelecionado({
                    ...periodoSelecionado,
                    inicio: e.target.value,
                  })
                }
                className="h-10"
              />
            </Field>

            <Field id="filtro-fim" label="Data de fim">
              <Input
                type="date"
                value={periodoSelecionado.fim || ""}
                onChange={(e) =>
                  setPeriodoSelecionado({
                    ...periodoSelecionado,
                    fim: e.target.value,
                  })
                }
                className="h-10"
              />
            </Field>
          </div>
        )}

        {/* Botões */}
        <div className="mt-5 flex justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={limparFiltro}>
            Limpar
          </Button>
          <Button
            size="sm"
            onClick={aplicarFiltro}
            disabled={
              (tipoFiltro === "mes" && !mesSelecionado) ||
              (tipoFiltro === "periodo" &&
                (!periodoSelecionado.inicio || !periodoSelecionado.fim))
            }
          >
            Aplicar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
