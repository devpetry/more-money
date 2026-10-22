import type { Metadata } from "next";
import ListCategorias from "@/components/ListCategorias";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Categorias" };

export default async function CategoriasPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return <ListCategorias />;
}
