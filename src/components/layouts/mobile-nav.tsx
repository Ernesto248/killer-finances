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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-11 bg-[#000000] border-t border-border">
      <div className="flex items-center justify-around h-full">
        {mobileNav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-center size-11 rounded-lg transition-colors ${
                isActive
                  ? "text-white bg-[rgba(255,255,255,0.06)]"
                  : "text-[#7a7a7a] hover:text-white"
              }`}
            >
              <item.icon className="size-5" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
