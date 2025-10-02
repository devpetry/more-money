import ChangePasswordForm from "@/components/ChangePasswordForm";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AlterarSenhaPage({ searchParams }: PageProps) {
  const session = await getServerSession();

  if (session) {
    if (process.env.NODE_ENV === "development") {
      console.log("⚠️ Já existe sessão: ", session);
    }
    redirect("/dashboard");
  }

  const params = await searchParams;
  const token = params?.token;

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
