import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { AssistantChat } from "@/components/assistant/AssistantChat";

export default async function AssistantPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/connexion");
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6">
        <AssistantChat />
      </main>
    </>
  );
}
