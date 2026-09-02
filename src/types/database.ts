export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          country: string | null;
          language: string;
          timezone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          country?: string | null;
          language?: string;
          timezone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          country?: string | null;
          language?: string;
          timezone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      families: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          photo_url: string | null;
          origin_place_id: string | null;
          privacy: "private" | "family" | "public";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
          photo_url?: string | null;
          origin_place_id?: string | null;
          privacy?: "private" | "family" | "public";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          description?: string | null;
          photo_url?: string | null;
          origin_place_id?: string | null;
          privacy?: "private" | "family" | "public";
          created_at?: string;
          updated_at?: string;
        };
      };
      family_members: {
        Row: {
          family_id: string;
          user_id: string;
          role: "OWNER" | "ADMIN" | "EDITOR" | "CONTRIBUTOR" | "VIEWER";
          joined_at: string;
        };
        Insert: {
          family_id: string;
          user_id: string;
          role?: "OWNER" | "ADMIN" | "EDITOR" | "CONTRIBUTOR" | "VIEWER";
          joined_at?: string;
        };
        Update: {
          family_id?: string;
          user_id?: string;
          role?: "OWNER" | "ADMIN" | "EDITOR" | "CONTRIBUTOR" | "VIEWER";
          joined_at?: string;
        };
      };
      trees: {
        Row: {
          id: string;
          family_id: string;
          name: string;
          description: string | null;
          visibility: "private" | "family" | "public";
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          name: string;
          description?: string | null;
          visibility?: "private" | "family" | "public";
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          name?: string;
          description?: string | null;
          visibility?: "private" | "family" | "public";
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      persons: {
        Row: {
          id: string;
          tree_id: string;
          family_id: string;
          first_name: string | null;
          middle_name: string | null;
          last_name: string | null;
          post_name: string | null;
          nickname: string | null;
          traditional_name: string | null;
          gender: "male" | "female" | "other" | "unknown" | null;
          profile_photo: string | null;
          birth_date: string | null;
          birth_date_precision: DatePrecision;
          birth_place_id: string | null;
          death_date: string | null;
          death_date_precision: DatePrecision;
          death_place_id: string | null;
          burial_place_id: string | null;
          country: string | null;
          province: string | null;
          city: string | null;
          territory: string | null;
          sector: string | null;
          chiefdom: string | null;
          groupement: string | null;
          village: string | null;
          clan: string | null;
          lineage: string | null;
          family_origin: string | null;
          notes: string | null;
          certainty: CertaintyLevel;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tree_id: string;
          family_id: string;
          first_name?: string | null;
          middle_name?: string | null;
          last_name?: string | null;
          post_name?: string | null;
          nickname?: string | null;
          traditional_name?: string | null;
          gender?: "male" | "female" | "other" | "unknown" | null;
          profile_photo?: string | null;
          birth_date?: string | null;
          birth_date_precision?: DatePrecision;
          birth_place_id?: string | null;
          death_date?: string | null;
          death_date_precision?: DatePrecision;
          death_place_id?: string | null;
          burial_place_id?: string | null;
          country?: string | null;
          province?: string | null;
          city?: string | null;
          territory?: string | null;
          sector?: string | null;
          chiefdom?: string | null;
          groupement?: string | null;
          village?: string | null;
          clan?: string | null;
          lineage?: string | null;
          family_origin?: string | null;
          notes?: string | null;
          certainty?: CertaintyLevel;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tree_id?: string;
          family_id?: string;
          first_name?: string | null;
          middle_name?: string | null;
          last_name?: string | null;
          post_name?: string | null;
          nickname?: string | null;
          traditional_name?: string | null;
          gender?: "male" | "female" | "other" | "unknown" | null;
          profile_photo?: string | null;
          birth_date?: string | null;
          birth_date_precision?: DatePrecision;
          birth_place_id?: string | null;
          death_date?: string | null;
          death_date_precision?: DatePrecision;
          death_place_id?: string | null;
          burial_place_id?: string | null;
          country?: string | null;
          province?: string | null;
          city?: string | null;
          territory?: string | null;
          sector?: string | null;
          chiefdom?: string | null;
          groupement?: string | null;
          village?: string | null;
          clan?: string | null;
          lineage?: string | null;
          family_origin?: string | null;
          notes?: string | null;
          certainty?: CertaintyLevel;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      relationships: {
        Row: {
          id: string;
          person_id: string;
          related_person_id: string;
          relationship_type: RelationshipType;
          certainty: CertaintyLevel;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          person_id: string;
          related_person_id: string;
          relationship_type: RelationshipType;
          certainty?: CertaintyLevel;
          notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          person_id?: string;
          related_person_id?: string;
          relationship_type?: RelationshipType;
          certainty?: CertaintyLevel;
          notes?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          person_id: string;
          family_id: string;
          event_type: EventType;
          date_value: string | null;
          date_precision: DatePrecision;
          place_id: string | null;
          description: string | null;
          source_id: string | null;
          certainty: CertaintyLevel;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          person_id: string;
          family_id: string;
          event_type: EventType;
          date_value?: string | null;
          date_precision?: DatePrecision;
          place_id?: string | null;
          description?: string | null;
          source_id?: string | null;
          certainty?: CertaintyLevel;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          person_id?: string;
          family_id?: string;
          event_type?: EventType;
          date_value?: string | null;
          date_precision?: DatePrecision;
          place_id?: string | null;
          description?: string | null;
          source_id?: string | null;
          certainty?: CertaintyLevel;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      places: {
        Row: {
          id: string;
          family_id: string;
          name: string;
          country: string | null;
          province: string | null;
          city: string | null;
          territory: string | null;
          sector: string | null;
          chiefdom: string | null;
          groupement: string | null;
          village: string | null;
          former_name: string | null;
          alternative_name: string | null;
          latitude: number | null;
          longitude: number | null;
          description: string | null;
          historical_period: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          name: string;
          country?: string | null;
          province?: string | null;
          city?: string | null;
          territory?: string | null;
          sector?: string | null;
          chiefdom?: string | null;
          groupement?: string | null;
          village?: string | null;
          former_name?: string | null;
          alternative_name?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          description?: string | null;
          historical_period?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          name?: string;
          country?: string | null;
          province?: string | null;
          city?: string | null;
          territory?: string | null;
          sector?: string | null;
          chiefdom?: string | null;
          groupement?: string | null;
          village?: string | null;
          former_name?: string | null;
          alternative_name?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          description?: string | null;
          historical_period?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      sources: {
        Row: {
          id: string;
          family_id: string;
          title: string;
          type: SourceType;
          author: string | null;
          institution: string | null;
          date: string | null;
          reference_number: string | null;
          url: string | null;
          description: string | null;
          reliability: CertaintyLevel;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          title: string;
          type: SourceType;
          author?: string | null;
          institution?: string | null;
          date?: string | null;
          reference_number?: string | null;
          url?: string | null;
          description?: string | null;
          reliability?: CertaintyLevel;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          title?: string;
          type?: SourceType;
          author?: string | null;
          institution?: string | null;
          date?: string | null;
          reference_number?: string | null;
          url?: string | null;
          description?: string | null;
          reliability?: CertaintyLevel;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          family_id: string;
          owner_id: string;
          file_name: string;
          storage_path: string;
          mime_type: string;
          file_size: number;
          category: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          owner_id: string;
          file_name: string;
          storage_path: string;
          mime_type: string;
          file_size: number;
          category?: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          owner_id?: string;
          file_name?: string;
          storage_path?: string;
          mime_type?: string;
          file_size?: number;
          category?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      document_persons: {
        Row: {
          document_id: string;
          person_id: string;
          relation_type: string | null;
        };
        Insert: {
          document_id: string;
          person_id: string;
          relation_type?: string | null;
        };
        Update: {
          document_id?: string;
          person_id?: string;
          relation_type?: string | null;
        };
      };
      testimonies: {
        Row: {
          id: string;
          family_id: string;
          person_id: string | null;
          witness_person_id: string | null;
          witness_name: string | null;
          witness_relation: string | null;
          language: string | null;
          testimony_date: string | null;
          audio_path: string | null;
          transcription: string | null;
          title: string | null;
          description: string | null;
          certainty: CertaintyLevel;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          person_id?: string | null;
          witness_person_id?: string | null;
          witness_name?: string | null;
          witness_relation?: string | null;
          language?: string | null;
          testimony_date?: string | null;
          audio_path?: string | null;
          transcription?: string | null;
          title?: string | null;
          description?: string | null;
          certainty?: CertaintyLevel;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          person_id?: string | null;
          witness_person_id?: string | null;
          witness_name?: string | null;
          witness_relation?: string | null;
          language?: string | null;
          testimony_date?: string | null;
          audio_path?: string | null;
          transcription?: string | null;
          title?: string | null;
          description?: string | null;
          certainty?: CertaintyLevel;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      stories: {
        Row: {
          id: string;
          family_id: string;
          title: string;
          content: string | null;
          author_id: string;
          visibility: "private" | "family" | "public";
          cover_photo: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          title: string;
          content?: string | null;
          author_id: string;
          visibility?: "private" | "family" | "public";
          cover_photo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          title?: string;
          content?: string | null;
          author_id?: string;
          visibility?: "private" | "family" | "public";
          cover_photo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      researches: {
        Row: {
          id: string;
          family_id: string;
          person_id: string | null;
          question: string;
          hypothesis: string | null;
          period_start: string | null;
          period_end: string | null;
          place: string | null;
          sources_consulted: string | null;
          results: string | null;
          status: "TODO" | "IN_PROGRESS" | "RESOLVED" | "NO_RESULT" | "ABANDONED";
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          person_id?: string | null;
          question: string;
          hypothesis?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          place?: string | null;
          sources_consulted?: string | null;
          results?: string | null;
          status?: "TODO" | "IN_PROGRESS" | "RESOLVED" | "NO_RESULT" | "ABANDONED";
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          person_id?: string | null;
          question?: string;
          hypothesis?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          place?: string | null;
          sources_consulted?: string | null;
          results?: string | null;
          status?: "TODO" | "IN_PROGRESS" | "RESOLVED" | "NO_RESULT" | "ABANDONED";
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      family_migrations: {
        Row: {
          id: string;
          person_id: string;
          family_id: string;
          origin_place: string;
          destination_place: string;
          origin_place_id: string | null;
          destination_place_id: string | null;
          date_start: string | null;
          date_end: string | null;
          reason: string | null;
          source_id: string | null;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          person_id: string;
          family_id: string;
          origin_place: string;
          destination_place: string;
          origin_place_id?: string | null;
          destination_place_id?: string | null;
          date_start?: string | null;
          date_end?: string | null;
          reason?: string | null;
          source_id?: string | null;
          notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          person_id?: string;
          family_id?: string;
          origin_place?: string;
          destination_place?: string;
          origin_place_id?: string | null;
          destination_place_id?: string | null;
          date_start?: string | null;
          date_end?: string | null;
          reason?: string | null;
          source_id?: string | null;
          notes?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      invitations: {
        Row: {
          id: string;
          family_id: string;
          email: string;
          role: "ADMIN" | "EDITOR" | "CONTRIBUTOR" | "VIEWER";
          invited_by: string;
          status: "pending" | "accepted" | "declined" | "expired";
          token: string;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          email: string;
          role?: "ADMIN" | "EDITOR" | "CONTRIBUTOR" | "VIEWER";
          invited_by: string;
          status?: "pending" | "accepted" | "declined" | "expired";
          token: string;
          created_at?: string;
          expires_at: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          email?: string;
          role?: "ADMIN" | "EDITOR" | "CONTRIBUTOR" | "VIEWER";
          invited_by?: string;
          status?: "pending" | "accepted" | "declined" | "expired";
          token?: string;
          created_at?: string;
          expires_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          link: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          link?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string;
          link?: string | null;
          read?: boolean;
          created_at?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          family_id: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          entity_name: string | null;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          entity_name?: string | null;
          details?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          user_id?: string;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          entity_name?: string | null;
          details?: Json | null;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: "FREE" | "STANDARD" | "PREMIUM";
          status: "active" | "canceled" | "past_due" | "trialing";
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan?: "FREE" | "STANDARD" | "PREMIUM";
          status?: "active" | "canceled" | "past_due" | "trialing";
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: "FREE" | "STANDARD" | "PREMIUM";
          status?: "active" | "canceled" | "past_due" | "trialing";
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Enums: {
      date_precision: "EXACT" | "YEAR" | "MONTH" | "APPROXIMATE" | "BEFORE" | "AFTER" | "RANGE" | "UNKNOWN";
      certainty_level: "VERIFIED" | "CONFIRMED" | "FAMILY_TESTIMONY" | "PROBABLE" | "HYPOTHESIS" | "CONTRADICTORY" | "UNKNOWN";
      relationship_type: "BIOLOGICAL_PARENT" | "ADOPTIVE_PARENT" | "STEP_PARENT" | "SPOUSE" | "FORMER_SPOUSE" | "CHILD" | "ADOPTED_CHILD" | "SIBLING" | "HALF_SIBLING";
      event_type: "BIRTH" | "BAPTISM" | "MARRIAGE" | "DEATH" | "RESIDENCE" | "MIGRATION" | "EDUCATION" | "PROFESSION" | "MILITARY" | "FAMILY_EVENT" | "OTHER";
      source_type: "CIVIL_REGISTRY" | "RELIGIOUS_REGISTRY" | "ARCHIVE" | "ADMIN_DOCUMENT" | "MILITARY_DOCUMENT" | "SCHOOL_DOCUMENT" | "PHOTOGRAPH" | "TESTIMONY" | "BOOK" | "ARTICLE" | "OTHER";
    };
  };
};

export type DatePrecision = Database["public"]["Enums"]["date_precision"];
export type CertaintyLevel = Database["public"]["Enums"]["certainty_level"];
export type RelationshipType = Database["public"]["Enums"]["relationship_type"];
export type EventType = Database["public"]["Enums"]["event_type"];
export type SourceType = Database["public"]["Enums"]["source_type"];

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
