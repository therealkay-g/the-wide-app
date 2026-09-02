# WIDE 🇨🇩

**Retrouver nos racines. Préserver notre histoire. Transmettre notre héritage.**

WIDE est une plateforme de généalogie et de mémoire familiale conçue pour les familles de la RDC et d'Afrique.

## Fonctionnalités

- **Arbre généalogique interactif** - Construction et visualisation d'arbres familiaux
- **Gestion des personnes** - Fiches détaillées avec origines congolaises
- **Relations familiales** - Parents, conjoints, enfants, frères et sœurs
- **Événements** - Naissances, mariages, décès, migrations
- **Documents et photos** - Stockage sécurisé via Supabase Storage
- **Sources** - État civil, archives, témoignages
- **Témoignages oraux** - Enregistrement et transcription
- **Chronologie** - Vue chronologique des événements
- **Carte** - Visualisation des lieux d'origine en Afrique
- **Migrations** - Suivi des déplacements familiaux
- **Recherches** - Outil de recherche généalogique
- **Histoires familiales** - Éditeur de récits
- **Livres familiaux** - Génération de livres
- **Import/Export GEDCOM** - Compatibilité standard
- **Collaboration** - Invitation et gestion des membres
- **Multi-langues** - Français, Lingala, Swahili, Kikongo, Tshiluba, Anglais

## Stack technique

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL, Auth, Storage, RLS, Realtime)
- **Icônes**: Lucide React

## Installation

### Prérequis

- Node.js 18+
- npm
- Un projet Supabase (gratuit sur supabase.com)

### Configuration

1. Cloner le projet
2. Installer les dépendances:
   ```bash
   cd wide
   npm install
   ```
3. Configurer les variables d'environnement:
   ```bash
   cp .env.example .env.local
   ```
4. Remplir les valeurs Supabase dans `.env.local`

### Base de données

1. Exécuter les migrations Supabase:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
2. Optionnellement charger les données de démonstration:
   - `supabase/seed.sql`

### Lancement

```bash
npm run dev
```

L'application sera disponible sur http://localhost:3000

## Structure du projet

```
wide/
├── src/
│   ├── app/           # Pages Next.js (App Router)
│   │   ├── (auth)/    # Pages d'authentification
│   │   ├── (dashboard)/ # Pages principales
│   │   └── admin/     # Administration
│   ├── components/    # Composants React
│   │   ├── ui/        # Composants UI réutilisables
│   │   ├── layout/    # Layout, navigation
│   │   ├── tree/      # Arbre généalogique
│   │   ├── persons/   # Gestion des personnes
│   │   ├── families/  # Gestion des familles
│   │   ├── documents/ # Documents et photos
│   │   ├── sources/   # Sources
│   │   ├── testimonies/ # Témoignages
│   │   ├── timeline/  # Chronologie
│   │   ├── map/       # Carte et lieux
│   │   ├── research/  # Recherches
│   │   ├── stories/   # Histoires et livres
│   │   ├── notifications/ # Notifications
│   │   └── settings/  # Paramètres
│   ├── lib/           # Utilitaires
│   │   ├── supabase/  # Client Supabase
│   │   ├── genealogy/ # Logique généalogique
│   │   └── utils.ts   # Fonctions utilitaires
│   ├── services/      # Services Supabase
│   ├── hooks/         # Hooks React
│   └── types/         # Types TypeScript
├── supabase/
│   ├── migrations/    # Migrations SQL
│   └── seed.sql       # Données de démonstration
└── docs/              # Documentation
```

## Modèle de données

Tables principales:
- **profiles** - Profils utilisateurs
- **families** - Familles
- **family_members** - Membres de famille avec rôles
- **trees** - Arbres généalogiques
- **persons** - Personnes avec informations détaillées
- **relationships** - Relations familiales
- **events** - Événements (naissances, mariages, etc.)
- **places** - Lieux (structure géographique RDC)
- **sources** - Sources documentaires
- **documents** - Documents et photos
- **testimonies** - Témoignages oraux
- **stories** - Histoires familiales
- **researches** - Recherches généalogiques

## Sécurité

- Row Level Security (RLS) sur toutes les tables
- Authentification via Supabase Auth
- Contrôle d'accès par rôle (OWNER, ADMIN, EDITOR, CONTRIBUTOR, VIEWER)
- URLs signées pour les fichiers privés

## Déploiement

### Vercel (recommandé)

```bash
npm run build
```

Puis déployer sur Vercel avec les variables d'environnement.

## Licence

Projet privé - Tous droits réservés
