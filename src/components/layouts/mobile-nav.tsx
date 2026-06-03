"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard, Users, ClipboardList, ArrowRightLeft, Ellipsis } from "lucide-react";
import { SidebarContent } from "./sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-white border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-full px-1">
        {mobileNav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 h-full transition-colors ${
                isActive
                  ? "text-[#2563eb]"
                  : "text-[#9ca3af] hover:text-[#6b7280]"
              }`}
            >
              <item.icon className="size-5 shrink-0" />
              <span className="text-[10px] font-medium leading-none">{item.name}</span>
              {isActive && <div className="absolute bottom-0 w-8 h-0.5 rounded-full bg-[#2563eb]" />}
            </Link>
          );
        })}

        <Sheet>
          <SheetTrigger
            render={
              <button className="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 h-full text-[#9ca3af] hover:text-[#6b7280] transition-colors">
                <Ellipsis className="size-5 shrink-0" />
                <span className="text-[10px] font-medium leading-none">Mas</span>
              </button>
            }
          />
          <SheetContent side="left" className="p-0 w-60 [&>div]:flex [&>div]:flex-col">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
