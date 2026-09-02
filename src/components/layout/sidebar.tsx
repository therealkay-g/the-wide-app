"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  TreePine,
  Users,
  FileText,
  Mic,
  Image,
  BookOpen,
  Clock,
  MapPin,
  Search,
  BookMarked,
  Settings,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Home,
  Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { useState } from "react";

const navigation = [
  { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { name: "Mes familles", href: "/families", icon: Users },
  { name: "Arbre", href: "/trees", icon: TreePine },
  { name: "Personnes", href: "/persons", icon: Users },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Sources", href: "/sources", icon: BookOpen },
  { name: "Témoignages", href: "/testimonies", icon: Mic },
  { name: "Chronologie", href: "/timeline", icon: Clock },
  { name: "Carte", href: "/map", icon: MapPin },
  { name: "Recherches", href: "/research", icon: Search },
  { name: "Histoires", href: "/stories", icon: BookMarked },
];

interface SidebarProps {
  profile?: any;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ profile, collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className={cn(
        "flex items-center border-b border-gray-200 dark:border-gray-700",
        collapsed ? "justify-center py-4" : "justify-between px-4 py-4"
      )}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#0B6E4F] flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">WIDE</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="flex items-center justify-center">
            <div className="h-8 w-8 rounded-lg bg-[#0B6E4F] flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
          </Link>
        )}
        {onToggle && (
          <button
            onClick={onToggle}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hidden lg:flex"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#0B6E4F]/10 text-[#0B6E4F] dark:bg-[#0B6E4F]/20 dark:text-[#2DD4A8]"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 dark:border-gray-700 p-2 space-y-0.5">
        <Link
          href="/notifications"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800",
            collapsed && "justify-center px-2"
          )}
        >
          <Bell className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Notifications</span>}
        </Link>
        <Link
          href="/settings"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800",
            collapsed && "justify-center px-2"
          )}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Paramètres</span>}
        </Link>

        {!collapsed && profile && (
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar
              src={profile.avatar_url}
              firstName={profile.first_name}
              lastName={profile.last_name}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {profile.first_name} {profile.last_name}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
              title="Déconnexion"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
        {collapsed && (
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center w-full p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            title="Déconnexion"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md border border-gray-200 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-40",
          collapsed ? "lg:w-16" : "lg:w-64"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
