import ChangePasswordForm from "@/components/ChangePasswordForm";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: { token?: string };
}

export default async function AlterarSenhaPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (session) {
    if (process.env.NODE_ENV === "development") {
      console.log("⚠️   Já existe sessão: ", session);
    }
    redirect("/dashboard");
  }

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
    <main className="flex items-center justify-center min-h-screen">
      <ChangePasswordForm token={token} />
    </main>
  );
}
