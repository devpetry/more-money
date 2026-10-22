import Link from "next/link";
import packageJson from "../../package.json";
import { LogIn } from "lucide-react";
import PublicShell from "@/components/layout/PublicShell";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <PublicShell>
      <div className="mx-auto flex max-w-3xl flex-col items-center py-10 text-center sm:py-16">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
          Bem-vindo ao <span className="text-brand">More Money</span>
        </h1>

        <p className="mt-6 text-xl font-medium sm:text-2xl">
          Organize suas finanças com facilidade.
        </p>

        <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Controle seus gastos, defina metas e alcance a liberdade financeira.
        </p>

        <Button asChild size="lg" className="mt-10 px-8">
          <Link href="/login">
            <LogIn aria-hidden />
            Entrar
          </Link>
        </Button>

        <p className="mt-8 text-sm text-muted-foreground">
          Versão{" "}
          <span className="font-semibold text-brand">{packageJson.version}</span>
        </p>
      </div>
    </PublicShell>
  );
}
