"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Search, Bell, LogOut, User, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationCount] = useState(0);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-user-menu]")) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const initials = profile
    ? `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase() || "?"
    : "?";

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-md hover:bg-gray-100 text-gray-600"
        >
          <Menu size={22} />
        </button>
        <div className="hidden md:flex items-center">
          <form onSubmit={handleSearch} className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 lg:w-80 h-9 pl-10 pr-4 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-colors"
            />
          </form>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="md:hidden p-2 rounded-md hover:bg-gray-100 text-gray-600"
        >
          <Search size={20} />
        </button>

        <Link
          href="/notifications"
          className="relative p-2 rounded-md hover:bg-gray-100 text-gray-600"
        >
          <Bell size={20} />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </Link>

        <Separator orientation="vertical" className="h-6 mx-1 hidden md:block" />

        <div className="relative" data-user-menu>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Avatar
              src={profile?.avatar_url}
              firstName={profile?.first_name}
              lastName={profile?.last_name}
              size="sm"
              className="h-8 w-8"
            />
            <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
              {profile?.first_name ?? "Utilisateur"}
            </span>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-white shadow-lg overflow-hidden z-50">
              <div className="p-3 border-b">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile?.first_name} {profile?.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <div className="p-1">
                <Link
                  href="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <User size={16} />
                  Profil
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Settings size={16} />
                  Paramètres
                </Link>
              </div>
              <div className="p-1 border-t">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  Se déconnecter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {searchOpen && (
        <div className="md:hidden fixed inset-x-0 top-0 z-50 bg-white border-b p-3">
          <form onSubmit={handleSearch} className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-12 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
            />
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium"
            >
              Annuler
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
