"use client";

import { FormEvent } from "react";
import {signIn} from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function LoginForm() {
    const searchParams = useSearchParams();

    const error = searchParams.get("error");

    async function login(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const data = {
            email: formData.get("email"),
            password: formData.get("password"),
        }

        signIn("credentials", {
            ...data,
            callbackUrl: "/dashboard"
        });
    }

    return (
      <>
        <form onSubmit={login} className="flex flex-col gap-4">
          <input
            name="email"
            type="email"
            placeholder="email@dominio.com"
            className="px-4 py-2 rounded-md bg-[#E0E0E0] text-[#9E9E9E] outline-none rounded-xl"
          />
          <input
            name="password"
            type="password"
            placeholder="senha"
            className="px-4 py-2 rounded-md bg-[#E0E0E0] text-[#9E9E9E] outline-none rounded-xl"
          />
          <button
            type="submit"
            className="bg-[#00C853] hover:bg-[#00E676] text-[#0D1117] font-black py-2 transition rounded-xl"
          >
            ENTRAR
          </button>
          {error === "CredentialsSignin" && <div className="text-[#FF5252] text-sm text-center">Erro ao entrar</div>}
        </form>
        <div className="mt-4 text-center">
          <a href="#" className="text-sm text-[#9E9E9E] hover:underline">
            Esqueci minha senha
          </a>
        </div>
      </>     
    )
}
