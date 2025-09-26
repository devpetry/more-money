"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button type="button" className="btn btn-outline" onClick={() => signOut()}>
      Sair
    </button>
  );
}
