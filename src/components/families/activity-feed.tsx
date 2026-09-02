"use client";

import { useEffect, useState } from "react";
import { getActivities } from "@/services/activities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { Activity } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, ChevronDown } from "lucide-react";

interface ActivityFeedProps {
  familyId: string;
}

interface ActivityWithEntity extends Omit<Activity, "entity_name"> {
  entity_name?: string | null;
}

export function ActivityFeed({ familyId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityWithEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const INITIAL_LIMIT = 20;

  useEffect(() => {
    async function fetchActivities() {
      setLoading(true);
      const { data } = await getActivities(familyId);
      setActivities(data);
      setLoading(false);
    }
    fetchActivities();
  }, [familyId]);

  const displayed = showAll ? activities : activities.slice(0, INITIAL_LIMIT);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          Activité récente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Spinner size={24} />
        ) : activities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Aucune activité pour le moment.
          </p>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="space-y-6">
              {displayed.map((activity) => {
                const timeAgo = formatDistanceToNow(new Date(activity.created_at), {
                  addSuffix: true,
                  locale: fr,
                });

                return (
                  <div key={activity.id} className="relative flex items-start gap-4 pl-1">
                    <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#0B6E4F] text-white flex-shrink-0">
                      <span className="text-xs font-semibold">
                        {activity.user_id?.charAt(0).toUpperCase() ?? "?"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">{activity.user_id ? "Un membre" : "Quelqu'un"}</span>{" "}
                        {activity.action}
                        {activity.entity_name && (
                          <>
                            {" "}
                            <span className="font-medium">{activity.entity_name}</span>
                          </>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{timeAgo}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {!showAll && activities.length > INITIAL_LIMIT && (
              <div className="mt-6 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(true)}
                >
                  <ChevronDown className="h-4 w-4" />
                  Voir plus ({activities.length - INITIAL_LIMIT} de plus)
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
