import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { RechercheClient } from "@/components/recherche/RechercheClient";

export default async function RecherchePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/connexion");
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-bold text-on-surface">Rechercher un produit</h1>
        <p className="mt-1 text-on-surface-variant">
          Décrivez ce que vous cherchez, par exemple « riz parfumé 25kg ».
        </p>
        <RechercheClient />
      </main>
    </>
  );
}
