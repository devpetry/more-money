import ChangePasswordForm from "@/components/ChangePasswordForm";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function AlterarSenhaPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const session = await getServerSession();

  if (session) {
    console.log("Já existe sessão: ", session);
    redirect("/dashboard");
  }

  // Garantir que o token existe
  const token = searchParams?.token;
  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500 font-bold">
          Token de redefinição inválido ou ausente.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <ChangePasswordForm token={token} />
    </div>
  );
}
