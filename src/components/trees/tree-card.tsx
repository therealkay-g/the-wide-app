"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TreePine, Users, Eye, EyeOff, Lock } from "lucide-react";
import type { Tree, Visibility } from "@/types";

interface TreeCardProps {
  tree: Tree;
  personCount: number;
  onClick?: () => void;
}

function visibilityBadge(variant: Visibility) {
  switch (variant) {
    case "public":
      return (
        <Badge variant="success">
          <Eye className="h-3 w-3 mr-1" />
          Public
        </Badge>
      );
    case "family":
      return (
        <Badge variant="info">
          <Users className="h-3 w-3 mr-1" />
          Famille
        </Badge>
      );
    case "private":
      return (
        <Badge variant="secondary">
          <Lock className="h-3 w-3 mr-1" />
          Privé
        </Badge>
      );
  }
}

export function TreeCard({ tree, personCount, onClick }: TreeCardProps) {
  return (
    <Card
      className="hover:shadow-md hover:border-[#0B6E4F]/30 transition-all duration-200 cursor-pointer h-full group"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base group-hover:text-[#0B6E4F] transition-colors">
            {tree.name}
          </CardTitle>
          {visibilityBadge(tree.visibility)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {tree.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {tree.description}
          </p>
        )}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>
              {personCount} {personCount === 1 ? "personne" : "personnes"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <TreePine className="h-3.5 w-3.5" />
            <span>
              {new Date(tree.created_at).toLocaleDateString("fr-FR")}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
