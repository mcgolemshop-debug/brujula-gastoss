import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

// Mock user para Fase 1 — en Fase 2 viene de Supabase Auth + tabla users
const MOCK_USER = {
  name: "Orlando Velásquez",
  email: "orlando@brujula.local",
  role: "admin" as const,
  avatarUrl: null,
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar userRole={MOCK_USER.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={MOCK_USER} />
        <main className="flex-1 overflow-x-hidden pb-20 md:pb-6">
          {children}
        </main>
      </div>
      <MobileBottomNav userRole={MOCK_USER.role} />
    </div>
  );
}
