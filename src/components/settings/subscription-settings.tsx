"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  X,
  Crown,
  Star,
  Zap,
  Users,
  HardDrive,
  TreePine,
  BookOpen,
  Sparkles,
} from "lucide-react";

interface PlanFeature {
  label: string;
  free: string | boolean;
  standard: string | boolean;
  premium: string | boolean;
}

const plans = [
  {
    id: "FREE",
    name: "Gratuit",
    price: "0",
    icon: Zap,
    color: "gray",
  },
  {
    id: "STANDARD",
    name: "Standard",
    price: "9.99",
    icon: Star,
    color: "blue",
  },
  {
    id: "PREMIUM",
    name: "Premium",
    price: "19.99",
    icon: Crown,
    color: "purple",
  },
] as const;

const features: PlanFeature[] = [
  {
    label: "Personnes",
    free: "50",
    standard: "500",
    premium: "Illimité",
  },
  {
    label: "Stockage",
    free: "500 Mo",
    standard: "5 Go",
    premium: "50 Go",
  },
  {
    label: "Arbres généalogiques",
    free: "1",
    standard: "10",
    premium: "Illimité",
  },
  {
    label: "Collaboration familiale",
    free: false,
    standard: true,
    premium: true,
  },
  {
    label: "Documents et photos",
    free: true,
    standard: true,
    premium: true,
  },
  {
    label: "Témoignages audio",
    free: true,
    standard: true,
    premium: true,
  },
  {
    label: "Recherche IA",
    free: false,
    standard: false,
    premium: true,
  },
  {
    label: "Génération de livres",
    free: false,
    standard: false,
    premium: true,
  },
  {
    label: "Support prioritaire",
    free: false,
    standard: false,
    premium: true,
  },
];

export function SubscriptionSettings() {
  const handleUpgrade = () => {
    alert("Le paiement en ligne sera bientôt disponible. Restez à l'écoute !");
  };

  return (
    <div className="space-y-6">
      {/* Current plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Plan actuel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <Zap className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="font-semibold text-lg">Gratuit</p>
                <p className="text-sm text-gray-500">Votre plan actuel</p>
              </div>
            </div>
            <Badge variant="secondary">Actif</Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                <strong>50</strong> personnes max
              </span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                <strong>500 Mo</strong> de stockage
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TreePine className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                <strong>1</strong> arbre
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Comparer les plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 font-medium text-gray-500">
                    Fonctionnalité
                  </th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="text-center py-3 px-2">
                      <div className="flex flex-col items-center gap-1">
                        <plan.icon className="h-5 w-5 text-gray-600" />
                        <span className="font-medium">{plan.name}</span>
                        <span className="text-xs text-gray-500">
                          {plan.price} €/mois
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((feature) => (
                  <tr
                    key={feature.label}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="py-3 px-2 text-gray-700 dark:text-gray-300">
                      {feature.label}
                    </td>
                    {(["free", "standard", "premium"] as const).map((planKey) => (
                      <td key={planKey} className="text-center py-3 px-2">
                        {typeof feature[planKey] === "boolean" ? (
                          feature[planKey] ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300 mx-auto" />
                          )
                        ) : (
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {feature[planKey]}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleUpgrade}
            >
              <Star className="h-4 w-4" />
              Passer à Standard — 9.99 €/mois
            </Button>
            <Button
              className="flex-1"
              onClick={handleUpgrade}
            >
              <Crown className="h-4 w-4" />
              Passer à Premium — 19.99 €/mois
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HardDrive className="h-4 w-4" />
            Utilisation actuelle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Personnes</span>
                <span className="font-medium">— / 50</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-[#0B6E4F] rounded-full" style={{ width: "0%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Stockage</span>
                <span className="font-medium">— / 500 Mo</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-[#0B6E4F] rounded-full" style={{ width: "0%" }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
