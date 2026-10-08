import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="app-main pb-24 md:pb-5">
        <div className="mx-auto max-w-[1480px] px-4 py-5 sm:px-7 sm:py-7 lg:px-9 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
