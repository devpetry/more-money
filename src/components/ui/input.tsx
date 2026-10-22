import * as React from "react"

import { cn } from "@/lib/utils"

// Compartilhado com NativeSelect e InputData para manter campos idênticos.
// Texto de 16px abaixo de lg evita o zoom automático do iOS.
export const fieldClasses =
  "w-full rounded-lg border border-input bg-background text-base text-foreground shadow-sm transition-colors placeholder:text-muted-foreground hover:border-ring focus-visible:border-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-destructive/25 lg:text-sm"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(fieldClasses, "h-11 px-3.5", className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
