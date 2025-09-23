import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-sm p-8 rounded-2xl bg-[#0D1117] shadow-lg">
        {/* LOGO */}
        <div className="flex justify-center mb-6 bg-[#9E9E9E]/15 rounded-xl">
          <div className="h-20 flex items-center justify-center text-3xl font-black text-[#E0E0E0]">
            *LOGO*
          </div>
        </div>

        {/* Título */}
        <h2 className="text-center text-[#E0E0E0] text-xl font-bold">
          Acesse sua conta
        </h2>
        <p className="text-center text-[#9E9E9E] text-sm mb-6">
          Faça login para continuar
        </p>

        {/* Formulário */}
        <LoginForm />

        {/* Link esqueci senha */}
        <div className="mt-4 text-center">
          <a href="#" className="text-sm text-[#9E9E9E] hover:underline">
            Esqueci minha senha
          </a>
        </div>
      </div>
    </div>
  );
}
