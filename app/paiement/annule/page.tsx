import Link from "next/link";
import { Header } from "@/components/layout/Header";

export default function PaiementAnnulePage() {
  return (
    <>
      <Header />
      <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-6 text-center">
        <div className="glass-card rounded-2xl p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-on-surface-variant">
            <span className="material-symbols-outlined text-[28px]">cancel</span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface">Paiement annulé</h1>
          <p className="mt-3 text-on-surface-variant">
            Aucun montant n&apos;a été débité. Votre palier actuel reste
            inchangé.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/tarifs"
              className="primary-glow rounded-xl bg-primary-container px-6 py-3 font-semibold text-white transition-transform hover:scale-105 active:scale-95"
            >
              Revoir les tarifs
            </Link>
            <Link
              href="/assistant"
              className="rounded-xl border border-white/10 px-6 py-3 font-semibold text-on-surface transition-colors hover:bg-white/5"
            >
              Continuer gratuitement
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
