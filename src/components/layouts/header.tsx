"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sidebar } from "./sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 h-14 bg-white border-b border-border flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon-sm" className="md:hidden text-[#6b7280]">
                <Menu className="size-4" />
              </Button>
            }
          />
          <SheetContent side="left" className="p-0 w-60">
            <Sidebar />
          </SheetContent>
        </Sheet>
        <span className="text-base font-bold text-[#1a1a1a]">Finanzas</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-[#6b7280] hidden md:block">
          {session?.user?.name}
        </span>
        <div className="flex-shrink-0 size-8 rounded-full bg-[#2563eb]/10 text-[#2563eb] font-bold flex items-center justify-center text-sm">
          {session?.user?.name?.charAt(0) || "U"}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut()}
          className="text-[#6b7280] hover:text-[#1a1a1a]"
        >
          Salir
        </Button>
      </div>
    </header>
  );
}
