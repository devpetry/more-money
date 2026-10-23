import type { Metadata } from "next";
import ListCartoes from "@/components/ListCartoes";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Cartões" };

export default async function CartoesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return <ListCartoes />;
}
