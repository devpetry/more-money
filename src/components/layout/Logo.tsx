import { TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Marca provisória. A logo temporária (public/images/logo-temporaria.png)
 * tem fundo transparente e texto escuro, ilegível no tema escuro; aqui ela é
 * reproduzida em texto com os tokens de tema. Quando houver a marca
 * definitiva, basta substituir este componente.
 */
export default function Logo({
  className,
  size = "md",
}: {
  className?: string;
  size?: "md" | "lg";
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className={cn(
          "grid place-items-center rounded-lg bg-brand text-brand-foreground shadow-sm",
          size === "lg" ? "size-10" : "size-8"
        )}
      >
        <TrendingUp className={size === "lg" ? "size-5" : "size-4"} strokeWidth={2.5} />
      </span>
      <span
        className={cn(
          "font-display font-bold tracking-tight",
          size === "lg" ? "text-2xl" : "text-lg"
        )}
      >
        <span className="sr-only">More Money</span>
        <span aria-hidden>
          <span className="text-brand">More</span>
          <span className="text-foreground">Money</span>
        </span>
      </span>
    </span>
  );
}
