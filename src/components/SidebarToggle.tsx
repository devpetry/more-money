"use client";

import { useState } from "react";
import {
  BriefcaseBusiness,
  CircleDollarSign,
  ChartNoAxesCombined,
  LogIn,
  LogOut,
  Menu,
  Settings,
  Tag,
  Users,
  X,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export default function SidebarToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const tipoUsuario = session?.user?.tipo_usuario;

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 p-2 rounded-full text-[#E0E0E0] z-50"
        aria-expanded={isOpen}
        aria-controls="sidebar-menu"
        title={isOpen ? "Fechar Menu" : "Abrir Menu"}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <nav
        id="sidebar-menu"
        className={`fixed top-0 left-0 h-full w-64 bg-[#161B22] text-[#E0E0E0] shadow-2xl transition-transform duration-300 ease-in-out z-40
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-6 mt-10">
          <h3 className="text-2xl text-[#E0E0E0] font-semibold mb-4 border-b border-[#9E9E9E]/30 pb-2">
            Navegação
          </h3>

          <ul className="space-y-1">
            {session ? (
              <li>
                <a
                  href="/dashboard"
                  className="block p-2 rounded-lg text-[#E0E0E0] hover:text-[#64B5F6] hover:bg-[#0D1117] flex items-center gap-1"
                  onClick={toggleSidebar}
                >
                  <ChartNoAxesCombined size={16} />
                  Dashboard
                </a>
              </li>
            ) : null}
            {session && tipoUsuario === "ADMIN" ? (
              <li>
                <a
                  href="/lista-usuarios"
                  className="block p-2 rounded-lg text-[#E0E0E0] hover:text-[#64B5F6] hover:bg-[#0D1117] flex items-center gap-1"
                  onClick={toggleSidebar}
                >
                  <Users size={16} />
                  Usuários
                </a>
              </li>
            ) : null}
            {session && tipoUsuario === "ADMIN" ? (
              <li>
                <a
                  href="/lista-empresas"
                  className="block p-2 rounded-lg text-[#E0E0E0] hover:text-[#64B5F6] hover:bg-[#0D1117] flex items-center gap-1"
                  onClick={toggleSidebar}
                >
                  <BriefcaseBusiness size={16} />
                  Empresas
                </a>
              </li>
            ) : null}
            {session ? (
              <li>
                <a
                  href="/lista-categorias"
                  className="block p-2 rounded-lg text-[#E0E0E0] hover:text-[#64B5F6] hover:bg-[#0D1117] flex items-center gap-1"
                  onClick={toggleSidebar}
                >
                  <Tag size={16} />
                  Categorias
                </a>
              </li>
            ) : null}
            {session ? (
              <li>
                <a
                  href="/lista-lancamentos"
                  className="block p-2 rounded-lg text-[#E0E0E0] hover:text-[#64B5F6] hover:bg-[#0D1117] flex items-center gap-1"
                  onClick={toggleSidebar}
                >
                  <CircleDollarSign size={16} />
                  Lançamentos
                </a>
              </li>
            ) : null}
            <li>
              <a
                href="#"
                className="block p-2 rounded-lg text-[#9E9E9E] hover:text-[#E0E0E0] hover:bg-[#0D1117] flex items-center gap-1"
                onClick={toggleSidebar}
              >
                <Settings size={16} />
                Configurações
              </a>
            </li>
            {session ? (
              <li>
                <a
                  className="block p-2 rounded-lg cursor-pointer text-[#9E9E9E] hover:text-[#FF5252] hover:bg-[#0D1117] flex items-center gap-1"
                  onClick={() => signOut()}
                >
                  <LogOut size={16} />
                  Sair
                </a>
              </li>
            ) : (
              <li>
                <a
                  href="/login"
                  className="block p-2 rounded-lg cursor-pointer text-[#9E9E9E] hover:text-[#00C853] hover:bg-[#0D1117] flex items-center gap-1"
                  onClick={toggleSidebar}
                >
                  <LogIn size={16} />
                  Entrar
                </a>
              </li>
            )}
          </ul>
        </div>
      </nav>

      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-[#0D1117] opacity-80 z-30"
        ></div>
      )}

      <style jsx global>{`
        body {
          background-color: #0d1117;
        }
      `}</style>
    </>
  );
}
