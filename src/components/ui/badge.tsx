import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
  {
    variants: {
      variant: {
        neutral: "border-border bg-muted text-muted-foreground",
        success: "border-success/25 bg-success/10 text-success",
        destructive: "border-destructive/25 bg-destructive/10 text-destructive",
        primary: "border-primary/30 bg-primary/10 text-foreground",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

// Receita/despesa com a mesma cor em todas as telas
function TipoBadge({ tipo }: { tipo: string }) {
  const variant =
    tipo === "receita" ? "success" : tipo === "despesa" ? "destructive" : "neutral";
  return (
    <Badge variant={variant}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {tipo}
    </Badge>
  );
}

export { Badge, TipoBadge, badgeVariants };
