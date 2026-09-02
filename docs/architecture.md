# Architecture technique de WIDE

## Vue d'ensemble

WIDE utilise une architecture client-serveur avec Next.js côté client et Supabase comme backend.

## Frontend

### Next.js App Router
- Pages servies côté serveur (SSR) pour l'auth et le dashboard
- Composants clients pour les interactions
- Routes protégées via middleware

### State Management
- React hooks (useState, useEffect)
- Supabase Realtime pour les mises à jour en temps réel
- Pas de state management externe (Redux/Zustand) pour garder la simplicité

## Backend (Supabase)

### PostgreSQL
- Tables avec contraintes d'intégrité
- Index pour les performances
- Triggers pour les timestamps automatiques

### Row Level Security (RLS)
- Politiques par table
- Fonctions helper: is_family_member, get_family_role, can_edit_family
- Aucune donnée exposée sans autorisation

### Storage
- Buckets: avatars, photos, documents, audio, videos
- URLs signées pour l'accès privé
- Validation des types MIME

### Auth
- Email/password
- Sessions via cookies HTTP-only
- Middleware de protection des routes

## Généalogie

### Modèle de données
- Personnes avec informations culturelles africaines (clan, lignée, village ancestral)
- Relations bidirectionales (parent→enfant et enfant→parent)
- Dates avec niveaux de précision (exacte, année, approximative, avant/après)
- Niveaux de certitude (vérifié, confirmé, témoignage, probable, hypothèse)

### Arbre interactif
- Rendu SVG
- Algorithme BFS pour le positionnement
- Zoom, pan, sélection
