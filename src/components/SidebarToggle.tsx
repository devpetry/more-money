"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { signOut } from "next-auth/react";

export default function SidebarToggle() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 p-2 rounded-full text-[#E0E0E0] z-50"
        aria-expanded={isOpen}
        aria-controls="sidebar-menu"
        title={isOpen ? "Fechar Menu" : "Abrir Menu"}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <nav
        id="sidebar-menu"
        className={`fixed top-0 left-0 h-full w-64 bg-[#161B22] text-[#E0E0E0] shadow-2xl transition-transform duration-300 ease-in-out z-40
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-6 mt-10">
          <h3 className="text-2xl font-semibold mb-4 border-b border-[#9E9E9E]/30 pb-2">
            Navegação
          </h3>

          <ul className="space-y-1">
            <li>
              <a
                href="/dashboard"
                className="block p-2 rounded-lg text-[#E0E0E0] hover:text-[#64B5F6] hover:bg-[#0D1117]"
                onClick={toggleSidebar}
              >
                Dashboard
              </a>
            </li>
            <li>
              <a
                href="/lista-usuarios"
                className="block p-2 rounded-lg text-[#E0E0E0] hover:text-[#64B5F6] hover:bg-[#0D1117]"
                onClick={toggleSidebar}
              >
                Usuários
              </a>
            </li>
            <li>
              <a
                href="#"
                className="block p-2 rounded-lg text-[#9E9E9E] hover:text-[#E0E0E0] hover:bg-[#0D1117]"
                onClick={toggleSidebar}
              >
                Configurações
              </a>
            </li>
            <li>
              <a
                className="block p-2 rounded-lg cursor-pointer text-[#9E9E9E] hover:text-[#FF5252] hover:bg-[#0D1117]"
                onClick={() => signOut()}
              >
                Sair
              </a>
            </li>
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
