import * as React from "react";
import { Filter } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

// Gatilho dos filtros: destaque em âmbar quando há filtro aplicado
export const FilterButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & { ativo: boolean }
>(({ ativo, className, ...props }, ref) => (
  <Button
    ref={ref}
    variant="outline"
    className={cn(
      ativo &&
        "border-warning bg-warning text-warning-foreground hover:bg-warning/85 hover:text-warning-foreground",
      className
    )}
    {...props}
  >
    <Filter aria-hidden />
    {ativo ? "Filtrando" : "Filtrar"}
  </Button>
));
FilterButton.displayName = "FilterButton";
