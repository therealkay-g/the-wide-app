"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  TreePine,
  FileText,
  MoreHorizontal,
  X,
  Home,
  BookOpen,
  Mic,
  Clock,
  Map,
  Search,
  BookMarked,
  BookCopy,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainItems = [
  { label: "Accueil", href: "/", icon: LayoutDashboard },
  { label: "Personnes", href: "/persons", icon: Users },
  { label: "Arbre", href: "/trees", icon: TreePine },
  { label: "Docs", href: "/documents", icon: FileText },
];

const moreItems = [
  { label: "Familles", href: "/families", icon: Home },
  { label: "Sources", href: "/sources", icon: BookOpen },
  { label: "Témoignages", href: "/testimonies", icon: Mic },
  { label: "Chronologie", href: "/timeline", icon: Clock },
  { label: "Carte", href: "/map", icon: Map },
  { label: "Recherches", href: "/research", icon: Search },
  { label: "Histoires", href: "/stories", icon: BookMarked },
  { label: "Livres", href: "/books", icon: BookCopy },
];

export function MobileNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {mainItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs font-medium transition-colors min-w-0",
                  active ? "text-amber-600" : "text-gray-500"
                )}
              >
                <Icon size={22} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setDrawerOpen(true)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs font-medium transition-colors",
              drawerOpen ? "text-amber-600" : "text-gray-500"
            )}
          >
            <MoreHorizontal size={22} />
            <span>Plus</span>
          </button>
        </div>
      </nav>

      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-md hover:bg-gray-100"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-1">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-amber-50 text-amber-700"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
