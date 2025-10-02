import RecoverPasswordForm from "@/components/RecoverPasswordForm";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function RecuperarSenhaPage() {
  const session = await getServerSession();

  if (session) {
    console.log("⚠️   Já existe sessão: ", session);
    redirect("/dashboard");
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <RecoverPasswordForm />
    </div>
  );
}
