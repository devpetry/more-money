import SidebarToggle from "@/components/SidebarToggle";
import UserList from "@/components/UserList";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    if (process.env.NODE_ENV === "development") {
      console.log("⚠️   Não existe sessão: ", session);
    }
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="w-full max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-black mt-4 text-left">Usuários</h1>
        <SidebarToggle />
        <UserList />
      </main>
    </div>
  );
}
