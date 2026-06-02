"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard, Users, ClipboardList, ArrowRightLeft } from "lucide-react";

const mobileNav = [
  { name: "Inicio", href: "/dashboard", icon: LayoutDashboard },
  { name: "Personas", href: "/personas", icon: Users },
  { name: "Cuadres", href: "/cuadres", icon: ClipboardList },
  { name: "Wires", href: "/wires", icon: ArrowRightLeft },
];

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
      <div className="flex items-center justify-around h-16">
        {mobileNav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-2 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
