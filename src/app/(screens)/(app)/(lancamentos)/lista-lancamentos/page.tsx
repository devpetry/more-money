import type { Metadata } from "next";
import ListLancamentos from "@/components/ListLancamentos";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Lançamentos" };

export default async function CategoriasPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return <ListLancamentos />;
}
