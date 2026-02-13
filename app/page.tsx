import { ChatInterface } from "../components/ChatInterface";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden font-sans text-zinc-100">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.65)), url('https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-black/30" />

      <main className="relative z-10 flex min-h-screen flex-col p-4 sm:p-8">
        <section className="mt-8 grid flex-1 items-end gap-6 lg:grid-cols-2">
          <ChatInterface />
        </section>
      </main>
    </div>
  );
}
