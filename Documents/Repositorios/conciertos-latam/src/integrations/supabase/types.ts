export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ad_campaigns: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: Database["public"]["Enums"]["ad_campaign_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["ad_campaign_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["ad_campaign_status"]
          updated_at?: string
        }
        Relationships: []
      }
      ad_items: {
        Row: {
          active: boolean
          campaign_id: string
          clicks: number
          created_at: string
          display_order: number
          format: Database["public"]["Enums"]["ad_format"]
          id: string
          image_url: string
          impressions: number
          link_url: string | null
          location: string
          name: string
          position: Database["public"]["Enums"]["ad_position"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          campaign_id: string
          clicks?: number
          created_at?: string
          display_order?: number
          format?: Database["public"]["Enums"]["ad_format"]
          id?: string
          image_url: string
          impressions?: number
          link_url?: string | null
          location: string
          name: string
          position?: Database["public"]["Enums"]["ad_position"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          campaign_id?: string
          clicks?: number
          created_at?: string
          display_order?: number
          format?: Database["public"]["Enums"]["ad_format"]
          id?: string
          image_url?: string
          impressions?: number
          link_url?: string | null
          location?: string
          name?: string
          position?: Database["public"]["Enums"]["ad_position"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_items_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_read: boolean | null
          message: string | null
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      advertising_requests: {
        Row: {
          ad_type: string
          budget_range: string | null
          campaign_duration: string | null
          company_name: string
          contact_name: string
          created_at: string
          email: string
          id: string
          message: string | null
          phone: string | null
          status: string
          target_audience: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          ad_type: string
          budget_range?: string | null
          campaign_duration?: string | null
          company_name: string
          contact_name: string
          created_at?: string
          email: string
          id?: string
          message?: string | null
          phone?: string | null
          status?: string
          target_audience?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          ad_type?: string
          budget_range?: string | null
          campaign_duration?: string | null
          company_name?: string
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          phone?: string | null
          status?: string
          target_audience?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          name: string
          photo_url: string | null
          slug: string
          social_links: Json | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: string
          name: string
          photo_url?: string | null
          slug: string
          social_links?: Json | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          photo_url?: string | null
          slug?: string
          social_links?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          created_at: string
          criteria_type: string
          criteria_value: Json | null
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          criteria_type: string
          criteria_value?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          criteria_type?: string
          criteria_value?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          country_id: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          country_id: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          country_id?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          article_id: string | null
          content: string
          created_at: string
          id: string
          status: Database["public"]["Enums"]["comment_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          article_id?: string | null
          content: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["comment_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          article_id?: string | null
          content?: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["comment_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "concert_communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_messages: {
        Row: {
          community_id: string
          created_at: string | null
          id: string
          message: string
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string | null
          id?: string
          message: string
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string | null
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_messages_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "concert_communities"
            referencedColumns: ["id"]
          },
        ]
      }
      concert_communities: {
        Row: {
          concert_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          concert_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          concert_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "concert_communities_concert_id_fkey"
            columns: ["concert_id"]
            isOneToOne: true
            referencedRelation: "concerts"
            referencedColumns: ["id"]
          },
        ]
      }
      concert_invitations: {
        Row: {
          concert_id: string
          created_at: string
          id: string
          message: string | null
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          concert_id: string
          created_at?: string
          id?: string
          message?: string | null
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          concert_id?: string
          created_at?: string
          id?: string
          message?: string | null
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_concert"
            columns: ["concert_id"]
            isOneToOne: false
            referencedRelation: "concerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_receiver"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_receiver"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sender"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sender"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles_search"
            referencedColumns: ["id"]
          },
        ]
      }
      concerts: {
        Row: {
          artist_id: string | null
          created_at: string
          date: string | null
          description: string | null
          event_type: string
          id: string
          image_url: string | null
          is_featured: boolean | null
          promoter_id: string | null
          slug: string
          ticket_prices_html: string | null
          ticket_url: string | null
          title: string
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          artist_id?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          event_type?: string
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          promoter_id?: string | null
          slug: string
          ticket_prices_html?: string | null
          ticket_url?: string | null
          title: string
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          artist_id?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          event_type?: string
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          promoter_id?: string | null
          slug?: string
          ticket_prices_html?: string | null
          ticket_url?: string | null
          title?: string
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "concerts_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concerts_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concerts_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          continent: string
          created_at: string
          id: string
          iso_code: string
          name: string
          updated_at: string
        }
        Insert: {
          continent: string
          created_at?: string
          id?: string
          iso_code: string
          name: string
          updated_at?: string
        }
        Update: {
          continent?: string
          created_at?: string
          id?: string
          iso_code?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      fan_project_color_sequences: {
        Row: {
          created_at: string
          fan_project_song_id: string
          id: string
          mode: string
          sequence: Json
          venue_section_id: string
        }
        Insert: {
          created_at?: string
          fan_project_song_id: string
          id?: string
          mode?: string
          sequence: Json
          venue_section_id: string
        }
        Update: {
          created_at?: string
          fan_project_song_id?: string
          id?: string
          mode?: string
          sequence?: Json
          venue_section_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fan_project_color_sequences_fan_project_song_id_fkey"
            columns: ["fan_project_song_id"]
            isOneToOne: false
            referencedRelation: "fan_project_songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fan_project_color_sequences_venue_section_id_fkey"
            columns: ["venue_section_id"]
            isOneToOne: false
            referencedRelation: "venue_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      fan_project_participants: {
        Row: {
          created_at: string
          fan_project_id: string
          id: string
          updated_at: string
          user_id: string
          venue_section_id: string
        }
        Insert: {
          created_at?: string
          fan_project_id: string
          id?: string
          updated_at?: string
          user_id: string
          venue_section_id: string
        }
        Update: {
          created_at?: string
          fan_project_id?: string
          id?: string
          updated_at?: string
          user_id?: string
          venue_section_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fan_project_participants_fan_project_id_fkey"
            columns: ["fan_project_id"]
            isOneToOne: false
            referencedRelation: "fan_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fan_project_participants_venue_section_id_fkey"
            columns: ["venue_section_id"]
            isOneToOne: false
            referencedRelation: "venue_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      fan_project_songs: {
        Row: {
          artist_name: string | null
          created_at: string
          duration_seconds: number
          fan_project_id: string
          id: string
          position: number
          song_name: string
        }
        Insert: {
          artist_name?: string | null
          created_at?: string
          duration_seconds: number
          fan_project_id: string
          id?: string
          position?: number
          song_name: string
        }
        Update: {
          artist_name?: string | null
          created_at?: string
          duration_seconds?: number
          fan_project_id?: string
          id?: string
          position?: number
          song_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fan_project_songs_fan_project_id_fkey"
            columns: ["fan_project_id"]
            isOneToOne: false
            referencedRelation: "fan_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      fan_projects: {
        Row: {
          concert_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          instructions: string | null
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          concert_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          instructions?: string | null
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          concert_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          instructions?: string | null
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fan_projects_concert_id_fkey"
            columns: ["concert_id"]
            isOneToOne: false
            referencedRelation: "concerts"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_artists: {
        Row: {
          artist_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_artists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_concerts: {
        Row: {
          attendance_type: string | null
          concert_id: string
          created_at: string
          id: string
          is_favorite: boolean | null
          user_id: string
        }
        Insert: {
          attendance_type?: string | null
          concert_id: string
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          user_id: string
        }
        Update: {
          attendance_type?: string | null
          concert_id?: string
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_concerts_concert_id_fkey"
            columns: ["concert_id"]
            isOneToOne: false
            referencedRelation: "concerts"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_concerts: {
        Row: {
          admin_user_id: string | null
          concert_id: string | null
          created_at: string | null
          id: string
          position: number
          updated_at: string | null
        }
        Insert: {
          admin_user_id?: string | null
          concert_id?: string | null
          created_at?: string | null
          id?: string
          position: number
          updated_at?: string | null
        }
        Update: {
          admin_user_id?: string | null
          concert_id?: string | null
          created_at?: string | null
          id?: string
          position?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "featured_concerts_concert_id_fkey"
            columns: ["concert_id"]
            isOneToOne: true
            referencedRelation: "concerts"
            referencedColumns: ["id"]
          },
        ]
      }
      festival_artists: {
        Row: {
          artist_id: string
          concert_id: string
          created_at: string
          id: string
          position: number | null
        }
        Insert: {
          artist_id: string
          concert_id: string
          created_at?: string
          id?: string
          position?: number | null
        }
        Update: {
          artist_id?: string
          concert_id?: string
          created_at?: string
          id?: string
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "festival_artists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "festival_artists_concert_id_fkey"
            columns: ["concert_id"]
            isOneToOne: false
            referencedRelation: "concerts"
            referencedColumns: ["id"]
          },
        ]
      }
      festival_lineup: {
        Row: {
          artist_id: string
          created_at: string
          festival_id: string
          id: string
          performance_date: string | null
          position: number
          stage: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string
          festival_id: string
          id?: string
          performance_date?: string | null
          position?: number
          stage?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string
          festival_id?: string
          id?: string
          performance_date?: string | null
          position?: number
          stage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "festival_lineup_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "festival_lineup_festival_id_fkey"
            columns: ["festival_id"]
            isOneToOne: false
            referencedRelation: "festivals"
            referencedColumns: ["id"]
          },
        ]
      }
      festivals: {
        Row: {
          created_at: string
          description: string | null
          edition: number | null
          end_date: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          name: string
          promoter_id: string | null
          slug: string
          start_date: string
          ticket_prices_html: string | null
          ticket_url: string | null
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          edition?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          name: string
          promoter_id?: string | null
          slug: string
          start_date: string
          ticket_prices_html?: string | null
          ticket_url?: string | null
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          edition?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          name?: string
          promoter_id?: string | null
          slug?: string
          start_date?: string
          ticket_prices_html?: string | null
          ticket_url?: string | null
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "festivals_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "festivals_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_addressee"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_addressee"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_requester"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_requester"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles_search"
            referencedColumns: ["id"]
          },
        ]
      }
      media_items: {
        Row: {
          author_id: string | null
          created_at: string
          embed_code: string | null
          expires_at: string | null
          featured: boolean | null
          id: string
          media_url: string | null
          position: number | null
          status: string
          summary: string | null
          thumbnail_url: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          embed_code?: string | null
          expires_at?: string | null
          featured?: boolean | null
          id?: string
          media_url?: string | null
          position?: number | null
          status?: string
          summary?: string | null
          thumbnail_url?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          embed_code?: string | null
          expires_at?: string | null
          featured?: boolean | null
          id?: string
          media_url?: string | null
          position?: number | null
          status?: string
          summary?: string | null
          thumbnail_url?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          artist_id: string | null
          author_id: string | null
          category_id: string | null
          concert_id: string | null
          content: string | null
          created_at: string
          featured_image: string | null
          id: string
          keywords: string | null
          meta_description: string | null
          meta_title: string | null
          photo_credit: string | null
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["article_status"]
          tags: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          artist_id?: string | null
          author_id?: string | null
          category_id?: string | null
          concert_id?: string | null
          content?: string | null
          created_at?: string
          featured_image?: string | null
          id?: string
          keywords?: string | null
          meta_description?: string | null
          meta_title?: string | null
          photo_credit?: string | null
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["article_status"]
          tags?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          artist_id?: string | null
          author_id?: string | null
          category_id?: string | null
          concert_id?: string | null
          content?: string | null
          created_at?: string
          featured_image?: string | null
          id?: string
          keywords?: string | null
          meta_description?: string | null
          meta_title?: string | null
          photo_credit?: string | null
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["article_status"]
          tags?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_articles_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_articles_concert_id_fkey"
            columns: ["concert_id"]
            isOneToOne: false
            referencedRelation: "concerts"
            referencedColumns: ["id"]
          },
        ]
      }
      news_media: {
        Row: {
          article_id: string
          caption: string | null
          created_at: string
          id: string
          media_type: string
          media_url: string
          position: number
          updated_at: string
        }
        Insert: {
          article_id: string
          caption?: string | null
          created_at?: string
          id?: string
          media_type: string
          media_url: string
          position?: number
          updated_at?: string
        }
        Update: {
          article_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          media_type?: string
          media_url?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_media_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          status: Database["public"]["Enums"]["subscriber_status"]
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          status?: Database["public"]["Enums"]["subscriber_status"]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          status?: Database["public"]["Enums"]["subscriber_status"]
        }
        Relationships: []
      }
      page_views: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          id: string
          ip_address: string | null
          os: string | null
          page_path: string
          page_title: string | null
          referrer: string | null
          session_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          os?: string | null
          page_path: string
          page_title?: string | null
          referrer?: string | null
          session_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          os?: string | null
          page_path?: string
          page_title?: string | null
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birth_date: string | null
          city_id: string | null
          country_id: string | null
          created_at: string
          favorite_artists: Json | null
          first_name: string | null
          id: string
          is_admin: boolean | null
          last_name: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          birth_date?: string | null
          city_id?: string | null
          country_id?: string | null
          created_at?: string
          favorite_artists?: Json | null
          first_name?: string | null
          id: string
          is_admin?: boolean | null
          last_name?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          birth_date?: string | null
          city_id?: string | null
          country_id?: string | null
          created_at?: string
          favorite_artists?: Json | null
          first_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_name?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      promoters: {
        Row: {
          country_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          website: string | null
        }
        Insert: {
          country_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          country_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promoters_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          last_used_at: string | null
          p256dh: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          last_used_at?: string | null
          p256dh: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          last_used_at?: string | null
          p256dh?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      pwa_settings: {
        Row: {
          app_name: string
          background_color: string
          created_at: string | null
          description: string | null
          icon_192_url: string | null
          icon_512_url: string | null
          id: string
          short_name: string
          theme_color: string
          updated_at: string | null
        }
        Insert: {
          app_name?: string
          background_color?: string
          created_at?: string | null
          description?: string | null
          icon_192_url?: string | null
          icon_512_url?: string | null
          id?: string
          short_name?: string
          theme_color?: string
          updated_at?: string | null
        }
        Update: {
          app_name?: string
          background_color?: string
          created_at?: string | null
          description?: string | null
          icon_192_url?: string | null
          icon_512_url?: string | null
          id?: string
          short_name?: string
          theme_color?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      reactions: {
        Row: {
          article_id: string | null
          comment_id: string | null
          created_at: string
          id: string
          type: Database["public"]["Enums"]["reaction_type"]
          user_id: string | null
        }
        Insert: {
          article_id?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          type: Database["public"]["Enums"]["reaction_type"]
          user_id?: string | null
        }
        Update: {
          article_id?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          type?: Database["public"]["Enums"]["reaction_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reactions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_settings: {
        Row: {
          created_at: string
          facebook_page: string | null
          id: string
          og_image: string | null
          site_description: string | null
          site_keywords: string | null
          site_title: string
          twitter_handle: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          facebook_page?: string | null
          id?: string
          og_image?: string | null
          site_description?: string | null
          site_keywords?: string | null
          site_title: string
          twitter_handle?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          facebook_page?: string | null
          id?: string
          og_image?: string | null
          site_description?: string | null
          site_keywords?: string | null
          site_title?: string
          twitter_handle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          device_type: string | null
          duration_seconds: number | null
          ended_at: string | null
          entry_page: string | null
          exit_page: string | null
          id: string
          os: string | null
          pages_visited: number | null
          referrer: string | null
          session_id: string
          started_at: string
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          entry_page?: string | null
          exit_page?: string | null
          id?: string
          os?: string | null
          pages_visited?: number | null
          referrer?: string | null
          session_id: string
          started_at?: string
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          entry_page?: string | null
          exit_page?: string | null
          id?: string
          os?: string | null
          pages_visited?: number | null
          referrer?: string | null
          session_id?: string
          started_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      setlist_songs: {
        Row: {
          artist_name: string | null
          concert_id: string
          contributed_by: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          is_official: boolean | null
          notes: string | null
          position: number
          song_name: string
          spotify_track_id: string | null
          spotify_url: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          artist_name?: string | null
          concert_id: string
          contributed_by?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_official?: boolean | null
          notes?: string | null
          position: number
          song_name: string
          spotify_track_id?: string | null
          spotify_url?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          artist_name?: string | null
          concert_id?: string
          contributed_by?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_official?: boolean | null
          notes?: string | null
          position?: number
          song_name?: string
          spotify_track_id?: string | null
          spotify_url?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "setlist_songs_concert_id_fkey"
            columns: ["concert_id"]
            isOneToOne: false
            referencedRelation: "concerts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_networks: {
        Row: {
          active: boolean
          created_at: string
          display_order: number
          icon_name: string
          id: string
          name: string
          updated_at: string
          url_template: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_order?: number
          icon_name: string
          id?: string
          name: string
          updated_at?: string
          url_template: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_order?: number
          icon_name?: string
          id?: string
          name?: string
          updated_at?: string
          url_template?: string
        }
        Relationships: []
      }
      spotify_chart_artists: {
        Row: {
          artist_id: string
          artist_image_url: string | null
          artist_name: string
          country_code: string
          created_at: string | null
          genres: string | null
          id: string
          popularity: number | null
          position: number
          spotify_url: string
          updated_at: string | null
        }
        Insert: {
          artist_id: string
          artist_image_url?: string | null
          artist_name: string
          country_code: string
          created_at?: string | null
          genres?: string | null
          id?: string
          popularity?: number | null
          position: number
          spotify_url: string
          updated_at?: string | null
        }
        Update: {
          artist_id?: string
          artist_image_url?: string | null
          artist_name?: string
          country_code?: string
          created_at?: string | null
          genres?: string | null
          id?: string
          popularity?: number | null
          position?: number
          spotify_url?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      spotify_chart_tracks: {
        Row: {
          album_image_url: string | null
          album_name: string
          artist_names: string
          country_code: string
          created_at: string | null
          duration_ms: number | null
          id: string
          popularity: number | null
          position: number
          spotify_url: string
          track_id: string
          track_name: string
          updated_at: string | null
        }
        Insert: {
          album_image_url?: string | null
          album_name: string
          artist_names: string
          country_code: string
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          popularity?: number | null
          position: number
          spotify_url: string
          track_id: string
          track_name: string
          updated_at?: string | null
        }
        Update: {
          album_image_url?: string | null
          album_name?: string
          artist_names?: string
          country_code?: string
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          popularity?: number | null
          position?: number
          spotify_url?: string
          track_id?: string
          track_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: number
          name: string
          user_id: string
        }
        Insert: {
          id?: number
          name: string
          user_id?: string
        }
        Update: {
          id?: number
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      venue_sections: {
        Row: {
          code: string
          created_at: string
          display_order: number
          fan_project_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          display_order?: number
          fan_project_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          display_order?: number
          fan_project_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_sections_fan_project_id_fkey"
            columns: ["fan_project_id"]
            isOneToOne: false
            referencedRelation: "fan_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          capacity: number | null
          city_id: string | null
          country: string | null
          created_at: string
          id: string
          location: string | null
          name: string
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          capacity?: number | null
          city_id?: string | null
          country?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name: string
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          capacity?: number | null
          city_id?: string | null
          country?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venues_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles_search: {
        Row: {
          city_id: string | null
          country_id: string | null
          country_iso_code: string | null
          country_name: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_favorite_concert: {
        Args: { p_concert_id: string; p_user_id: string }
        Returns: undefined
      }
      are_friends: {
        Args: { user_a: string; user_b: string }
        Returns: boolean
      }
      can_view_full_profile: {
        Args: { target_id: string; viewer_id: string }
        Returns: boolean
      }
      check_favorite_concert: {
        Args: { p_concert_id: string; p_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_community_member: {
        Args: { p_concert_id: string; p_user_id: string }
        Returns: boolean
      }
      remove_favorite_concert: {
        Args: { p_concert_id: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      ad_campaign_status: "active" | "paused" | "finished"
      ad_format: "banner" | "rectangle"
      ad_position: "sidebar-left" | "sidebar-right" | "content" | "footer"
      article_status: "draft" | "published" | "archived"
      comment_status: "pending" | "approved" | "rejected"
      reaction_type: "like" | "love" | "wow" | "angry" | "sad"
      subscriber_status: "active" | "unsubscribed"
      user_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ad_campaign_status: ["active", "paused", "finished"],
      ad_format: ["banner", "rectangle"],
      ad_position: ["sidebar-left", "sidebar-right", "content", "footer"],
      article_status: ["draft", "published", "archived"],
      comment_status: ["pending", "approved", "rejected"],
      reaction_type: ["like", "love", "wow", "angry", "sad"],
      subscriber_status: ["active", "unsubscribed"],
      user_role: ["admin", "moderator", "user"],
    },
  },
} as const
