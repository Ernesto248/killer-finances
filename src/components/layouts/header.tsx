"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sidebar } from "./sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              }
            />
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar />
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-bold text-primary md:hidden">Finanzas</h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden md:block">
            {session?.user?.name}
          </span>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
              {session?.user?.name?.charAt(0) || "U"}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="text-muted-foreground hover:text-foreground"
            >
              Salir
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
