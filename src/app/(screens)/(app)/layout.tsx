import AppShell from "@/components/layout/AppShell";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

// Shell compartilhado das áreas autenticadas; cada página mantém suas
// próprias verificações de sessão e de papel.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <AppShell
      user={{
        nome: session.user?.name || "Usuário",
        email: session.user?.email || "",
        tipo: session.user?.tipo_usuario || "",
      }}
    >
      {children}
    </AppShell>
  );
}
