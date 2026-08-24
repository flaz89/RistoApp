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
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      feedbacks: {
        Row: {
          author_id: string
          comment: string | null
          created_at: string
          direction: Database["public"]["Enums"]["feedback_direction"]
          id: string
          order_id: string | null
          rating: number
          restaurant_id: string | null
          subject_id: string | null
        }
        Insert: {
          author_id: string
          comment?: string | null
          created_at?: string
          direction: Database["public"]["Enums"]["feedback_direction"]
          id?: string
          order_id?: string | null
          rating: number
          restaurant_id?: string | null
          subject_id?: string | null
        }
        Update: {
          author_id?: string
          comment?: string | null
          created_at?: string
          direction?: Database["public"]["Enums"]["feedback_direction"]
          id?: string
          order_id?: string | null
          rating?: number
          restaurant_id?: string | null
          subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedbacks_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedbacks_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedbacks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      floor_plan_elements: {
        Row: {
          created_at: string
          floor_plan_id: string
          height_cm: number
          id: string
          kind: Database["public"]["Enums"]["floor_element_kind"]
          label: string | null
          rotation_deg: number
          width_cm: number
          x_cm: number
          y_cm: number
        }
        Insert: {
          created_at?: string
          floor_plan_id: string
          height_cm: number
          id?: string
          kind: Database["public"]["Enums"]["floor_element_kind"]
          label?: string | null
          rotation_deg?: number
          width_cm: number
          x_cm: number
          y_cm: number
        }
        Update: {
          created_at?: string
          floor_plan_id?: string
          height_cm?: number
          id?: string
          kind?: Database["public"]["Enums"]["floor_element_kind"]
          label?: string | null
          rotation_deg?: number
          width_cm?: number
          x_cm?: number
          y_cm?: number
        }
        Relationships: [
          {
            foreignKeyName: "floor_plan_elements_floor_plan_id_fkey"
            columns: ["floor_plan_id"]
            isOneToOne: false
            referencedRelation: "floor_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      floor_plans: {
        Row: {
          created_at: string
          height_cm: number
          id: string
          is_published: boolean
          name: string
          restaurant_id: string
          source_sketch_url: string | null
          updated_at: string
          width_cm: number
        }
        Insert: {
          created_at?: string
          height_cm: number
          id?: string
          is_published?: boolean
          name: string
          restaurant_id: string
          source_sketch_url?: string | null
          updated_at?: string
          width_cm: number
        }
        Update: {
          created_at?: string
          height_cm?: number
          id?: string
          is_published?: boolean
          name?: string
          restaurant_id?: string
          source_sketch_url?: string | null
          updated_at?: string
          width_cm?: number
        }
        Relationships: [
          {
            foreignKeyName: "floor_plans_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      level_events: {
        Row: {
          created_at: string
          id: string
          note: string | null
          points: number
          profile_id: string
          reference_id: string | null
          source: Database["public"]["Enums"]["level_event_source"]
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          points: number
          profile_id: string
          reference_id?: string | null
          source: Database["public"]["Enums"]["level_event_source"]
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          points?: number
          profile_id?: string
          reference_id?: string | null
          source?: Database["public"]["Enums"]["level_event_source"]
        }
        Relationships: [
          {
            foreignKeyName: "level_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          restaurant_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          restaurant_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          restaurant_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_options: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          menu_item_id: string
          name: string
          price_delta_cents: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          menu_item_id: string
          name: string
          price_delta_cents?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          menu_item_id?: string
          name?: string
          price_delta_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_options_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          allergens: string[]
          category_id: string
          created_at: string
          description: string | null
          id: string
          is_available: boolean
          name: string
          photo_url: string | null
          price_cents: number
          restaurant_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          allergens?: string[]
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          name: string
          photo_url?: string | null
          price_cents: number
          restaurant_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          allergens?: string[]
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          name?: string
          photo_url?: string | null
          price_cents?: number
          restaurant_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total_cents: number
          menu_item_id: string | null
          name_snapshot: string
          notes: string | null
          options_snapshot: Json
          order_id: string
          quantity: number
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total_cents: number
          menu_item_id?: string | null
          name_snapshot: string
          notes?: string | null
          options_snapshot?: Json
          order_id: string
          quantity: number
          unit_price_cents: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total_cents?: number
          menu_item_id?: string | null
          name_snapshot?: string
          notes?: string | null
          options_snapshot?: Json
          order_id?: string
          quantity?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_perks: {
        Row: {
          created_at: string
          order_id: string
          perk_id: string
          value_cents: number
        }
        Insert: {
          created_at?: string
          order_id: string
          perk_id: string
          value_cents?: number
        }
        Update: {
          created_at?: string
          order_id?: string
          perk_id?: string
          value_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_perks_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_perks_perk_id_fkey"
            columns: ["perk_id"]
            isOneToOne: false
            referencedRelation: "perks"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          channel: Database["public"]["Enums"]["order_channel"]
          closed_at: string | null
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string | null
          discount_cents: number
          id: string
          opened_at: string
          reservation_id: string | null
          restaurant_id: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal_cents: number
          table_id: string
          total_cents: number
          updated_at: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["order_channel"]
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          discount_cents?: number
          id?: string
          opened_at?: string
          reservation_id?: string | null
          restaurant_id: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents?: number
          table_id: string
          total_cents?: number
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["order_channel"]
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          discount_cents?: number
          id?: string
          opened_at?: string
          reservation_id?: string | null
          restaurant_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents?: number
          table_id?: string
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          brand: string
          created_at: string
          exp_month: number
          exp_year: number
          id: string
          is_default: boolean
          last4: string
          profile_id: string
          stripe_payment_method_id: string
        }
        Insert: {
          brand: string
          created_at?: string
          exp_month: number
          exp_year: number
          id?: string
          is_default?: boolean
          last4: string
          profile_id: string
          stripe_payment_method_id: string
        }
        Update: {
          brand?: string
          created_at?: string
          exp_month?: number
          exp_year?: number
          id?: string
          is_default?: boolean
          last4?: string
          profile_id?: string
          stripe_payment_method_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          method: Database["public"]["Enums"]["payment_method_kind"]
          order_id: string
          paid_at: string | null
          platform_fee_cents: number
          restaurant_id: string
          status: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method_kind"]
          order_id: string
          paid_at?: string | null
          platform_fee_cents?: number
          restaurant_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method_kind"]
          order_id?: string
          paid_at?: string | null
          platform_fee_cents?: number
          restaurant_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      perks: {
        Row: {
          created_at: string
          description: string
          discount_percent: number | null
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["perk_kind"]
          menu_item_id: string | null
          min_level: number
          restaurant_id: string
        }
        Insert: {
          created_at?: string
          description: string
          discount_percent?: number | null
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["perk_kind"]
          menu_item_id?: string | null
          min_level: number
          restaurant_id: string
        }
        Update: {
          created_at?: string
          description?: string
          discount_percent?: number | null
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["perk_kind"]
          menu_item_id?: string | null
          min_level?: number
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "perks_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perks_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_fee_ledger: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          note: string | null
          order_id: string
          payment_id: string | null
          restaurant_id: string
          settled_at: string | null
          settled_by_payment_id: string | null
          status: Database["public"]["Enums"]["fee_status"]
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          payment_id?: string | null
          restaurant_id: string
          settled_at?: string | null
          settled_by_payment_id?: string | null
          status: Database["public"]["Enums"]["fee_status"]
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          payment_id?: string | null
          restaurant_id?: string
          settled_at?: string | null
          settled_by_payment_id?: string | null
          status?: Database["public"]["Enums"]["fee_status"]
        }
        Relationships: [
          {
            foreignKeyName: "platform_fee_ledger_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_fee_ledger_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_fee_ledger_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_fee_ledger_settled_by_payment_id_fkey"
            columns: ["settled_by_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string
          id: string
          last_name: string
          level: number
          level_points: number
          phone: string
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_name: string
          id: string
          last_name: string
          level?: number
          level_points?: number
          phone: string
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          level?: number
          level_points?: number
          phone?: string
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string | null
          ends_at: string
          id: string
          notes: string | null
          party_size: number
          restaurant_id: string
          source: Database["public"]["Enums"]["reservation_source"]
          starts_at: string
          status: Database["public"]["Enums"]["reservation_status"]
          table_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          ends_at: string
          id?: string
          notes?: string | null
          party_size: number
          restaurant_id: string
          source?: Database["public"]["Enums"]["reservation_source"]
          starts_at: string
          status?: Database["public"]["Enums"]["reservation_status"]
          table_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          ends_at?: string
          id?: string
          notes?: string | null
          party_size?: number
          restaurant_id?: string
          source?: Database["public"]["Enums"]["reservation_source"]
          starts_at?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          table_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_members: {
        Row: {
          created_at: string
          profile_id: string
          restaurant_id: string
          role: Database["public"]["Enums"]["restaurant_role"]
        }
        Insert: {
          created_at?: string
          profile_id: string
          restaurant_id: string
          role: Database["public"]["Enums"]["restaurant_role"]
        }
        Update: {
          created_at?: string
          profile_id?: string
          restaurant_id?: string
          role?: Database["public"]["Enums"]["restaurant_role"]
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_members_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_photos: {
        Row: {
          created_at: string
          id: string
          restaurant_id: string
          sort_order: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          restaurant_id: string
          sort_order?: number
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          restaurant_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_photos_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_tables: {
        Row: {
          attributes: Json
          code: string
          created_at: string
          floor_plan_id: string
          height_cm: number
          id: string
          is_active: boolean
          restaurant_id: string
          rotation_deg: number
          seats_max: number
          seats_min: number
          shape: Database["public"]["Enums"]["table_shape"]
          width_cm: number
          x_cm: number
          y_cm: number
        }
        Insert: {
          attributes?: Json
          code: string
          created_at?: string
          floor_plan_id: string
          height_cm: number
          id?: string
          is_active?: boolean
          restaurant_id: string
          rotation_deg?: number
          seats_max: number
          seats_min?: number
          shape?: Database["public"]["Enums"]["table_shape"]
          width_cm: number
          x_cm: number
          y_cm: number
        }
        Update: {
          attributes?: Json
          code?: string
          created_at?: string
          floor_plan_id?: string
          height_cm?: number
          id?: string
          is_active?: boolean
          restaurant_id?: string
          rotation_deg?: number
          seats_max?: number
          seats_min?: number
          shape?: Database["public"]["Enums"]["table_shape"]
          width_cm?: number
          x_cm?: number
          y_cm?: number
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_floor_plan_id_fkey"
            columns: ["floor_plan_id"]
            isOneToOne: false
            referencedRelation: "floor_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address_line: string
          avg_spend_cents: number | null
          avg_spend_sample: number
          city: string
          country_code: string
          cover_photo_url: string | null
          logo_url: string | null
          created_at: string
          description: string | null
          email: string
          id: string
          latitude: number | null
          location: unknown
          longitude: number | null
          name: string
          owner_id: string
          phone: string
          platform_fee_bps: number
          postal_code: string
          slug: string
          status: Database["public"]["Enums"]["restaurant_status"]
          stripe_account_id: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          address_line: string
          avg_spend_cents?: number | null
          avg_spend_sample?: number
          city: string
          country_code?: string
          cover_photo_url?: string | null
          logo_url?: string | null
          created_at?: string
          description?: string | null
          email: string
          id?: string
          latitude?: number | null
          location?: unknown
          longitude?: number | null
          name: string
          owner_id: string
          phone: string
          platform_fee_bps?: number
          postal_code: string
          slug: string
          status?: Database["public"]["Enums"]["restaurant_status"]
          stripe_account_id?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          address_line?: string
          avg_spend_cents?: number | null
          avg_spend_sample?: number
          city?: string
          country_code?: string
          cover_photo_url?: string | null
          logo_url?: string | null
          created_at?: string
          description?: string | null
          email?: string
          id?: string
          latitude?: number | null
          location?: unknown
          longitude?: number | null
          name?: string
          owner_id?: string
          phone?: string
          platform_fee_bps?: number
          postal_code?: string
          slug?: string
          status?: Database["public"]["Enums"]["restaurant_status"]
          stripe_account_id?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      restaurant_outstanding_fees: {
        Row: {
          open_entries: number | null
          outstanding_cents: number | null
          restaurant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_fee_ledger_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_restaurant_manager: {
        Args: { target_restaurant: string }
        Returns: boolean
      }
      is_restaurant_member: {
        Args: { target_restaurant: string }
        Returns: boolean
      }
      nearby_restaurants: {
        Args: {
          in_lat: number
          in_limit?: number
          in_lon: number
          in_radius_m?: number
        }
        Returns: {
          address_line: string
          avg_spend_cents: number
          city: string
          cover_photo_url: string
          logo_url: string
          distance_m: number
          id: string
          name: string
          slug: string
        }[]
      }
    }
    Enums: {
      fee_status: "collected" | "deferred" | "settled" | "waived"
      feedback_direction:
        | "restaurant_to_customer"
        | "customer_to_restaurant"
        | "customer_to_customer"
      floor_element_kind:
        | "wall"
        | "door"
        | "window"
        | "bar"
        | "restroom"
        | "kitchen"
        | "stairs"
        | "plant"
        | "pillar"
        | "other"
      level_event_source:
        | "restaurant_feedback"
        | "peer_feedback"
        | "order_completed"
        | "manual_adjustment"
      order_channel: "customer_app" | "staff"
      order_status:
        | "draft"
        | "awaiting_payment"
        | "paid"
        | "in_kitchen"
        | "served"
        | "closed"
        | "cancelled"
      payment_method_kind: "card_app" | "card_terminal" | "cash"
      payment_status: "pending" | "succeeded" | "failed" | "refunded"
      perk_kind: "discount_percent" | "free_item"
      reservation_source: "customer_app" | "staff"
      reservation_status:
        | "pending"
        | "confirmed"
        | "seated"
        | "completed"
        | "cancelled"
        | "no_show"
      restaurant_role: "owner" | "manager" | "waiter"
      restaurant_status: "draft" | "pending_review" | "active" | "suspended"
      table_shape: "round" | "square" | "rect"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      fee_status: ["collected", "deferred", "settled", "waived"],
      feedback_direction: [
        "restaurant_to_customer",
        "customer_to_restaurant",
        "customer_to_customer",
      ],
      floor_element_kind: [
        "wall",
        "door",
        "window",
        "bar",
        "restroom",
        "kitchen",
        "stairs",
        "plant",
        "pillar",
        "other",
      ],
      level_event_source: [
        "restaurant_feedback",
        "peer_feedback",
        "order_completed",
        "manual_adjustment",
      ],
      order_channel: ["customer_app", "staff"],
      order_status: [
        "draft",
        "awaiting_payment",
        "paid",
        "in_kitchen",
        "served",
        "closed",
        "cancelled",
      ],
      payment_method_kind: ["card_app", "card_terminal", "cash"],
      payment_status: ["pending", "succeeded", "failed", "refunded"],
      perk_kind: ["discount_percent", "free_item"],
      reservation_source: ["customer_app", "staff"],
      reservation_status: [
        "pending",
        "confirmed",
        "seated",
        "completed",
        "cancelled",
        "no_show",
      ],
      restaurant_role: ["owner", "manager", "waiter"],
      restaurant_status: ["draft", "pending_review", "active", "suspended"],
      table_shape: ["round", "square", "rect"],
    },
  },
} as const
