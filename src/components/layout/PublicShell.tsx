import Link from "next/link";

import { Card } from "@/components/ui/card";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

// Moldura das páginas sem autenticação (início, acesso e erros)
export default function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex min-h-dvh flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[radial-gradient(56rem_32rem_at_50%_-8rem,hsl(var(--primary)/0.14),transparent_70%),radial-gradient(36rem_28rem_at_100%_100%,hsl(var(--brand)/0.08),transparent_70%)]"
      />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 sm:py-6">
        <Link href="/" className="rounded-lg">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16 pt-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}

export function AuthCard({
  title,
  description,
  icon,
  children,
  footer,
}: {
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-md">
      <Card className="p-6 shadow-xl shadow-black/5 sm:p-8">
        <div className="mb-6 space-y-2 text-center">
          {icon && <div className="mb-4 flex justify-center">{icon}</div>}
          <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {children}
      </Card>
      {footer && (
        <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
      )}
    </div>
  );
}
