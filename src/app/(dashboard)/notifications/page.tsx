"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { getNotifications, markAsRead, markAllAsRead } from "@/services/notifications";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { NotificationItem } from "@/components/notifications/notification-item";
import type { Notification } from "@/types";
import { Bell, CheckCheck } from "lucide-react";

export default function NotificationsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error: err } = await getNotifications(user.id);
    if (err) {
      setError(err);
    } else {
      setNotifications(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRead = async (notification: Notification) => {
    await markAsRead(notification.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    );
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await markAllAsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size={32} />
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {unreadCount > 0
              ? `${unreadCount} non lue(s)`
              : "Tout est lu"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <CheckCheck className="h-4 w-4" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      <ErrorMessage message={error} />

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={<Bell className="h-12 w-12" />}
              title="Aucune notification"
              description="Vous serez notifié des activités importantes de votre famille."
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-2 divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={() => handleRead(notification)}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
