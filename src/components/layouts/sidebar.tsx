"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  ArrowRightLeft,
  Repeat,
  Package,
  DollarSign,
  Building2,
  Settings,
  Shield,
  BarChart3,
} from "lucide-react";
import type { UserRole } from "@/types";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "EDITOR", "VISOR"] },
  { name: "Personas", href: "/personas", icon: Users, roles: ["ADMIN", "EDITOR", "VISOR"] },
  { name: "Cuadres", href: "/cuadres", icon: ClipboardList, roles: ["ADMIN", "EDITOR", "VISOR"] },
  { name: "Wires", href: "/wires", icon: ArrowRightLeft, roles: ["ADMIN", "EDITOR", "VISOR"] },
  { name: "Reventas", href: "/reventas", icon: Repeat, roles: ["ADMIN", "EDITOR", "VISOR"] },
  { name: "Lotes", href: "/lotes", icon: Package, roles: ["ADMIN", "EDITOR", "VISOR"] },
  { name: "Gastos", href: "/gastos", icon: DollarSign, roles: ["ADMIN", "EDITOR", "VISOR"] },
  { name: "Cuentas", href: "/cuentas-bancarias", icon: Building2, roles: ["ADMIN", "EDITOR", "VISOR"] },
  { name: "Reportes", href: "/reportes", icon: BarChart3, roles: ["ADMIN", "EDITOR", "VISOR"] },
  { name: "Configuracion", href: "/configuracion", icon: Settings, roles: ["ADMIN"] },
  { name: "Usuarios", href: "/usuarios", icon: Shield, roles: ["ADMIN"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role as UserRole | undefined;

  const filteredNav = role
    ? navigation.filter((item) => item.roles.includes(role))
    : navigation;

  return (
    <aside className="flex h-screen w-60 flex-col bg-[#000000] border-r border-border">
      <div className="flex h-11 items-center px-4 border-b border-border">
        <span className="text-xs text-white font-normal">Finanzas</span>
      </div>
      <nav className="flex-1 space-y-0.5 p-2 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-normal transition-colors ${
                isActive
                  ? "text-white bg-[rgba(255,255,255,0.06)]"
                  : "text-[#7a7a7a] hover:text-white hover:bg-[rgba(255,255,255,0.04)]"
              }`}
            >
              <item.icon className="size-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
