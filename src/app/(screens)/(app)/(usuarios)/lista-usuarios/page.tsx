import type { Metadata } from "next";
import ListUsers from "@/components/ListUsers";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Usuários" };

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const tipoUsuario = session.user?.tipo_usuario;

  if (tipoUsuario !== "ADMIN") {
    redirect("/unauthorized");
  }

  return <ListUsers />;
}
