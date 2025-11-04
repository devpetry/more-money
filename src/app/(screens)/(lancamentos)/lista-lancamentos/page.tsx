import SidebarToggle from "@/components/SidebarToggle";
import ListLancamentos from "@/components/ListLancamentos";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function CategoriasPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    if (process.env.NODE_ENV === "development") {
      console.log("⚠️   Não existe sessão: ", session);
    }
    redirect("/login");
  }

  return (
    <div>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-black mt-4 text-left">Lançamentos</h1>
          <SidebarToggle />
        </div>

        <ListLancamentos />
      </main>
    </div>
  );
}
