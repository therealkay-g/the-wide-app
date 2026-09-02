"use client";

import { Notification, NotificationType } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  UserPlus,
  Edit,
  FileText,
  Mic,
  Link,
  AtSign,
  Bell,
} from "lucide-react";

interface NotificationItemProps {
  notification: Notification;
  onRead: () => void;
}

const typeIcons: Record<NotificationType, React.ReactNode> = {
  INVITATION: <UserPlus className="h-4 w-4" />,
  MODIFICATION: <Edit className="h-4 w-4" />,
  NEW_DOCUMENT: <FileText className="h-4 w-4" />,
  NEW_TESTIMONY: <Mic className="h-4 w-4" />,
  MATCH: <Link className="h-4 w-4" />,
  MENTION: <AtSign className="h-4 w-4" />,
  SYSTEM: <Bell className="h-4 w-4" />,
};

const typeColors: Record<NotificationType, string> = {
  INVITATION: "bg-blue-100 text-blue-600",
  MODIFICATION: "bg-amber-100 text-amber-600",
  NEW_DOCUMENT: "bg-purple-100 text-purple-600",
  NEW_TESTIMONY: "bg-orange-100 text-orange-600",
  MATCH: "bg-green-100 text-green-600",
  MENTION: "bg-cyan-100 text-cyan-600",
  SYSTEM: "bg-gray-100 text-gray-600",
};

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: fr,
  });

  const handleClick = () => {
    if (!notification.read) {
      onRead();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full text-left flex items-start gap-3 p-4 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50",
        !notification.read && "bg-blue-50/50 dark:bg-blue-950/10"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0",
          typeColors[notification.type as NotificationType] ?? typeColors.SYSTEM
        )}
      >
        {typeIcons[notification.type as NotificationType] ?? typeIcons.SYSTEM}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm text-gray-900 dark:text-gray-100",
            !notification.read && "font-semibold"
          )}
        >
          {notification.title}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
      </div>

      {!notification.read && (
        <div className="mt-2 h-2.5 w-2.5 rounded-full bg-blue-500 flex-shrink-0" />
      )}
    </button>
  );
}
