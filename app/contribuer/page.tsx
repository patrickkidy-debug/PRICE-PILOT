import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { ContribuerForm } from "@/components/contribuer/ContribuerForm";

export default async function ContribuerPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/connexion");
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-bold text-on-surface">Signaler un prix</h1>
        <p className="mt-1 text-on-surface-variant">
          Vous avez vu un prix en boutique ou en ligne ? Ajoutez-le pour que
          les autres acheteurs en profitent. Les petits commerçants comptent
          autant que les grandes enseignes.
        </p>
        <ContribuerForm />
      </main>
    </>
  );
}
