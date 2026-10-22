import PublicShell from "@/components/layout/PublicShell";

export default function AcessoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell>{children}</PublicShell>;
}
