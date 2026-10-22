"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

import { cn } from "@/lib/utils";

export default function LogoutButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut()}
      className={cn(
        "flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
        className
      )}
    >
      <LogOut aria-hidden className="size-4" />
      Sair
    </button>
  );
}
