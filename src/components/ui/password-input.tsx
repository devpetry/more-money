"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

// Campo de senha com botão de mostrar/ocultar
const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<"input">, "type">
>(({ className, ...props }, ref) => {
  const [visivel, setVisivel] = React.useState(false);

  return (
    <div className="relative">
      <Input
        ref={ref}
        type={visivel ? "text" : "password"}
        className={cn("pr-12", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisivel((prev) => !prev)}
        aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
        className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        {visivel ? (
          <EyeOff aria-hidden className="size-[18px]" />
        ) : (
          <Eye aria-hidden className="size-[18px]" />
        )}
      </button>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
