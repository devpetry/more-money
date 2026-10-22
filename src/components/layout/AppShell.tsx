"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartNoAxesCombined,
  CircleDollarSign,
  Menu,
  Tag,
  Users,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useNativeDialog } from "@/components/ui/dialog";
import LogoutButton from "@/components/LogoutButton";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

export interface ShellUser {
  nome: string;
  email: string;
  tipo: string;
}

const NAV_PRINCIPAL = [
  { href: "/dashboard", label: "Dashboard", icon: ChartNoAxesCombined },
  { href: "/lista-lancamentos", label: "Lançamentos", icon: CircleDollarSign },
  { href: "/lista-categorias", label: "Categorias", icon: Tag },
];

// Visível apenas para ADMIN (a página também valida o papel no servidor)
const NAV_ADMIN = [{ href: "/lista-usuarios", label: "Usuários", icon: Users }];

export default function AppShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  const [menuAberto, setMenuAberto] = useState(false);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const conteudoRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useNativeDialog(drawerRef, menuAberto, () => setMenuAberto(false));
  useRecuperarFoco(conteudoRef);

  // Fecha a gaveta ao navegar e ao alcançar o layout com sidebar fixa
  useEffect(() => setMenuAberto(false), [pathname]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => e.matches && setMenuAberto(false);
    desktop.addEventListener("change", handler);
    return () => desktop.removeEventListener("change", handler);
  }, []);

  return (
    <div className="min-h-dvh">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Pular para o conteúdo
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card lg:block">
        <SidebarContent user={user} pathname={pathname} />
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/85 px-2 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMenuAberto(true)}
          aria-label="Abrir menu"
          aria-expanded={menuAberto}
          aria-controls="menu-navegacao"
          className="grid size-11 place-items-center rounded-lg text-foreground transition-colors hover:bg-accent"
        >
          <Menu aria-hidden className="size-5" />
        </button>
        <Link href="/dashboard" className="rounded-lg">
          <Logo />
        </Link>
        <ThemeToggle className="ml-auto" />
      </header>

      <dialog
        id="menu-navegacao"
        ref={drawerRef}
        aria-label="Menu de navegação"
        onClick={(e) => e.target === e.currentTarget && setMenuAberto(false)}
        className="m-0 h-dvh max-h-dvh w-72 max-w-[85vw] border-r bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm open:animate-in open:slide-in-from-left lg:hidden"
      >
        {menuAberto && (
          <SidebarContent
            user={user}
            pathname={pathname}
            onNavigate={() => setMenuAberto(false)}
          />
        )}
      </dialog>

      <div className="lg:pl-64">
        <main
          ref={conteudoRef}
          id="conteudo"
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl px-4 pb-[calc(1.5rem_+_var(--toast-offset,0px))] pt-6 outline-none sm:px-6 sm:pb-[calc(2rem_+_var(--toast-offset,0px))] sm:pt-8 lg:px-10 lg:pb-[calc(2.5rem_+_var(--toast-offset,0px))] lg:pt-10"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * Quando o elemento focado sai do DOM (ex.: a linha que abriu um diálogo é
 * recarregada após salvar ou excluir), o navegador deixa o foco no <body>.
 * Nesse caso, e só nele, o foco vai para o título da página (ou, sem título,
 * para o conteúdo principal). A checagem espera um instante para que diálogos
 * e popovers devolvam o foco à origem quando ela ainda existe.
 */
function useRecuperarFoco(destinoRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    let ultimoFocado: Element | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const registrar = (event: FocusEvent) => {
      ultimoFocado = event.target as Element;
    };
    const verificar = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const semFoco =
          !document.activeElement || document.activeElement === document.body;
        if (semFoco && ultimoFocado && !ultimoFocado.isConnected) {
          ultimoFocado = null;
          const conteudo = destinoRef.current;
          const destino =
            conteudo?.querySelector<HTMLElement>("h1[tabindex]") ?? conteudo;
          destino?.focus({ preventScroll: true });
          // Com foco visível (teclado), garante que o destino apareça na tela
          if (destino?.matches(":focus-visible")) {
            destino.scrollIntoView({ block: "nearest" });
          }
        }
      }, 100);
    };

    const observer = new MutationObserver(verificar);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("focusin", registrar);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      document.removeEventListener("focusin", registrar);
    };
  }, [destinoRef]);
}

function SidebarContent({
  user,
  pathname,
  onNavigate,
}: {
  user: ShellUser;
  pathname: string;
  // Presente apenas na gaveta mobile
  onNavigate?: () => void;
}) {
  const iniciais = user.nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 px-5">
        <Link href="/dashboard" onClick={onNavigate} className="rounded-lg">
          <Logo />
        </Link>
        {onNavigate && (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Fechar menu"
            className="-mr-2 grid size-11 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X aria-hidden className="size-5" />
          </button>
        )}
      </div>

      <nav aria-label="Principal" className="flex-1 overflow-y-auto px-3 py-4">
        <NavList items={NAV_PRINCIPAL} pathname={pathname} onNavigate={onNavigate} />

        {user.tipo === "ADMIN" && (
          <>
            <p className="px-3 pb-2 pt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Administração
            </p>
            <NavList items={NAV_ADMIN} pathname={pathname} onNavigate={onNavigate} />
          </>
        )}
      </nav>

      <div className="shrink-0 border-t p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-foreground"
          >
            {iniciais || "?"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold" title={user.nome}>
              {user.nome}
            </p>
            <p className="truncate text-xs text-muted-foreground" title={user.email}>
              {user.email}
            </p>
          </div>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <LogoutButton />
          <ThemeToggle className="hidden lg:grid" />
        </div>
      </div>
    </div>
  );
}

function NavList({
  items,
  pathname,
  onNavigate,
}: {
  items: typeof NAV_PRINCIPAL;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-1">
      {items.map(({ href, label, icon: Icon }) => {
        const ativo = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={ativo ? "page" : undefined}
              className={cn(
                "relative flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors lg:h-10",
                ativo
                  ? "bg-primary/10 font-semibold text-foreground before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon
                aria-hidden
                className={cn("size-[18px]", ativo && "text-primary")}
              />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
