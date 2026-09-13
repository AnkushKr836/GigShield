import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main
        className="min-h-screen transition-[padding] duration-300 ease-out"
        style={{ paddingLeft: "var(--sidebar-width, 76px)" }}
      >
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-8 sm:py-10 page-enter">
          {children}
        </div>
      </main>
    </div>
  );
}
