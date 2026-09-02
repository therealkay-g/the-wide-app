"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Users, Lock, Eye, Globe } from "lucide-react";
import type { Family, Visibility } from "@/types";

interface FamilyCardProps {
  family: Family;
  memberCount?: number;
  onClick?: () => void;
}

const privacyConfig: Record<
  Visibility,
  { label: string; icon: React.ReactNode; variant: "outline" | "secondary" | "info" }
> = {
  private: { label: "Privée", icon: <Lock className="h-3 w-3" />, variant: "outline" },
  family: { label: "Famille", icon: <Eye className="h-3 w-3" />, variant: "secondary" },
  public: { label: "Publique", icon: <Globe className="h-3 w-3" />, variant: "info" },
};

export function FamilyCard({ family, memberCount, onClick }: FamilyCardProps) {
  const privacy = privacyConfig[family.privacy] ?? privacyConfig.private;

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer h-full"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar
              src={family.photo_url}
              firstName={family.name}
              size="lg"
            />
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {family.name}
              </h3>
              <Badge variant={privacy.variant} className="mt-1">
                {privacy.icon}
                <span className="ml-1">{privacy.label}</span>
              </Badge>
            </div>
          </div>
        </div>

        {family.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
            {family.description}
          </p>
        )}

        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Users className="h-4 w-4" />
          <span>{memberCount ?? 0} membre(s)</span>
        </div>
      </CardContent>
    </Card>
  );
}
