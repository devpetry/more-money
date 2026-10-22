import type { Metadata } from "next";
import RecoverPasswordForm from "@/components/RecoverPasswordForm";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Recuperar senha" };

export default async function RecuperarSenhaPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return <RecoverPasswordForm />;
}
