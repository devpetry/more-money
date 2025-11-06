import packageJson from "../../package.json";
import { LogIn } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col items-center justify-center text-center min-h-[80vh] px-6">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
            Bem-vindo ao{" "}
            <span className="bg-gradient-to-r from-[#00E676] via-[#00C853] to-[#00E676] bg-clip-text text-transparent animate-gradient-x">
              More Money
            </span>
          </h1>

          <h2 className="text-2xl md:text-3xl mb-3">
            Organize suas finanças com facilidade.
          </h2>

          <h3 className="text-lg md:text-xl max-w-2xl mb-8">
            Controle seus gastos, defina metas e alcance a liberdade financeira.
          </h3>
          <a
            href="/login"
            className="flex items-center gap-2 px-6 py-3 rounded-xl hover:text-[#0D1117] hover:bg-[#00C853] border border-[#161B22] transition-all duration-200"
          >
            <LogIn size={18} />
            Entrar
          </a>
          <p className="mt-6 text-sm text-[#9E9E9E]">
            Versão{" "}
            <span className="text-[#00E676] font-semibold">
              {packageJson.version}
            </span>
          </p>
        </div>
      </main>
    </div>
  );
}
