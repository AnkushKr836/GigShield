import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="pl-[76px] transition-all duration-300">
        <div className="max-w-2xl mx-auto px-6 py-10">{children}</div>
      </main>
    </div>
  );
}
