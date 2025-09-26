"use client";

export default function AccessHeader() {
    return (
        <>
            {/* LOGO */}
            <div className="flex justify-center mb-4 bg-[#9E9E9E]/15 rounded-xl">
            <div className="h-20 flex items-center justify-center text-3xl font-black text-[#E0E0E0]">
                *LOGO*
            </div>
            </div>

            {/* Título */}
            <h2 className="text-center text-[#E0E0E0] text-xl font-bold">
            Acesse sua conta
            </h2>
            <p className="text-center text-[#9E9E9E] text-sm mb-4">
            Preencha os campos abaixo para seguir
            </p>
        </>
    );
}