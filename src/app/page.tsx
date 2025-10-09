export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center">
      <main>
        <h1 className="text-3xl font-black mt-4">Página Principal [Home]</h1>
        <button type="button" className="btn btn-outline">
          <a href="/login">Entrar</a>
        </button>
      </main>
    </div>
  );
}
