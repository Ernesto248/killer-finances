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
    <aside className="hidden md:flex h-screen w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center border-b border-border px-6">
        <h1 className="text-lg font-bold text-primary">Finanzas</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
