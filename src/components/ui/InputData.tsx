"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { ptBR } from "react-day-picker/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { fieldClasses } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DateInputProps {
  value?: string;
  onChange?: (isoDate: string) => void;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export default function InputData({
  value,
  onChange,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: DateInputProps) {
  const [dataExibida, setDataExibida] = useState(
    value ? new Date(value + "T00:00:00").toLocaleDateString("pt-BR") : ""
  );
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  );

  // Dentro de um <dialog> modal, o calendário precisa ser renderizado nele
  useEffect(() => {
    setPortalContainer(wrapperRef.current?.closest("dialog") ?? null);
  }, []);

  function formatarDataDigitada(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    if (digits.length <= 8)
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    return digits;
  }

  function converterParaISO(value: string) {
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return "";
    const [, dia, mes, ano] = match;
    return `${ano}-${mes}-${dia}`;
  }

  return (
    <div
      ref={wrapperRef}
      aria-invalid={ariaInvalid}
      className={cn(
        fieldClasses,
        "flex h-11 items-center justify-between focus-within:border-ring focus-within:ring-1 focus-within:ring-ring"
      )}
    >
      <input
        id={id}
        type="text"
        inputMode="numeric"
        maxLength={10}
        value={dataExibida}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        onChange={(e) => {
          const formatted = formatarDataDigitada(e.target.value);
          setDataExibida(formatted);
          const iso = converterParaISO(formatted);
          if (onChange && iso) onChange(iso);
        }}
        placeholder="DD/MM/AAAA"
        className="h-full w-full rounded-lg bg-transparent px-3.5 tabular-nums outline-none placeholder:text-muted-foreground"
      />

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Escolher data no calendário"
            className="mr-1 grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <CalendarDays aria-hidden className="size-4" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          container={portalContainer}
          className="w-auto p-2"
          align="end"
        >
          <Calendar
            className="bg-transparent"
            locale={ptBR}
            mode="single"
            selected={value ? new Date(value + "T00:00:00") : undefined}
            onSelect={(selectedDate) => {
              if (selectedDate) {
                const iso = `${selectedDate.getFullYear()}-${String(
                  selectedDate.getMonth() + 1
                ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(
                  2,
                  "0"
                )}`;
                const br = selectedDate.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                });
                setDataExibida(br);
                if (onChange) onChange(iso);
              }
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
