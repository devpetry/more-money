import LogoutButton from "@/components/LogoutButton";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <main>
        <h1 className="text-3xl font-black">Olá, {session.user?.name}</h1>
        <LogoutButton /> 
      </main>
    </div>
  );
}
