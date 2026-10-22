import type { Metadata } from "next";
import Link from "next/link";
import { Link2Off } from "lucide-react";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import { AuthCard } from "@/components/layout/PublicShell";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/feedback";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Redefinir senha" };

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AlterarSenhaPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const token = searchParams?.token;

  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  if (!token) {
    return (
      <AuthCard
        title="Link inválido"
        icon={
          <span className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
            <Link2Off aria-hidden className="size-6" />
          </span>
        }
        footer={
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Voltar para o login
          </Link>
        }
      >
        <InlineAlert tone="error">
          Token de redefinição inválido ou ausente.
        </InlineAlert>
        <Button asChild size="lg" className="mt-6 w-full">
          <Link href="/recuperar-senha">Solicitar novo link</Link>
        </Button>
      </AuthCard>
    );
  }

  return <ChangePasswordForm token={token} />;
}
