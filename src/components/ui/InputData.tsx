"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface DateInputProps {
  value?: string;
  onChange?: (isoDate: string) => void;
  label?: string;
  error?: string;
}

export default function InputData({
  value,
  onChange,
  label,
  error,
}: DateInputProps) {
  const [dataExibida, setDataExibida] = useState(
    value ? new Date(value + "T00:00:00").toLocaleDateString("pt-BR") : ""
  );

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
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-1 text-[#E0E0E0]">
          {label}
        </label>
      )}

      <div
        className={`flex items-center justify-between bg-[#0D1117] rounded-lg border text-sm text-[#E0E0E0] transition-all duration-200 rounded-xl
          ${
            error
              ? "border-[#FF5252] ring-1 ring-[#FF5252]/40"
              : "border-gray-700 hover:border-[#2196F3]/50 focus-within:border-[#2196F3]/60 focus-within:ring-1 focus-within:ring-[#2196F3]/30"
          }`}
      >
        <input
          type="text"
          inputMode="numeric"
          maxLength={10}
          value={dataExibida}
          onChange={(e) => {
            const formatted = formatarDataDigitada(e.target.value);
            setDataExibida(formatted);
            const iso = converterParaISO(formatted);
            if (onChange && iso) onChange(iso);
          }}
          placeholder="DD/MM/AAAA"
          className="w-full bg-transparent outline-none text-[#E0E0E0] placeholder:text-[#E0E0E0] px-3 py-[9px] rounded-lg"
        />

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="p-2 pr-3 text-[#E0E0E0] hover:text-[#2196F3]/50 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10m-12 8h14a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </button>
          </PopoverTrigger>

          <PopoverContent
            className="bg-[#161B22] border border-gray-800 shadow-lg shadow-black/30 text-[#E0E0E0] rounded-2xl p-4 w-auto"
            align="start"
          >
            <Calendar
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
              className="rounded-xl border border-gray-800 bg-[#0D1117] text-white shadow-inner"
            />
          </PopoverContent>
        </Popover>
      </div>

      {error && <p className="text-[#FF5252] text-xs mt-1">{error}</p>}
    </div>
  );
}
