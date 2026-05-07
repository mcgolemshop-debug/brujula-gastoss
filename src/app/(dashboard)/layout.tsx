import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { repo } from "@/lib/repositories";
import type { Rol } from "@/types/domain";

interface CurrentUser {
  name: string;
  email: string;
  role: Rol;
  avatarUrl: string | null;
}

const MOCK_USER: CurrentUser = {
  name: "Orlando Velásquez",
  email: "orlando@brujula.local",
  role: "admin",
  avatarUrl: null,
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMock = process.env.NEXT_PUBLIC_DATA_SOURCE === "mock";

  let user: CurrentUser;
  if (isMock) {
    user = MOCK_USER;
  } else {
    const current = await repo.users.current();
    if (!current) {
      redirect("/login");
    }
    user = {
      name: current.nombre_completo,
      email: current.email,
      role: current.rol,
      avatarUrl: current.avatar_url,
    };
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar userRole={user.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={user} />
        <main className="flex-1 overflow-x-hidden pb-20 md:pb-6">
          {children}
        </main>
      </div>
      <MobileBottomNav userRole={user.role} />
    </div>
  );
}
