import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import PublicShell, { AuthCard } from "@/components/layout/PublicShell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Acesso negado" };

export default function UnauthorizedPage() {
  return (
    <PublicShell>
      <AuthCard
        title="Acesso negado"
        description="Apenas administradores podem acessar esta página."
        icon={
          <span className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert aria-hidden className="size-6" />
          </span>
        }
      >
        <Button asChild size="lg" className="w-full">
          <Link href="/dashboard">Voltar ao dashboard</Link>
        </Button>
      </AuthCard>
    </PublicShell>
  );
}
