"use client";

import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { AccountSettings } from "@/components/settings/account-settings";
import { SubscriptionSettings } from "@/components/settings/subscription-settings";
import { Spinner } from "@/components/ui/spinner";
import { User, Shield, CreditCard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "profile", label: "Profil", icon: User },
  { id: "account", label: "Compte", icon: Shield },
  { id: "subscription", label: "Abonnement", icon: CreditCard },
  { id: "preferences", label: "Préférences", icon: Settings },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function SettingsPage() {
  const { user, profile, loading, refreshProfile } = useUser();
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Gérez votre profil, compte et préférences.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === tab.id
                ? "border-[#0B6E4F] text-[#0B6E4F]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "profile" && user && profile && (
        <ProfileSettings profile={profile} onSaved={refreshProfile} />
      )}
      {activeTab === "account" && user && (
        <AccountSettings />
      )}
      {activeTab === "subscription" && (
        <SubscriptionSettings />
      )}
      {activeTab === "preferences" && profile && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Préférences
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Les préférences avancées (notifications par email, thème sombre, etc.) seront bientôt disponibles.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
