import Link from "next/link";
import { Header } from "@/components/layout/Header";

export default function PaiementSuccesPage() {
  return (
    <>
      <Header />
      <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-6 text-center">
        <div className="glass-card rounded-2xl p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
            <span className="material-symbols-outlined text-[28px]">check_circle</span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface">Paiement reçu</h1>
          <p className="mt-3 text-on-surface-variant">
            Merci. Votre palier est activé dès que PayTech nous confirme la
            transaction — c&apos;est en général immédiat, parfois quelques
            secondes.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/compte"
              className="primary-glow rounded-xl bg-primary-container px-6 py-3 font-semibold text-white transition-transform hover:scale-105 active:scale-95"
            >
              Voir mon compte
            </Link>
            <Link
              href="/assistant"
              className="rounded-xl border border-white/10 px-6 py-3 font-semibold text-on-surface transition-colors hover:bg-white/5"
            >
              Lancer une recherche
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
