import type { Metadata } from "next";
import Dashboard from "@/components/Dashboard";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return <Dashboard nomeUsuario={session.user?.name?.split(" ")[0] || "usuário"} />;
}
