import Link from "next/link";
import packageJson from "../../package.json";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CreditCard,
  LayoutDashboard,
  LogIn,
  Receipt,
  Tags,
  UserPlus,
  Wallet,
} from "lucide-react";
import PublicShell from "@/components/layout/PublicShell";
import { Button } from "@/components/ui/button";

const RECURSOS = [
  {
    icon: Receipt,
    titulo: "Lançamentos",
    texto: "Registre receitas e despesas em segundos e acompanhe tudo por mês.",
  },
  {
    icon: Wallet,
    titulo: "Carteiras",
    texto: "Separe o dinheiro físico do digital e veja o saldo de cada carteira.",
  },
  {
    icon: CreditCard,
    titulo: "Cartões e faturas",
    texto: "Controle limites e faturas para nunca ser pego de surpresa.",
  },
  {
    icon: Tags,
    titulo: "Categorias",
    texto: "Descubra para onde o dinheiro vai com categorias do seu jeito.",
  },
];

const BARRAS = [38, 54, 46, 70, 58, 84, 76];

// Pré-visualização ilustrativa do painel (valores fictícios)
function PreviewPainel() {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden>
      <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/20 via-transparent to-brand/20 blur-2xl" />

      <div className="rounded-2xl border bg-card p-5 shadow-2xl shadow-black/10 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Saldo total</p>
            <p className="font-display text-3xl font-bold tracking-tight">
              R$ 12.480,00
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2.5 py-1 text-xs font-semibold text-brand">
            <ArrowUpRight className="size-3.5" />
            +8,2%
          </span>
        </div>

        <div className="mt-6 flex h-28 items-end gap-2">
          {BARRAS.map((h, i) => (
            <div
              key={i}
              style={{ height: `${h}%` }}
              className={
                i === BARRAS.length - 1
                  ? "flex-1 rounded-t-md bg-brand"
                  : "flex-1 rounded-t-md bg-primary/25"
              }
            />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-muted p-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowDownLeft className="size-3.5 text-brand" />
              Receitas
            </span>
            <p className="mt-1 font-semibold">R$ 6.200</p>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowUpRight className="size-3.5 text-destructive" />
              Despesas
            </span>
            <p className="mt-1 font-semibold">R$ 3.740</p>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-3 flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-xl shadow-black/10 sm:-left-8">
        <span className="grid size-9 place-items-center rounded-lg bg-primary/15 text-primary">
          <CreditCard className="size-4" />
        </span>
        <div>
          <p className="text-xs text-muted-foreground">Fatura do cartão</p>
          <p className="text-sm font-semibold">R$ 1.230 · vence dia 10</p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-6xl">
        <section className="grid items-center gap-14 py-8 lg:grid-cols-2 lg:gap-10 lg:py-16">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <LayoutDashboard className="size-3.5 text-brand" aria-hidden />
              Seu painel financeiro pessoal
            </span>

            <h1 className="mt-6 font-display text-4xl font-bold tracking-tight sm:text-6xl">
              Faça seu dinheiro render{" "}
              <span className="bg-gradient-to-r from-brand to-primary bg-clip-text text-transparent">
                mais
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg lg:mx-0">
              Concentre carteiras, cartões e lançamentos em um só lugar. Veja
              para onde seu dinheiro vai e tome decisões com clareza.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Button asChild size="lg" className="px-8">
                <Link href="/cadastro">
                  <UserPlus aria-hidden />
                  Começar agora
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="px-8">
                <Link href="/login">
                  <LogIn aria-hidden />
                  Entrar
                </Link>
              </Button>
            </div>
          </div>

          <PreviewPainel />
        </section>

        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Tudo para organizar suas finanças
            </h2>
            <p className="mt-3 text-muted-foreground">
              Ferramentas simples que trabalham juntas.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {RECURSOS.map(({ icon: Icon, titulo, texto }) => (
              <div
                key={titulo}
                className="group rounded-2xl border bg-card p-5 transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg hover:shadow-black/5"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-brand/12 text-brand transition group-hover:bg-brand group-hover:text-brand-foreground">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-display font-semibold">{titulo}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{texto}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border bg-card px-6 py-12 text-center sm:py-14">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Pronto para ter mais controle?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Crie sua conta e comece a organizar suas finanças hoje mesmo.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="px-8">
              <Link href="/cadastro">
                Criar conta
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </section>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Versão{" "}
          <span className="font-semibold text-brand">{packageJson.version}</span>
        </p>
      </div>
    </PublicShell>
  );
}
