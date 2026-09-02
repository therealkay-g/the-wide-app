# Base de données WIDE

## Tables

### profiles
Profil utilisateur lié à auth.users.

### families
Familles avec confidentialité configurable.

### family_members
Membres de famille avec rôles (OWNER, ADMIN, EDITOR, CONTRIBUTOR, VIEWER).

### trees
Arbres généalogiques au sein d'une famille.

### persons
Personnes avec informations complètes:
- Identité (nom, prénom, postnom, surnom, nom traditionnel)
- Naissance/décès avec précision variable
- Origines (province, territoire, secteur, chefferie, groupement, village)
- Clan, lignée, famille d'origine (optionnel)
- Niveau de certitude

### relationships
Relations familiales bidirectionales:
- BIOLOGICAL_PARENT, ADOPTIVE_PARENT, STEP_PARENT
- SPOUSE, FORMER_SPOUSE
- CHILD, ADOPTED_CHILD
- SIBLING, HALF_SIBLING

### events
Événements liés à une personne:
- BIRTH, BAPTISM, MARRIAGE, DEATH
- RESIDENCE, MIGRATION, EDUCATION, OCCUPATION
- MILITARY_SERVICE, FAMILY_EVENT, OTHER

### places
Lieux avec structure géographique flexible:
- Pays, Province, Ville, Territoire, Secteur, Chefferie, Groupement, Village
- Coordonnées GPS
- Ancien nom, nom alternatif
- Période historique

### sources
Sources de documentation.

### documents
Documents stockés dans Supabase Storage.

### testimonies
Témoignages oraux avec transcription.

### stories
Histoires familiales avec sections.

### researches
Recherches généalogiques avec statut.
