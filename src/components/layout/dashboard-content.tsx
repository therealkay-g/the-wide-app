"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Home,
  FileText,
  BookOpen,
  Mic,
  UserPlus,
  TreePine,
  Upload,
  AlertTriangle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/types";

interface Stats {
  persons: number;
  families: number;
  documents: number;
  sources: number;
  testimonies: number;
}

interface Activity {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
}

interface DashboardContentProps {
  profile: Profile;
}

export function DashboardContent({ profile }: DashboardContentProps) {
  const [stats, setStats] = useState<Stats>({
    persons: 0,
    families: 0,
    documents: 0,
    sources: 0,
    testimonies: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchDashboardData() {
      const [personsRes, familiesRes, docsRes, sourcesRes, testRes] =
        await Promise.all([
          supabase.from("persons").select("id", { count: "exact", head: true }),
          supabase.from("families").select("id", { count: "exact", head: true }),
          supabase.from("documents").select("id", { count: "exact", head: true }),
          supabase.from("sources").select("id", { count: "exact", head: true }),
          supabase.from("testimonies").select("id", { count: "exact", head: true }),
        ]);

      setStats({
        persons: personsRes.count ?? 0,
        families: familiesRes.count ?? 0,
        documents: docsRes.count ?? 0,
        sources: sourcesRes.count ?? 0,
        testimonies: testRes.count ?? 0,
      });

      const { data: activity } = await supabase
        .from("activity")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentActivity(activity ?? []);
      setLoading(false);
    }

    fetchDashboardData();
  }, [supabase]);

  const statCards = [
    { label: "Personnes", value: stats.persons, icon: Users, href: "/persons", color: "text-amber-600 bg-amber-50" },
    { label: "Familles", value: stats.families, icon: Home, href: "/families", color: "text-emerald-600 bg-emerald-50" },
    { label: "Documents", value: stats.documents, icon: FileText, href: "/documents", color: "text-blue-600 bg-blue-50" },
    { label: "Sources", value: stats.sources, icon: BookOpen, href: "/sources", color: "text-purple-600 bg-purple-50" },
    { label: "Temoignages", value: stats.testimonies, icon: Mic, href: "/testimonies", color: "text-orange-600 bg-orange-50" },
  ];

  const quickActions = [
    { label: "Ajouter une personne", href: "/persons/new", icon: UserPlus, color: "bg-amber-500 hover:bg-amber-600" },
    { label: "Creer un arbre", href: "/trees/new", icon: TreePine, color: "bg-emerald-600 hover:bg-emerald-700" },
    { label: "Uploader un document", href: "/documents/new", icon: Upload, color: "bg-blue-600 hover:bg-blue-700" },
  ];

  const incompleteAlerts = [
    stats.persons === 0 && "Aucune personne enregistree. Commencez par ajouter des membres de votre famille.",
    stats.families === 0 && "Aucune famille creee. Creez votre premiere famille pour commencer.",
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {profile.first_name ?? "cher utilisateur"} !
        </h1>
        <p className="text-gray-500 mt-1">
          Voici un apercu de votre genealogie.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        {card.label}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {loading ? "..." : card.value}
                      </p>
                    </div>
                    <div className={`p-2.5 rounded-lg ${card.color}`}>
                      <Icon size={22} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {incompleteAlerts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={20} />
              <div className="space-y-1">
                {incompleteAlerts.map((alert, i) => (
                  <p key={i} className="text-sm text-amber-800">
                    {alert}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Actions rapides
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`${action.color} text-white rounded-lg p-4 flex items-center gap-3 transition-colors shadow-sm`}
              >
                <Icon size={20} />
                <span className="font-medium text-sm">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock size={18} />
              Activite recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex gap-3">
                    <div className="h-8 w-8 rounded bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-2 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">
                Aucune activite recente.
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-700 truncate">
                        {item.action}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(item.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp size={18} />
              Apercu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Personnes totales</span>
                <span className="font-semibold text-gray-900">
                  {loading ? "..." : stats.persons}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Familles actives</span>
                <span className="font-semibold text-gray-900">
                  {loading ? "..." : stats.families}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Documents</span>
                <span className="font-semibold text-gray-900">
                  {loading ? "..." : stats.documents}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Sources citees</span>
                <span className="font-semibold text-gray-900">
                  {loading ? "..." : stats.sources}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
