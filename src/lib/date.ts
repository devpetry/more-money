import { parseISO, format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

// Interpreta "YYYY-MM-DD" sem timezone (date puro)
export function parseDateOnly(dateString: string | null | undefined) {
  if (!dateString) return null;

  // Se já for um timestamp ISO
  if (dateString.includes("T")) {
    const parsed = parseISO(dateString);
    return isValid(parsed) ? parsed : null;
  }

  // Garantir que está no formato YYYY-MM-DD
  const iso = `${dateString}T00:00:00`;
  const parsed = parseISO(iso);

  return isValid(parsed) ? parsed : null;
}

// Formata "YYYY-MM-DD" → "dd/MM/yyyy"
export function formatDate(dateString: string | null | undefined) {
  const d = parseDateOnly(dateString);
  if (!d) return ""; // retorno seguro
  return format(d, "dd/MM/yyyy", { locale: ptBR });
}

// Formata timestamp ISO (created_at)
export function formatTimestamp(isoString: string | null | undefined) {
  if (!isoString) return "";
  const d = parseISO(isoString);
  if (!isValid(d)) return "";
  return format(d, "dd/MM/yyyy", { locale: ptBR });
}
