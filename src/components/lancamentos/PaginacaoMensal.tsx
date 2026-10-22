"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { Button } from "@/components/ui/button";

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
    <div className="flex select-none items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        onClick={voltarMes}
        aria-label="Mês anterior"
        className="touch-target"
      >
        <ChevronLeft aria-hidden />
      </Button>

      <span
        aria-live="polite"
        className="min-w-[9.5rem] text-center text-sm font-semibold tabular-nums"
      >
        {data.format("MMMM[ de ]YYYY").replace(/^(.)/, (m) => m.toUpperCase())}
      </span>

      <Button
        variant="outline"
        size="icon"
        onClick={avancarMes}
        aria-label="Próximo mês"
        className="touch-target"
      >
        <ChevronRight aria-hidden />
      </Button>
    </div>
  );
}
