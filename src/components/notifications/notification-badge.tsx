"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/hooks/use-user";
import { getUnreadCount } from "@/services/notifications";
import { Bell } from "lucide-react";

export function NotificationBadge() {
  const { user } = useUser();
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!user) return;
    const { data } = await getUnreadCount(user.id);
    setCount(data);
  }, [user]);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  return (
    <div className="relative">
      <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  );
}
