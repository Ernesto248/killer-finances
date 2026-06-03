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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-14 bg-white border-t border-border">
      <div className="flex items-center justify-around h-full">
        {mobileNav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 size-14 transition-colors ${
                isActive
                  ? "text-[#2563eb]"
                  : "text-[#9ca3af] hover:text-[#1a1a1a]"
              }`}
            >
              <item.icon className="size-5" />
              {isActive && <div className="size-1 rounded-full bg-[#2563eb]" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
