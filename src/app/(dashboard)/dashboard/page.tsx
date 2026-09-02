"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingPage } from "@/components/ui/status";
import { EmptyState } from "@/components/ui/status";
import {
  Users,
  TreePine,
  FileText,
  Mic,
  Search,
  BookOpen,
  Plus,
  ArrowRight,
  AlertTriangle,
  Clock,
  MapPin,
} from "lucide-react";

interface DashboardStats {
  families: number;
  persons: number;
  documents: number;
  testimonies: number;
  sources: number;
  events: number;
  incompletePersons: number;
}

export default function DashboardPage() {
  const { user, profile, loading: userLoading } = useUser();
  const [stats, setStats] = useState<DashboardStats>({
    families: 0,
    persons: 0,
    documents: 0,
    testimonies: 0,
    sources: 0,
    events: 0,
    incompletePersons: 0,
  });
  const [recentPersons, setRecentPersons] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchDashboard() {
      if (!user) return;

      const [familiesRes, personsRes, docsRes, testRes, sourcesRes, eventsRes, activitiesRes] =
        await Promise.all([
          supabase.from("families").select("id", { count: "exact", head: true }),
          supabase.from("persons").select("id", { count: "exact", head: true }),
          supabase.from("documents").select("id", { count: "exact", head: true }),
          supabase.from("testimonies").select("id", { count: "exact", head: true }),
          supabase.from("sources").select("id", { count: "exact", head: true }),
          supabase.from("events").select("id", { count: "exact", head: true }),
          supabase
            .from("activities")
            .select("*, profiles:user_id(first_name, last_name)")
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

      const { count: incompleteCount } = await supabase
        .from("persons")
        .select("id", { count: "exact", head: true })
        .or("birth_date.is.null,death_date.is.null,gender.is.null");

      setStats({
        families: familiesRes.count || 0,
        persons: personsRes.count || 0,
        documents: docsRes.count || 0,
        testimonies: testRes.count || 0,
        sources: sourcesRes.count || 0,
        events: eventsRes.count || 0,
        incompletePersons: incompleteCount || 0,
      });

      setRecentActivities(activitiesRes.data || []);
      setLoading(false);
    }

    fetchDashboard();
  }, [user]);

  if (userLoading || loading) return <LoadingPage />;

  const statCards = [
    { label: "Familles", value: stats.families, icon: Users, href: "/families", color: "text-blue-600 bg-blue-100" },
    { label: "Personnes", value: stats.persons, icon: Users, href: "/persons", color: "text-green-600 bg-green-100" },
    { label: "Documents", value: stats.documents, icon: FileText, href: "/documents", color: "text-purple-600 bg-purple-100" },
    { label: "Témoignages", value: stats.testimonies, icon: Mic, href: "/testimonies", color: "text-orange-600 bg-orange-100" },
    { label: "Sources", value: stats.sources, icon: BookOpen, href: "/sources", color: "text-cyan-600 bg-cyan-100" },
    { label: "Événements", value: stats.events, icon: Clock, href: "/timeline", color: "text-rose-600 bg-rose-100" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bonjour, {profile?.first_name || "Bienvenue"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Voici un aperçu de votre généalogie familiale
          </p>
        </div>
        {stats.families === 0 && (
          <Link href="/families/new">
            <Button>
              <Plus className="h-4 w-4" />
              Créer une famille
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Incomplete data alert */}
      {stats.incompletePersons > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Informations incomplètes
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {stats.incompletePersons} personne(s) ont des informations manquantes
                </p>
              </div>
              <Link href="/persons">
                <Button variant="outline" size="sm">
                  Compléter
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main content */}
      {stats.families === 0 ? (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="Bienvenue sur WIDE"
              description="Commencez par créer votre première famille pour construire votre arbre généalogique."
              action={
                <Link href="/families/new">
                  <Button size="lg">
                    <Plus className="h-5 w-5" />
                    Créer ma première famille
                  </Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Quick access */}
          <Card>
            <CardHeader>
              <CardTitle>Accès rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/families" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <Users className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Mes familles</p>
                  <p className="text-xs text-gray-500">{stats.families} famille(s)</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>
              <Link href="/trees" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <TreePine className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Mes arbres</p>
                  <p className="text-xs text-gray-500">Arbres généalogiques</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>
              <Link href="/persons" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <Users className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Personnes</p>
                  <p className="text-xs text-gray-500">{stats.persons} personne(s)</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>
              <Link href="/timeline" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <Clock className="h-5 w-5 text-rose-600" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Chronologie</p>
                  <p className="text-xs text-gray-500">{stats.events} événement(s)</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Aucune activité récente
                </p>
              ) : (
                <div className="space-y-3">
                  {recentActivities.slice(0, 8).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-[#0B6E4F] mt-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">
                            {activity.profiles?.first_name} {activity.profiles?.last_name}
                          </span>{" "}
                          {activity.action}
                          {activity.entity_name && (
                            <span className="font-medium"> {activity.entity_name}</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(activity.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
