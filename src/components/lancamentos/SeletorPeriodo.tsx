"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import {
  trocarModo,
  type ModoVisualizacao,
  type Visualizacao,
} from "@/lib/lancamentos-periodo";
import PaginacaoMensal from "./PaginacaoMensal";

const MODOS: [ModoVisualizacao, string][] = [
  ["mes", "Mês"],
  ["ano", "Ano"],
  ["tudo", "Tudo"],
  ["periodo", "Personalizado"],
];

export default function SeletorPeriodo({
  visualizacao,
  onChange,
}: {
  visualizacao: Visualizacao;
  onChange: (v: Visualizacao) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <NativeSelect
        aria-label="Modo de visualização"
        value={visualizacao.modo}
        onChange={(e) =>
          onChange(trocarModo(visualizacao, e.target.value as ModoVisualizacao))
        }
        className="h-10 w-auto"
      >
        {MODOS.map(([valor, rotulo]) => (
          <option key={valor} value={valor}>
            {rotulo}
          </option>
        ))}
      </NativeSelect>

      {visualizacao.modo === "mes" && (
        <PaginacaoMensal
          mesAtual={visualizacao.mes}
          onChange={(mes) => onChange({ modo: "mes", mes })}
        />
      )}

      {visualizacao.modo === "ano" && (
        <div className="flex select-none items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              onChange({ modo: "ano", ano: visualizacao.ano - 1 })
            }
            aria-label="Ano anterior"
            className="touch-target"
          >
            <ChevronLeft aria-hidden />
          </Button>
          <span
            aria-live="polite"
            className="min-w-[5rem] text-center text-sm font-semibold tabular-nums"
          >
            {visualizacao.ano}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              onChange({ modo: "ano", ano: visualizacao.ano + 1 })
            }
            aria-label="Próximo ano"
            className="touch-target"
          >
            <ChevronRight aria-hidden />
          </Button>
        </div>
      )}

      {visualizacao.modo === "periodo" && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            aria-label="Data de início"
            value={visualizacao.inicio}
            max={visualizacao.fim || undefined}
            onChange={(e) =>
              onChange({ ...visualizacao, inicio: e.target.value })
            }
            className="h-10 w-auto"
          />
          <span className="text-sm text-muted-foreground">até</span>
          <Input
            type="date"
            aria-label="Data de fim"
            value={visualizacao.fim}
            min={visualizacao.inicio || undefined}
            onChange={(e) => onChange({ ...visualizacao, fim: e.target.value })}
            className="h-10 w-auto"
          />
        </div>
      )}
    </div>
  );
}
