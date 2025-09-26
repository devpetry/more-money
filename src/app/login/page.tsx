import AccessHeader from "@/components/AccessHeader";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-sm p-8 rounded-2xl bg-[#0D1117]"> {/*shadow-lg*/}
        {/* Cabeçalho */}
        <AccessHeader />

        {/* Formulário */}
        <LoginForm />
      </div>
    </div>
  );
}
