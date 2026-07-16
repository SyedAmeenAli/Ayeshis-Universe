import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { NAV_ITEMS, SECONDARY_NAV } from "@/lib/config";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

/**
 * Bottom mobile navigation dock + drawer for secondary destinations.
 */
export function MobileDock() {
  const [open, setOpen] = useState(false);
  const primary = NAV_ITEMS.slice(0, 4);

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)]"
        data-testid="mobile-dock"
      >
        <div className="mx-3 mb-3 rounded-2xl border border-white/10 bg-archive-soft/85 backdrop-blur-xl flex justify-around items-stretch">
          {primary.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              data-testid={`mobile-nav-${item.id}`}
              className={({ isActive }) =>
                `flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium tracking-wider uppercase ${
                  isActive ? "text-lavender" : "text-text-secondary"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                data-testid="mobile-nav-more"
                className="flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium tracking-wider uppercase text-text-secondary"
              >
                <Menu className="w-4 h-4" />
                More
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-archive border-white/10 pb-[calc(env(safe-area-inset-bottom)+16px)]">
              <div className="grid grid-cols-2 gap-3 pt-6">
                {SECONDARY_NAV.map((item) => (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    onClick={() => setOpen(false)}
                    data-testid={`mobile-more-${item.id}`}
                    className="p-4 rounded-xl border border-white/10 bg-surface-1/50 text-text-primary text-sm min-h-[48px] flex items-center"
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}
