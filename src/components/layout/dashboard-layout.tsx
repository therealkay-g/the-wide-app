"use client";

import { Sidebar } from "./sidebar";
import { useUser } from "@/hooks/use-user";
import { LoadingPage } from "@/components/ui/status";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useUser();
  const [collapsed, setCollapsed] = useState(false);

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar profile={profile} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main
        className={cn(
          "transition-all duration-300",
          collapsed ? "lg:pl-16" : "lg:pl-64"
        )}
      >
        <div className="p-4 lg:p-8 pt-16 lg:pt-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
