import RecoverPasswordForm from "@/components/RecoverPasswordForm";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function RecuperarSenhaPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    if (process.env.NODE_ENV === "development") {
      console.log("⚠️   Já existe sessão: ", session);
    }
    redirect("/dashboard");
  }

  return (
    <main className="flex items-center justify-center min-h-screen">
      <RecoverPasswordForm />
    </main>
  );
}
