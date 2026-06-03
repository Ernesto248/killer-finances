"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sidebar } from "./sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 h-11 bg-[#000000] border-b border-border flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon-sm" className="md:hidden text-[#7a7a7a]">
                <Menu className="size-4" />
              </Button>
            }
          />
          <SheetContent side="left" className="p-0 w-60">
            <Sidebar />
          </SheetContent>
        </Sheet>
        <span className="text-xs text-white font-normal">Finanzas</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-[#7a7a7a] hidden md:block">
          {session?.user?.name}
        </span>
        <div className="size-6 rounded-full bg-[#0066cc]/20 flex items-center justify-center text-[11px] font-medium text-[#2997ff]">
          {session?.user?.name?.charAt(0) || "U"}
        </div>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => signOut()}
          className="text-[#7a7a7a] hover:text-white"
        >
          Salir
        </Button>
      </div>
    </header>
  );
}
