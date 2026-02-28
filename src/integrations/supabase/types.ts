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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_name: string
          id: string
          page_url: string | null
          session_id: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_name: string
          id?: string
          page_url?: string | null
          session_id?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_name?: string
          id?: string
          page_url?: string | null
          session_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analytics_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_sessions: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          device_type: string | null
          duration_seconds: number | null
          id: string
          ip_address: string | null
          is_bounced: boolean | null
          landing_page: string | null
          last_seen_at: string
          latitude: number | null
          longitude: number | null
          os: string | null
          page_views: number | null
          referrer: string | null
          session_start: string
          tenant_id: string
          user_id: string | null
          visitor_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          id?: string
          ip_address?: string | null
          is_bounced?: boolean | null
          landing_page?: string | null
          last_seen_at?: string
          latitude?: number | null
          longitude?: number | null
          os?: string | null
          page_views?: number | null
          referrer?: string | null
          session_start?: string
          tenant_id: string
          user_id?: string | null
          visitor_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          id?: string
          ip_address?: string | null
          is_bounced?: boolean | null
          landing_page?: string | null
          last_seen_at?: string
          latitude?: number | null
          longitude?: number | null
          os?: string | null
          page_views?: number | null
          referrer?: string | null
          session_start?: string
          tenant_id?: string
          user_id?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      application_logs: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          level: string
          message: string
          stack: string | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          level: string
          message: string
          stack?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          level?: string
          message?: string
          stack?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      attribute_values: {
        Row: {
          attribute_id: string
          created_at: string
          id: string
          tenant_id: string
          value: string
        }
        Insert: {
          attribute_id: string
          created_at?: string
          id?: string
          tenant_id: string
          value: string
        }
        Update: {
          attribute_id?: string
          created_at?: string
          id?: string
          tenant_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "attribute_values_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attribute_values_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attribute_values_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      attributes: {
        Row: {
          created_at: string
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attributes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attributes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          logo_path: string | null
          name: string
          slug: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_path?: string | null
          name: string
          slug: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_path?: string | null
          name?: string
          slug?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brands_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          product_id: string
          qty: number
          tenant_id: string
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          product_id: string
          qty?: number
          tenant_id: string
          unit_price: number
          variant_id?: string | null
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          product_id?: string
          qty?: number
          tenant_id?: string
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          status: string
          store_slug: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          store_slug: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          store_slug?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "carts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          image_path: string | null
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_path?: string | null
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_path?: string | null
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          created_at: string
          customer_id: string | null
          discount_amount: number
          id: string
          order_id: string
          tenant_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string
          customer_id?: string | null
          discount_amount: number
          id?: string
          order_id: string
          tenant_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string
          customer_id?: string | null
          discount_amount?: number
          id?: string
          order_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean
          max_discount_amount: number | null
          min_cart_amount: number
          starts_at: string | null
          tenant_id: string
          type: string
          usage_limit: number | null
          used_count: number
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          min_cart_amount?: number
          starts_at?: string | null
          tenant_id: string
          type: string
          usage_limit?: number | null
          used_count?: number
          value: number
        }
        Update: {
          code?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          min_cart_amount?: number
          starts_at?: string | null
          tenant_id?: string
          type?: string
          usage_limit?: number | null
          used_count?: number
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_domains: {
        Row: {
          auto_verify: boolean
          created_at: string
          domain: string
          id: string
          last_verification_at: string | null
          ssl_expires_at: string | null
          ssl_status: string | null
          status: string
          tenant_id: string
          verification_attempts: number
          verification_error: string | null
        }
        Insert: {
          auto_verify?: boolean
          created_at?: string
          domain: string
          id?: string
          last_verification_at?: string | null
          ssl_expires_at?: string | null
          ssl_status?: string | null
          status?: string
          tenant_id: string
          verification_attempts?: number
          verification_error?: string | null
        }
        Update: {
          auto_verify?: boolean
          created_at?: string
          domain?: string
          id?: string
          last_verification_at?: string | null
          ssl_expires_at?: string | null
          ssl_status?: string | null
          status?: string
          tenant_id?: string
          verification_attempts?: number
          verification_error?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_domains_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_domains_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          city: string
          created_at: string
          customer_id: string
          id: string
          is_default: boolean
          label: string
          line1: string
          line2: string | null
          pincode: string
          state: string
          tenant_id: string
        }
        Insert: {
          city: string
          created_at?: string
          customer_id: string
          id?: string
          is_default?: boolean
          label?: string
          line1: string
          line2?: string | null
          pincode: string
          state: string
          tenant_id: string
        }
        Update: {
          city?: string
          created_at?: string
          customer_id?: string
          id?: string
          is_default?: boolean
          label?: string
          line1?: string
          line2?: string | null
          pincode?: string
          state?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_addresses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_addresses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_notes: {
        Row: {
          author_id: string | null
          created_at: string | null
          customer_id: string
          id: string
          is_pinned: boolean | null
          note: string
          tenant_id: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          is_pinned?: boolean | null
          note: string
          tenant_id: string
        }
        Update: {
          author_id?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          is_pinned?: boolean | null
          note?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          password_hash: string | null
          phone: string | null
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          password_hash?: string | null
          phone?: string | null
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          password_hash?: string | null
          phone?: string | null
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_areas: {
        Row: {
          created_at: string
          delivery_fee: number | null
          id: string
          is_active: boolean
          localities: string[] | null
          name: string
          pincodes: string[]
          tenant_id: string
        }
        Insert: {
          created_at?: string
          delivery_fee?: number | null
          id?: string
          is_active?: boolean
          localities?: string[] | null
          name: string
          pincodes?: string[]
          tenant_id: string
        }
        Update: {
          created_at?: string
          delivery_fee?: number | null
          id?: string
          is_active?: boolean
          localities?: string[] | null
          name?: string
          pincodes?: string[]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_areas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_areas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_assignments: {
        Row: {
          assigned_at: string | null
          cod_collected: number | null
          created_at: string
          delivered_at: string | null
          delivery_area_id: string | null
          delivery_boy_id: string | null
          id: string
          notes: string | null
          order_id: string
          picked_up_at: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          cod_collected?: number | null
          created_at?: string
          delivered_at?: string | null
          delivery_area_id?: string | null
          delivery_boy_id?: string | null
          id?: string
          notes?: string | null
          order_id: string
          picked_up_at?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          cod_collected?: number | null
          created_at?: string
          delivered_at?: string | null
          delivery_area_id?: string | null
          delivery_boy_id?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          picked_up_at?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_assignments_delivery_area_id_fkey"
            columns: ["delivery_area_id"]
            isOneToOne: false
            referencedRelation: "delivery_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_delivery_boy_id_fkey"
            columns: ["delivery_boy_id"]
            isOneToOne: false
            referencedRelation: "delivery_boys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_delivery_boy_id_fkey"
            columns: ["delivery_boy_id"]
            isOneToOne: false
            referencedRelation: "delivery_boys_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_boy_areas: {
        Row: {
          created_at: string
          delivery_area_id: string
          delivery_boy_id: string
          id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          delivery_area_id: string
          delivery_boy_id: string
          id?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          delivery_area_id?: string
          delivery_boy_id?: string
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_boy_areas_delivery_area_id_fkey"
            columns: ["delivery_area_id"]
            isOneToOne: false
            referencedRelation: "delivery_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_boy_areas_delivery_boy_id_fkey"
            columns: ["delivery_boy_id"]
            isOneToOne: false
            referencedRelation: "delivery_boys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_boy_areas_delivery_boy_id_fkey"
            columns: ["delivery_boy_id"]
            isOneToOne: false
            referencedRelation: "delivery_boys_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_boy_areas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_boy_areas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_boy_sessions: {
        Row: {
          created_at: string
          delivery_boy_id: string
          expires_at: string
          id: string
          token: string
        }
        Insert: {
          created_at?: string
          delivery_boy_id: string
          expires_at: string
          id?: string
          token?: string
        }
        Update: {
          created_at?: string
          delivery_boy_id?: string
          expires_at?: string
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_boy_sessions_delivery_boy_id_fkey"
            columns: ["delivery_boy_id"]
            isOneToOne: false
            referencedRelation: "delivery_boys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_boy_sessions_delivery_boy_id_fkey"
            columns: ["delivery_boy_id"]
            isOneToOne: false
            referencedRelation: "delivery_boys_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_boys: {
        Row: {
          account_holder_name: string | null
          account_number: string | null
          created_at: string
          full_name: string
          id: string
          ifsc_code: string | null
          is_active: boolean
          mobile_number: string
          monthly_salary: number | null
          password_hash: string
          payment_type: Database["public"]["Enums"]["delivery_payment_type"]
          per_order_amount: number | null
          percentage_value: number | null
          tenant_id: string
          total_earned: number
          total_paid: number
          updated_at: string
          upi_id: string | null
          wallet_balance: number
        }
        Insert: {
          account_holder_name?: string | null
          account_number?: string | null
          created_at?: string
          full_name: string
          id?: string
          ifsc_code?: string | null
          is_active?: boolean
          mobile_number: string
          monthly_salary?: number | null
          password_hash: string
          payment_type?: Database["public"]["Enums"]["delivery_payment_type"]
          per_order_amount?: number | null
          percentage_value?: number | null
          tenant_id: string
          total_earned?: number
          total_paid?: number
          updated_at?: string
          upi_id?: string | null
          wallet_balance?: number
        }
        Update: {
          account_holder_name?: string | null
          account_number?: string | null
          created_at?: string
          full_name?: string
          id?: string
          ifsc_code?: string | null
          is_active?: boolean
          mobile_number?: string
          monthly_salary?: number | null
          password_hash?: string
          payment_type?: Database["public"]["Enums"]["delivery_payment_type"]
          per_order_amount?: number | null
          percentage_value?: number | null
          tenant_id?: string
          total_earned?: number
          total_paid?: number
          updated_at?: string
          upi_id?: string | null
          wallet_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "delivery_boys_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_boys_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_earnings: {
        Row: {
          amount: number
          assignment_id: string | null
          created_at: string
          delivery_boy_id: string
          description: string | null
          earning_type: Database["public"]["Enums"]["delivery_payment_type"]
          id: string
          order_id: string | null
          tenant_id: string
        }
        Insert: {
          amount: number
          assignment_id?: string | null
          created_at?: string
          delivery_boy_id: string
          description?: string | null
          earning_type: Database["public"]["Enums"]["delivery_payment_type"]
          id?: string
          order_id?: string | null
          tenant_id: string
        }
        Update: {
          amount?: number
          assignment_id?: string | null
          created_at?: string
          delivery_boy_id?: string
          description?: string | null
          earning_type?: Database["public"]["Enums"]["delivery_payment_type"]
          id?: string
          order_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_earnings_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "delivery_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_earnings_delivery_boy_id_fkey"
            columns: ["delivery_boy_id"]
            isOneToOne: false
            referencedRelation: "delivery_boys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_earnings_delivery_boy_id_fkey"
            columns: ["delivery_boy_id"]
            isOneToOne: false
            referencedRelation: "delivery_boys_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_earnings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_earnings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_earnings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_payout_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          delivery_boy_id: string
          id: string
          processed_at: string | null
          processed_by: string | null
          requested_at: string
          status: Database["public"]["Enums"]["payout_status"]
          tenant_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          delivery_boy_id: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["payout_status"]
          tenant_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          delivery_boy_id?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["payout_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_payout_requests_delivery_boy_id_fkey"
            columns: ["delivery_boy_id"]
            isOneToOne: false
            referencedRelation: "delivery_boys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_payout_requests_delivery_boy_id_fkey"
            columns: ["delivery_boy_id"]
            isOneToOne: false
            referencedRelation: "delivery_boys_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_payout_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_payout_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_payouts: {
        Row: {
          amount: number
          created_at: string
          delivery_boy_id: string
          id: string
          notes: string | null
          paid_at: string
          payment_method: string | null
          payout_request_id: string | null
          tenant_id: string
          transaction_reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          delivery_boy_id: string
          id?: string
          notes?: string | null
          paid_at?: string
          payment_method?: string | null
          payout_request_id?: string | null
          tenant_id: string
          transaction_reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          delivery_boy_id?: string
          id?: string
          notes?: string | null
          paid_at?: string
          payment_method?: string | null
          payout_request_id?: string | null
          tenant_id?: string
          transaction_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_payouts_delivery_boy_id_fkey"
            columns: ["delivery_boy_id"]
            isOneToOne: false
            referencedRelation: "delivery_boys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_payouts_delivery_boy_id_fkey"
            columns: ["delivery_boy_id"]
            isOneToOne: false
            referencedRelation: "delivery_boys_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_payouts_payout_request_id_fkey"
            columns: ["payout_request_id"]
            isOneToOne: false
            referencedRelation: "delivery_payout_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_payouts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_payouts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_slots: {
        Row: {
          created_at: string
          end_time: string
          id: string
          is_active: boolean
          label: string
          start_time: string
          tenant_id: string
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          is_active?: boolean
          label: string
          start_time: string
          tenant_id: string
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          is_active?: boolean
          label?: string
          start_time?: string
          tenant_id?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_slots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_slots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_slots_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_status_logs: {
        Row: {
          assignment_id: string
          created_at: string
          delivery_boy_id: string | null
          id: string
          new_status: Database["public"]["Enums"]["delivery_status"]
          notes: string | null
          old_status: Database["public"]["Enums"]["delivery_status"] | null
          tenant_id: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          delivery_boy_id?: string | null
          id?: string
          new_status: Database["public"]["Enums"]["delivery_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["delivery_status"] | null
          tenant_id: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          delivery_boy_id?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["delivery_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["delivery_status"] | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_status_logs_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "delivery_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_status_logs_delivery_boy_id_fkey"
            columns: ["delivery_boy_id"]
            isOneToOne: false
            referencedRelation: "delivery_boys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_status_logs_delivery_boy_id_fkey"
            columns: ["delivery_boy_id"]
            isOneToOne: false
            referencedRelation: "delivery_boys_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_status_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_status_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          pincodes: string[]
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          pincodes?: string[]
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          pincodes?: string[]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_zones_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_zones_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_verification_logs: {
        Row: {
          dns_records: Json | null
          domain_id: string
          error_message: string | null
          id: string
          tenant_id: string
          verified: boolean
          verified_at: string
        }
        Insert: {
          dns_records?: Json | null
          domain_id: string
          error_message?: string | null
          id?: string
          tenant_id: string
          verified: boolean
          verified_at?: string
        }
        Update: {
          dns_records?: Json | null
          domain_id?: string
          error_message?: string | null
          id?: string
          tenant_id?: string
          verified?: boolean
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "domain_verification_logs_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "custom_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domain_verification_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domain_verification_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_layouts: {
        Row: {
          created_at: string
          draft_data: Json | null
          id: string
          is_active: boolean
          layout_data: Json
          published_at: string | null
          tenant_id: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          draft_data?: Json | null
          id?: string
          is_active?: boolean
          layout_data?: Json
          published_at?: string | null
          tenant_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          draft_data?: Json | null
          id?: string
          is_active?: boolean
          layout_data?: Json
          published_at?: string | null
          tenant_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "homepage_layouts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homepage_layouts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          batch_id: string | null
          cost_price: number | null
          created_at: string
          created_by: string | null
          id: string
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          notes: string | null
          product_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
          tenant_id: string
          variant_id: string | null
        }
        Insert: {
          batch_id?: string | null
          cost_price?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          notes?: string | null
          product_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          tenant_id: string
          variant_id?: string | null
        }
        Update: {
          batch_id?: string | null
          cost_price?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: Database["public"]["Enums"]["inventory_movement_type"]
          notes?: string | null
          product_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          tenant_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements_archive: {
        Row: {
          batch_id: string | null
          cost_price: number | null
          created_at: string
          created_by: string | null
          id: string
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          notes: string | null
          product_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
          tenant_id: string
          variant_id: string | null
        }
        Insert: {
          batch_id?: string | null
          cost_price?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          notes?: string | null
          product_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          tenant_id: string
          variant_id?: string | null
        }
        Update: {
          batch_id?: string | null
          cost_price?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: Database["public"]["Enums"]["inventory_movement_type"]
          notes?: string | null
          product_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          tenant_id?: string
          variant_id?: string | null
        }
        Relationships: []
      }
      inventory_settings: {
        Row: {
          created_at: string
          enable_batches: boolean
          enable_expiry: boolean
          low_stock_threshold: number
          stock_method: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enable_batches?: boolean
          enable_expiry?: boolean
          low_stock_threshold?: number
          stock_method?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enable_batches?: boolean
          enable_expiry?: boolean
          low_stock_threshold?: number
          stock_method?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      layout_versions: {
        Row: {
          created_at: string
          id: string
          layout_data: Json
          published_at: string
          tenant_id: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          layout_data: Json
          published_at?: string
          tenant_id: string
          version: number
        }
        Update: {
          created_at?: string
          id?: string
          layout_data?: Json
          published_at?: string
          tenant_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "layout_versions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "layout_versions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      operation_retry_queue: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          id: string
          last_error: string | null
          max_attempts: number
          next_retry_at: string
          operation_id: string | null
          operation_type: string
          payload: Json
          status: string
          tenant_id: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          max_attempts?: number
          next_retry_at: string
          operation_id?: string | null
          operation_type: string
          payload: Json
          status?: string
          tenant_id: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          max_attempts?: number
          next_retry_at?: string
          operation_id?: string | null
          operation_type?: string
          payload?: Json
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operation_retry_queue_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operation_retry_queue_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          name: string
          order_id: string
          product_id: string | null
          qty: number
          tenant_id: string
          unit_price: number
          variant_attributes: Json | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          name: string
          order_id: string
          product_id?: string | null
          qty: number
          tenant_id: string
          unit_price: number
          variant_attributes?: Json | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          name?: string
          order_id?: string
          product_id?: string | null
          qty?: number
          tenant_id?: string
          unit_price?: number
          variant_attributes?: Json | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items_archive: {
        Row: {
          created_at: string
          id: string
          line_total: number
          name: string
          order_id: string
          product_id: string | null
          qty: number
          tenant_id: string
          unit_price: number
          variant_attributes: Json | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          name: string
          order_id: string
          product_id?: string | null
          qty: number
          tenant_id: string
          unit_price: number
          variant_attributes?: Json | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          name?: string
          order_id?: string
          product_id?: string | null
          qty?: number
          tenant_id?: string
          unit_price?: number
          variant_attributes?: Json | null
          variant_id?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          billing_address: Json | null
          cancel_reason: string | null
          canceled_at: string | null
          cancelled_at: string | null
          carrier: string | null
          coupon_code: string | null
          coupon_id: string | null
          created_at: string
          currency: string | null
          current_location: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string
          delivered_at: string | null
          delivery_fee: number
          delivery_option: string
          delivery_slot_id: string | null
          delivery_zone_id: string | null
          discount_amount: number | null
          discount_total: number
          estimated_delivery_date: string | null
          exchange_rate: number | null
          fulfillment_status: string | null
          id: string
          items: Json | null
          last_tracking_status: string | null
          last_tracking_update_at: string | null
          metadata: Json | null
          notes: string | null
          order_number: string
          payment_method: string
          payment_status: string
          promo_code: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          refund_amount: number | null
          refund_reason: string | null
          refund_status: string | null
          refunded_at: string | null
          requested_delivery_time: string | null
          return_reason: string | null
          return_requested_at: string | null
          return_status: string | null
          shipment_id: string | null
          shipped_at: string | null
          shipping_address: Json
          shipping_cost: number | null
          shipping_method: string | null
          shipping_tax: number | null
          shiprocket_order_id: string | null
          status: string
          subtotal: number
          tax: number | null
          tax_amount: number | null
          tenant_id: string
          total: number
          total_amount: number | null
          total_refunded: number
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
        }
        Insert: {
          billing_address?: Json | null
          cancel_reason?: string | null
          canceled_at?: string | null
          cancelled_at?: string | null
          carrier?: string | null
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          currency?: string | null
          current_location?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          delivered_at?: string | null
          delivery_fee?: number
          delivery_option?: string
          delivery_slot_id?: string | null
          delivery_zone_id?: string | null
          discount_amount?: number | null
          discount_total?: number
          estimated_delivery_date?: string | null
          exchange_rate?: number | null
          fulfillment_status?: string | null
          id?: string
          items?: Json | null
          last_tracking_status?: string | null
          last_tracking_update_at?: string | null
          metadata?: Json | null
          notes?: string | null
          order_number: string
          payment_method?: string
          payment_status?: string
          promo_code?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          refund_status?: string | null
          refunded_at?: string | null
          requested_delivery_time?: string | null
          return_reason?: string | null
          return_requested_at?: string | null
          return_status?: string | null
          shipment_id?: string | null
          shipped_at?: string | null
          shipping_address?: Json
          shipping_cost?: number | null
          shipping_method?: string | null
          shipping_tax?: number | null
          shiprocket_order_id?: string | null
          status?: string
          subtotal?: number
          tax?: number | null
          tax_amount?: number | null
          tenant_id: string
          total?: number
          total_amount?: number | null
          total_refunded?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Update: {
          billing_address?: Json | null
          cancel_reason?: string | null
          canceled_at?: string | null
          cancelled_at?: string | null
          carrier?: string | null
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          currency?: string | null
          current_location?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          delivered_at?: string | null
          delivery_fee?: number
          delivery_option?: string
          delivery_slot_id?: string | null
          delivery_zone_id?: string | null
          discount_amount?: number | null
          discount_total?: number
          estimated_delivery_date?: string | null
          exchange_rate?: number | null
          fulfillment_status?: string | null
          id?: string
          items?: Json | null
          last_tracking_status?: string | null
          last_tracking_update_at?: string | null
          metadata?: Json | null
          notes?: string | null
          order_number?: string
          payment_method?: string
          payment_status?: string
          promo_code?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          refund_status?: string | null
          refunded_at?: string | null
          requested_delivery_time?: string | null
          return_reason?: string | null
          return_requested_at?: string | null
          return_status?: string | null
          shipment_id?: string | null
          shipped_at?: string | null
          shipping_address?: Json
          shipping_cost?: number | null
          shipping_method?: string | null
          shipping_tax?: number | null
          shiprocket_order_id?: string | null
          status?: string
          subtotal?: number
          tax?: number | null
          tax_amount?: number | null
          tenant_id?: string
          total?: number
          total_amount?: number | null
          total_refunded?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_slot_id_fkey"
            columns: ["delivery_slot_id"]
            isOneToOne: false
            referencedRelation: "delivery_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_zone_id_fkey"
            columns: ["delivery_zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      orders_129b3c87_e9b5_4740_aaac_89b67b14bb6a: {
        Row: {
          billing_address: Json | null
          cancel_reason: string | null
          canceled_at: string | null
          coupon_code: string | null
          created_at: string | null
          currency: string | null
          customer_id: string | null
          delivered_at: string | null
          discount_amount: number | null
          estimated_delivery_date: string | null
          id: string
          items: Json | null
          metadata: Json | null
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          refund_amount: number | null
          refund_status: string | null
          return_status: string | null
          shipping_address: Json | null
          shipping_cost: number | null
          status: string | null
          tax_amount: number | null
          tenant_id: string
          total_amount: number | null
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string | null
        }
        Insert: {
          billing_address?: Json | null
          cancel_reason?: string | null
          canceled_at?: string | null
          coupon_code?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          estimated_delivery_date?: string | null
          id: string
          items?: Json | null
          metadata?: Json | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          refund_amount?: number | null
          refund_status?: string | null
          return_status?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          status?: string | null
          tax_amount?: number | null
          tenant_id: string
          total_amount?: number | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_address?: Json | null
          cancel_reason?: string | null
          canceled_at?: string | null
          coupon_code?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          estimated_delivery_date?: string | null
          id?: string
          items?: Json | null
          metadata?: Json | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          refund_amount?: number | null
          refund_status?: string | null
          return_status?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          status?: string | null
          tax_amount?: number | null
          tenant_id?: string
          total_amount?: number | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      orders_19fc1a8b_e97c_420c_a78d_48f5f697ce47: {
        Row: {
          billing_address: Json | null
          cancel_reason: string | null
          canceled_at: string | null
          coupon_code: string | null
          created_at: string | null
          currency: string | null
          customer_id: string | null
          delivered_at: string | null
          discount_amount: number | null
          estimated_delivery_date: string | null
          id: string
          items: Json | null
          metadata: Json | null
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          refund_amount: number | null
          refund_status: string | null
          return_status: string | null
          shipping_address: Json | null
          shipping_cost: number | null
          status: string | null
          tax_amount: number | null
          tenant_id: string
          total_amount: number | null
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string | null
        }
        Insert: {
          billing_address?: Json | null
          cancel_reason?: string | null
          canceled_at?: string | null
          coupon_code?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          estimated_delivery_date?: string | null
          id: string
          items?: Json | null
          metadata?: Json | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          refund_amount?: number | null
          refund_status?: string | null
          return_status?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          status?: string | null
          tax_amount?: number | null
          tenant_id: string
          total_amount?: number | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_address?: Json | null
          cancel_reason?: string | null
          canceled_at?: string | null
          coupon_code?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          estimated_delivery_date?: string | null
          id?: string
          items?: Json | null
          metadata?: Json | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          refund_amount?: number | null
          refund_status?: string | null
          return_status?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          status?: string | null
          tax_amount?: number | null
          tenant_id?: string
          total_amount?: number | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      orders_archive: {
        Row: {
          coupon_code: string | null
          coupon_id: string | null
          created_at: string
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string
          delivery_fee: number
          delivery_option: string
          delivery_slot_id: string | null
          delivery_zone_id: string | null
          discount_total: number
          id: string
          order_number: string
          payment_method: string
          payment_status: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          requested_delivery_time: string | null
          shipping_address: Json
          status: string
          subtotal: number
          tenant_id: string
          total: number
          updated_at: string
        }
        Insert: {
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          delivery_fee?: number
          delivery_option?: string
          delivery_slot_id?: string | null
          delivery_zone_id?: string | null
          discount_total?: number
          id?: string
          order_number: string
          payment_method?: string
          payment_status?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          requested_delivery_time?: string | null
          shipping_address?: Json
          status?: string
          subtotal?: number
          tenant_id: string
          total?: number
          updated_at?: string
        }
        Update: {
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_fee?: number
          delivery_option?: string
          delivery_slot_id?: string | null
          delivery_zone_id?: string | null
          discount_total?: number
          id?: string
          order_number?: string
          payment_method?: string
          payment_status?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          requested_delivery_time?: string | null
          shipping_address?: Json
          status?: string
          subtotal?: number
          tenant_id?: string
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      orders_bfea6b8a_0d2c_43bb_8061_b6a77387f0bf: {
        Row: {
          billing_address: Json | null
          cancel_reason: string | null
          canceled_at: string | null
          coupon_code: string | null
          created_at: string | null
          currency: string | null
          customer_id: string | null
          delivered_at: string | null
          discount_amount: number | null
          estimated_delivery_date: string | null
          id: string
          items: Json | null
          metadata: Json | null
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          refund_amount: number | null
          refund_status: string | null
          return_status: string | null
          shipping_address: Json | null
          shipping_cost: number | null
          status: string | null
          tax_amount: number | null
          tenant_id: string
          total_amount: number | null
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string | null
        }
        Insert: {
          billing_address?: Json | null
          cancel_reason?: string | null
          canceled_at?: string | null
          coupon_code?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          estimated_delivery_date?: string | null
          id: string
          items?: Json | null
          metadata?: Json | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          refund_amount?: number | null
          refund_status?: string | null
          return_status?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          status?: string | null
          tax_amount?: number | null
          tenant_id: string
          total_amount?: number | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_address?: Json | null
          cancel_reason?: string | null
          canceled_at?: string | null
          coupon_code?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          estimated_delivery_date?: string | null
          id?: string
          items?: Json | null
          metadata?: Json | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          refund_amount?: number | null
          refund_status?: string | null
          return_status?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          status?: string | null
          tax_amount?: number | null
          tenant_id?: string
          total_amount?: number | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      orders_default: {
        Row: {
          billing_address: Json | null
          cancel_reason: string | null
          canceled_at: string | null
          coupon_code: string | null
          created_at: string | null
          currency: string | null
          customer_id: string | null
          delivered_at: string | null
          discount_amount: number | null
          estimated_delivery_date: string | null
          id: string
          items: Json | null
          metadata: Json | null
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          refund_amount: number | null
          refund_status: string | null
          return_status: string | null
          shipping_address: Json | null
          shipping_cost: number | null
          status: string | null
          tax_amount: number | null
          tenant_id: string
          total_amount: number | null
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string | null
        }
        Insert: {
          billing_address?: Json | null
          cancel_reason?: string | null
          canceled_at?: string | null
          coupon_code?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          estimated_delivery_date?: string | null
          id: string
          items?: Json | null
          metadata?: Json | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          refund_amount?: number | null
          refund_status?: string | null
          return_status?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          status?: string | null
          tax_amount?: number | null
          tenant_id: string
          total_amount?: number | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_address?: Json | null
          cancel_reason?: string | null
          canceled_at?: string | null
          coupon_code?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          estimated_delivery_date?: string | null
          id?: string
          items?: Json | null
          metadata?: Json | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          refund_amount?: number | null
          refund_status?: string | null
          return_status?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          status?: string | null
          tax_amount?: number | null
          tenant_id?: string
          total_amount?: number | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      orders_f02a711a_5e7b_4e20_9287_a710f2820fe4: {
        Row: {
          billing_address: Json | null
          cancel_reason: string | null
          canceled_at: string | null
          coupon_code: string | null
          created_at: string | null
          currency: string | null
          customer_id: string | null
          delivered_at: string | null
          discount_amount: number | null
          estimated_delivery_date: string | null
          id: string
          items: Json | null
          metadata: Json | null
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          refund_amount: number | null
          refund_status: string | null
          return_status: string | null
          shipping_address: Json | null
          shipping_cost: number | null
          status: string | null
          tax_amount: number | null
          tenant_id: string
          total_amount: number | null
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string | null
        }
        Insert: {
          billing_address?: Json | null
          cancel_reason?: string | null
          canceled_at?: string | null
          coupon_code?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          estimated_delivery_date?: string | null
          id: string
          items?: Json | null
          metadata?: Json | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          refund_amount?: number | null
          refund_status?: string | null
          return_status?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          status?: string | null
          tax_amount?: number | null
          tenant_id: string
          total_amount?: number | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_address?: Json | null
          cancel_reason?: string | null
          canceled_at?: string | null
          coupon_code?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          estimated_delivery_date?: string | null
          id?: string
          items?: Json | null
          metadata?: Json | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          refund_amount?: number | null
          refund_status?: string | null
          return_status?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          status?: string | null
          tax_amount?: number | null
          tenant_id?: string
          total_amount?: number | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      orders_partitioned: {
        Row: {
          billing_address: Json | null
          cancel_reason: string | null
          canceled_at: string | null
          coupon_code: string | null
          created_at: string | null
          currency: string | null
          customer_id: string | null
          delivered_at: string | null
          discount_amount: number | null
          estimated_delivery_date: string | null
          id: string
          items: Json | null
          metadata: Json | null
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          refund_amount: number | null
          refund_status: string | null
          return_status: string | null
          shipping_address: Json | null
          shipping_cost: number | null
          status: string | null
          tax_amount: number | null
          tenant_id: string
          total_amount: number | null
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string | null
        }
        Insert: {
          billing_address?: Json | null
          cancel_reason?: string | null
          canceled_at?: string | null
          coupon_code?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          estimated_delivery_date?: string | null
          id: string
          items?: Json | null
          metadata?: Json | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          refund_amount?: number | null
          refund_status?: string | null
          return_status?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          status?: string | null
          tax_amount?: number | null
          tenant_id: string
          total_amount?: number | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_address?: Json | null
          cancel_reason?: string | null
          canceled_at?: string | null
          coupon_code?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          estimated_delivery_date?: string | null
          id?: string
          items?: Json | null
          metadata?: Json | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          refund_amount?: number | null
          refund_status?: string | null
          return_status?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          status?: string | null
          tax_amount?: number | null
          tenant_id?: string
          total_amount?: number | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      otp_verifications: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          otp: string
          phone: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          otp: string
          phone: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          otp?: string
          phone?: string
          verified?: boolean
        }
        Relationships: []
      }
      payment_intents: {
        Row: {
          amount: number
          cart_id: string
          created_at: string
          currency: string
          draft_order_data: Json
          id: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string
          store_slug: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          cart_id: string
          created_at?: string
          currency?: string
          draft_order_data?: Json
          id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
          store_slug: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          cart_id?: string
          created_at?: string
          currency?: string
          draft_order_data?: Json
          id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
          store_slug?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_intents_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_intents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_intents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_reconciliation: {
        Row: {
          created_at: string
          discrepancy_amount: number | null
          expected_amount: number
          id: string
          notes: string | null
          order_id: string
          payment_intent_id: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string
          received_amount: number | null
          reconciled_at: string | null
          reconciled_by: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          discrepancy_amount?: number | null
          expected_amount: number
          id?: string
          notes?: string | null
          order_id: string
          payment_intent_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id: string
          received_amount?: number | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          discrepancy_amount?: number | null
          expected_amount?: number
          id?: string
          notes?: string | null
          order_id?: string
          payment_intent_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string
          received_amount?: number | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_reconciliation_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reconciliation_payment_intent_id_fkey"
            columns: ["payment_intent_id"]
            isOneToOne: false
            referencedRelation: "payment_intents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reconciliation_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reconciliation_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhooks: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          order_id: string | null
          payload: Json
          payment_intent_id: string | null
          processed: boolean
          processed_at: string | null
          razorpay_event_id: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          retry_count: number
          tenant_id: string
          webhook_type: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          order_id?: string | null
          payload: Json
          payment_intent_id?: string | null
          processed?: boolean
          processed_at?: string | null
          razorpay_event_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          retry_count?: number
          tenant_id: string
          webhook_type: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          order_id?: string | null
          payload?: Json
          payment_intent_id?: string | null
          processed?: boolean
          processed_at?: string | null
          razorpay_event_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          retry_count?: number
          tenant_id?: string
          webhook_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_webhooks_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_webhooks_payment_intent_id_fkey"
            columns: ["payment_intent_id"]
            isOneToOne: false
            referencedRelation: "payment_intents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_webhooks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_webhooks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          created_at: string
          duration_ms: number
          id: string
          metadata: Json | null
          operation: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms: number
          id?: string
          metadata?: Json | null
          operation: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number
          id?: string
          metadata?: Json | null
          operation?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sale_items: {
        Row: {
          batch_id: string | null
          created_at: string
          discount_amount: number
          id: string
          line_total: number
          pos_sale_id: string
          product_id: string
          product_name: string
          quantity: number
          tenant_id: string
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          discount_amount?: number
          id?: string
          line_total: number
          pos_sale_id: string
          product_id: string
          product_name: string
          quantity: number
          tenant_id: string
          unit_price: number
          variant_id?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          discount_amount?: number
          id?: string
          line_total?: number
          pos_sale_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          tenant_id?: string
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_sale_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "product_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sale_items_pos_sale_id_fkey"
            columns: ["pos_sale_id"]
            isOneToOne: false
            referencedRelation: "pos_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sale_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sale_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sale_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sales: {
        Row: {
          cash_amount: number | null
          change_amount: number | null
          created_at: string
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          discount_amount: number
          id: string
          notes: string | null
          online_amount: number | null
          payment_method: string
          razorpay_payment_id: string | null
          sale_number: string
          session_id: string | null
          status: string
          subtotal: number
          tax_amount: number
          tenant_id: string
          total: number
        }
        Insert: {
          cash_amount?: number | null
          change_amount?: number | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number
          id?: string
          notes?: string | null
          online_amount?: number | null
          payment_method?: string
          razorpay_payment_id?: string | null
          sale_number: string
          session_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tenant_id: string
          total?: number
        }
        Update: {
          cash_amount?: number | null
          change_amount?: number | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number
          id?: string
          notes?: string | null
          online_amount?: number | null
          payment_method?: string
          razorpay_payment_id?: string | null
          sale_number?: string
          session_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tenant_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sales_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "pos_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sales_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sales_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sessions: {
        Row: {
          cash_difference: number | null
          closed_at: string | null
          closing_cash: number | null
          created_at: string
          expected_cash: number | null
          id: string
          notes: string | null
          opened_at: string
          opened_by: string
          opening_cash: number
          status: string
          tenant_id: string
        }
        Insert: {
          cash_difference?: number | null
          closed_at?: string | null
          closing_cash?: number | null
          created_at?: string
          expected_cash?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by: string
          opening_cash?: number
          status?: string
          tenant_id: string
        }
        Update: {
          cash_difference?: number | null
          closed_at?: string | null
          closing_cash?: number | null
          created_at?: string
          expected_cash?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by?: string
          opening_cash?: number
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      product_batches: {
        Row: {
          batch_number: string
          cost_price: number | null
          created_at: string
          current_stock: number
          expiry_date: string | null
          id: string
          is_active: boolean
          manufactured_date: string | null
          product_id: string
          tenant_id: string
          variant_id: string | null
        }
        Insert: {
          batch_number: string
          cost_price?: number | null
          created_at?: string
          current_stock?: number
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          manufactured_date?: string | null
          product_id: string
          tenant_id: string
          variant_id?: string | null
        }
        Update: {
          batch_number?: string
          cost_price?: number | null
          created_at?: string
          current_stock?: number
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          manufactured_date?: string | null
          product_id?: string
          tenant_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_batches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_batches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_batches_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          compare_at_price: number | null
          created_at: string
          height: number | null
          id: string
          is_active: boolean
          length: number | null
          price: number
          product_id: string
          sku: string | null
          stock_qty: number
          tenant_id: string
          updated_at: string
          weight: number | null
          width: number | null
        }
        Insert: {
          compare_at_price?: number | null
          created_at?: string
          height?: number | null
          id?: string
          is_active?: boolean
          length?: number | null
          price: number
          product_id: string
          sku?: string | null
          stock_qty?: number
          tenant_id: string
          updated_at?: string
          weight?: number | null
          width?: number | null
        }
        Update: {
          compare_at_price?: number | null
          created_at?: string
          height?: number | null
          id?: string
          is_active?: boolean
          length?: number | null
          price?: number
          product_id?: string
          sku?: string | null
          stock_qty?: number
          tenant_id?: string
          updated_at?: string
          weight?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      product_zone_availability: {
        Row: {
          created_at: string
          id: string
          is_available: boolean
          product_id: string
          tenant_id: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_available?: boolean
          product_id: string
          tenant_id: string
          zone_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_available?: boolean
          product_id?: string
          tenant_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_zone_availability_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_zone_availability_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_zone_availability_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_zone_availability_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          brand_id: string | null
          category_id: string | null
          compare_at_price: number | null
          created_at: string
          description: string | null
          has_variants: boolean
          id: string
          images: Json | null
          is_active: boolean
          low_stock_threshold: number | null
          name: string
          price: number
          product_delivery_fee: number | null
          product_delivery_fee_enabled: boolean | null
          product_height: number | null
          product_length: number | null
          product_weight: number | null
          product_width: number | null
          sku: string | null
          slug: string
          stock_qty: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          brand_id?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          has_variants?: boolean
          id?: string
          images?: Json | null
          is_active?: boolean
          low_stock_threshold?: number | null
          name: string
          price?: number
          product_delivery_fee?: number | null
          product_delivery_fee_enabled?: boolean | null
          product_height?: number | null
          product_length?: number | null
          product_weight?: number | null
          product_width?: number | null
          sku?: string | null
          slug: string
          stock_qty?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          brand_id?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          has_variants?: boolean
          id?: string
          images?: Json | null
          is_active?: boolean
          low_stock_threshold?: number | null
          name?: string
          price?: number
          product_delivery_fee?: number | null
          product_delivery_fee_enabled?: boolean | null
          product_height?: number | null
          product_length?: number | null
          product_weight?: number | null
          product_width?: number | null
          sku?: string | null
          slug?: string
          stock_qty?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          onboarding_completed: boolean
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
          onboarding_completed?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          onboarding_completed?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          batch_number: string | null
          cost_price: number
          created_at: string
          expiry_date: string | null
          id: string
          line_total: number
          product_id: string
          purchase_order_id: string
          quantity_ordered: number
          quantity_received: number
          tenant_id: string
          variant_id: string | null
        }
        Insert: {
          batch_number?: string | null
          cost_price: number
          created_at?: string
          expiry_date?: string | null
          id?: string
          line_total: number
          product_id: string
          purchase_order_id: string
          quantity_ordered: number
          quantity_received?: number
          tenant_id: string
          variant_id?: string | null
        }
        Update: {
          batch_number?: string | null
          cost_price?: number
          created_at?: string
          expiry_date?: string | null
          id?: string
          line_total?: number
          product_id?: string
          purchase_order_id?: string
          quantity_ordered?: number
          quantity_received?: number
          tenant_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          expected_date: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          received_date: string | null
          status: Database["public"]["Enums"]["purchase_order_status"]
          subtotal: number
          supplier_id: string
          tax_amount: number
          tenant_id: string
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          received_date?: string | null
          status?: Database["public"]["Enums"]["purchase_order_status"]
          subtotal?: number
          supplier_id: string
          tax_amount?: number
          tenant_id: string
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          received_date?: string | null
          status?: Database["public"]["Enums"]["purchase_order_status"]
          subtotal?: number
          supplier_id?: string
          tax_amount?: number
          tenant_id?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      query_performance_log: {
        Row: {
          created_at: string | null
          execution_time_ms: number
          id: string
          query_name: string
          rows_returned: number | null
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          execution_time_ms: number
          id?: string
          query_name: string
          rows_returned?: number | null
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          execution_time_ms?: number
          id?: string
          query_name?: string
          rows_returned?: number | null
          tenant_id?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number | null
          key: string
          last_request: string | null
        }
        Insert: {
          count?: number | null
          key: string
          last_request?: string | null
        }
        Update: {
          count?: number | null
          key?: string
          last_request?: string | null
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          order_id: string
          payment_intent_id: string | null
          processed_at: string | null
          razorpay_payment_id: string
          razorpay_refund_id: string | null
          reason: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          order_id: string
          payment_intent_id?: string | null
          processed_at?: string | null
          razorpay_payment_id: string
          razorpay_refund_id?: string | null
          reason?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          order_id?: string
          payment_intent_id?: string | null
          processed_at?: string | null
          razorpay_payment_id?: string
          razorpay_refund_id?: string | null
          reason?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_intent_id_fkey"
            columns: ["payment_intent_id"]
            isOneToOne: false
            referencedRelation: "payment_intents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      return_requests: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          customer_id: string
          id: string
          order_id: string
          payment_details: Json | null
          reason: string
          refund_method: string | null
          status: Database["public"]["Enums"]["return_status"] | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          order_id: string
          payment_details?: Json | null
          reason: string
          refund_method?: string | null
          status?: Database["public"]["Enums"]["return_status"] | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          order_id?: string
          payment_details?: Json | null
          reason?: string
          refund_method?: string | null
          status?: Database["public"]["Enums"]["return_status"] | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "return_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      section_templates: {
        Row: {
          created_at: string | null
          css_code: string | null
          html_code: string | null
          id: string
          is_public: boolean | null
          preview_image_url: string | null
          template_name: string
          template_type: string
          tenant_id: string | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          css_code?: string | null
          html_code?: string | null
          id?: string
          is_public?: boolean | null
          preview_image_url?: string | null
          template_name: string
          template_type: string
          tenant_id?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          css_code?: string | null
          html_code?: string | null
          id?: string
          is_public?: boolean | null
          preview_image_url?: string | null
          template_name?: string
          template_type?: string
          tenant_id?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "section_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "section_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_tracking_updates: {
        Row: {
          awb_code: string | null
          courier_name: string | null
          created_at: string
          id: string
          location: string | null
          order_id: string
          raw_data: Json | null
          shipment_id: string
          status: string
          tenant_id: string
          timestamp: string
        }
        Insert: {
          awb_code?: string | null
          courier_name?: string | null
          created_at?: string
          id?: string
          location?: string | null
          order_id: string
          raw_data?: Json | null
          shipment_id: string
          status: string
          tenant_id: string
          timestamp: string
        }
        Update: {
          awb_code?: string | null
          courier_name?: string | null
          created_at?: string
          id?: string
          location?: string | null
          order_id?: string
          raw_data?: Json | null
          shipment_id?: string
          status?: string
          tenant_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_tracking_updates_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_tracking_updates_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shiprocket_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_tracking_updates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_tracking_updates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_webhooks: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          order_id: string | null
          payload: Json
          processed: boolean
          processed_at: string | null
          retry_count: number
          shipment_id: string | null
          shiprocket_event_id: string | null
          tenant_id: string
          webhook_type: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          order_id?: string | null
          payload: Json
          processed?: boolean
          processed_at?: string | null
          retry_count?: number
          shipment_id?: string | null
          shiprocket_event_id?: string | null
          tenant_id: string
          webhook_type: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          order_id?: string | null
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          retry_count?: number
          shipment_id?: string | null
          shiprocket_event_id?: string | null
          tenant_id?: string
          webhook_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_webhooks_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_webhooks_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shiprocket_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_webhooks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_webhooks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      shiprocket_shipments: {
        Row: {
          awb_code: string | null
          courier_name: string | null
          created_at: string
          current_location: string | null
          estimated_delivery_date: string | null
          id: string
          last_tracking_status: string | null
          last_tracking_update_at: string | null
          order_id: string
          raw_response: Json | null
          shipment_id: string | null
          shiprocket_order_id: string | null
          status: string | null
          tenant_id: string
          tracking_url: string | null
        }
        Insert: {
          awb_code?: string | null
          courier_name?: string | null
          created_at?: string
          current_location?: string | null
          estimated_delivery_date?: string | null
          id?: string
          last_tracking_status?: string | null
          last_tracking_update_at?: string | null
          order_id: string
          raw_response?: Json | null
          shipment_id?: string | null
          shiprocket_order_id?: string | null
          status?: string | null
          tenant_id: string
          tracking_url?: string | null
        }
        Update: {
          awb_code?: string | null
          courier_name?: string | null
          created_at?: string
          current_location?: string | null
          estimated_delivery_date?: string | null
          id?: string
          last_tracking_status?: string | null
          last_tracking_update_at?: string | null
          order_id?: string
          raw_response?: Json | null
          shipment_id?: string | null
          shiprocket_order_id?: string | null
          status?: string | null
          tenant_id?: string
          tracking_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shiprocket_shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shiprocket_shipments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shiprocket_shipments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      store_analytics_daily: {
        Row: {
          avg_load_time_ms: number | null
          avg_session_duration_seconds: number | null
          bounce_rate: number | null
          conversion_rate: number | null
          country_breakdown: Json | null
          created_at: string
          date: string
          device_breakdown: Json | null
          failed_payments: number | null
          id: string
          page_views: number | null
          successful_payments: number | null
          tenant_id: string
          top_pages: Json | null
          top_referrers: Json | null
          total_orders: number | null
          total_revenue: number | null
          total_sessions: number | null
          unique_visitors: number | null
        }
        Insert: {
          avg_load_time_ms?: number | null
          avg_session_duration_seconds?: number | null
          bounce_rate?: number | null
          conversion_rate?: number | null
          country_breakdown?: Json | null
          created_at?: string
          date: string
          device_breakdown?: Json | null
          failed_payments?: number | null
          id?: string
          page_views?: number | null
          successful_payments?: number | null
          tenant_id: string
          top_pages?: Json | null
          top_referrers?: Json | null
          total_orders?: number | null
          total_revenue?: number | null
          total_sessions?: number | null
          unique_visitors?: number | null
        }
        Update: {
          avg_load_time_ms?: number | null
          avg_session_duration_seconds?: number | null
          bounce_rate?: number | null
          conversion_rate?: number | null
          country_breakdown?: Json | null
          created_at?: string
          date?: string
          device_breakdown?: Json | null
          failed_payments?: number | null
          id?: string
          page_views?: number | null
          successful_payments?: number | null
          tenant_id?: string
          top_pages?: Json | null
          top_referrers?: Json | null
          total_orders?: number | null
          total_revenue?: number | null
          total_sessions?: number | null
          unique_visitors?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "store_analytics_daily_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_analytics_daily_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      store_banners: {
        Row: {
          created_at: string
          cta_text: string | null
          cta_url: string | null
          device_type: string
          ends_at: string | null
          id: string
          image_path: string
          is_active: boolean
          position: number
          starts_at: string | null
          subtitle: string | null
          tenant_id: string
          title: string
        }
        Insert: {
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          device_type?: string
          ends_at?: string | null
          id?: string
          image_path: string
          is_active?: boolean
          position?: number
          starts_at?: string | null
          subtitle?: string | null
          tenant_id: string
          title: string
        }
        Update: {
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          device_type?: string
          ends_at?: string | null
          id?: string
          image_path?: string
          is_active?: boolean
          position?: number
          starts_at?: string | null
          subtitle?: string | null
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_banners_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_banners_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      store_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          page_url: string | null
          session_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          page_url?: string | null
          session_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          page_url?: string | null
          session_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      store_page_views: {
        Row: {
          id: string
          load_time_ms: number | null
          page_title: string | null
          page_url: string
          scroll_depth: number | null
          session_id: string
          tenant_id: string
          time_on_page_seconds: number | null
          viewed_at: string
        }
        Insert: {
          id?: string
          load_time_ms?: number | null
          page_title?: string | null
          page_url: string
          scroll_depth?: number | null
          session_id: string
          tenant_id: string
          time_on_page_seconds?: number | null
          viewed_at?: string
        }
        Update: {
          id?: string
          load_time_ms?: number | null
          page_title?: string | null
          page_url?: string
          scroll_depth?: number | null
          session_id?: string
          tenant_id?: string
          time_on_page_seconds?: number | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_page_views_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_page_views_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      store_pages: {
        Row: {
          content_html: string
          created_at: string
          id: string
          is_published: boolean
          slug: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content_html?: string
          created_at?: string
          id?: string
          is_published?: boolean
          slug: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content_html?: string
          created_at?: string
          id?: string
          is_published?: boolean
          slug?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_pages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_pages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      store_performance_metrics: {
        Row: {
          cls: number | null
          connection_type: string | null
          device_type: string | null
          dom_complete_ms: number | null
          dom_interactive_ms: number | null
          fcp_ms: number | null
          fid_ms: number | null
          id: string
          lcp_ms: number | null
          measured_at: string
          page_url: string
          tenant_id: string
          ttfb_ms: number | null
        }
        Insert: {
          cls?: number | null
          connection_type?: string | null
          device_type?: string | null
          dom_complete_ms?: number | null
          dom_interactive_ms?: number | null
          fcp_ms?: number | null
          fid_ms?: number | null
          id?: string
          lcp_ms?: number | null
          measured_at?: string
          page_url: string
          tenant_id: string
          ttfb_ms?: number | null
        }
        Update: {
          cls?: number | null
          connection_type?: string | null
          device_type?: string | null
          dom_complete_ms?: number | null
          dom_interactive_ms?: number | null
          fcp_ms?: number | null
          fid_ms?: number | null
          id?: string
          lcp_ms?: number | null
          measured_at?: string
          page_url?: string
          tenant_id?: string
          ttfb_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "store_performance_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_performance_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      store_sessions: {
        Row: {
          browser: string | null
          cart_value: number | null
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          device_type: string | null
          duration_seconds: number | null
          ended_at: string | null
          exit_page: string | null
          id: string
          is_bounce: boolean | null
          is_converted: boolean | null
          landing_page: string | null
          latitude: number | null
          longitude: number | null
          order_id: string | null
          os: string | null
          page_views: number | null
          referrer: string | null
          region: string | null
          session_id: string
          started_at: string
          tenant_id: string
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          cart_value?: number | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          exit_page?: string | null
          id?: string
          is_bounce?: boolean | null
          is_converted?: boolean | null
          landing_page?: string | null
          latitude?: number | null
          longitude?: number | null
          order_id?: string | null
          os?: string | null
          page_views?: number | null
          referrer?: string | null
          region?: string | null
          session_id: string
          started_at?: string
          tenant_id: string
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          cart_value?: number | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          exit_page?: string | null
          id?: string
          is_bounce?: boolean | null
          is_converted?: boolean | null
          landing_page?: string | null
          latitude?: number | null
          longitude?: number | null
          order_id?: string | null
          os?: string | null
          page_views?: number | null
          referrer?: string | null
          region?: string | null
          session_id?: string
          started_at?: string
          tenant_id?: string
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_sessions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          created_at: string
          favicon_path: string | null
          logo_path: string | null
          show_footer: boolean
          show_header: boolean
          store_address: string | null
          store_email: string | null
          store_phone: string | null
          tenant_id: string
          updated_at: string
          website_description: string | null
          website_title: string | null
        }
        Insert: {
          created_at?: string
          favicon_path?: string | null
          logo_path?: string | null
          show_footer?: boolean
          show_header?: boolean
          store_address?: string | null
          store_email?: string | null
          store_phone?: string | null
          tenant_id: string
          updated_at?: string
          website_description?: string | null
          website_title?: string | null
        }
        Update: {
          created_at?: string
          favicon_path?: string | null
          logo_path?: string | null
          show_footer?: boolean
          show_header?: boolean
          store_address?: string | null
          store_email?: string | null
          store_phone?: string | null
          tenant_id?: string
          updated_at?: string
          website_description?: string | null
          website_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          created_at: string
          id: string
          razorpay_payment_id: string | null
          razorpay_subscription_id: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          razorpay_payment_id?: string | null
          razorpay_subscription_id?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          razorpay_payment_id?: string | null
          razorpay_subscription_id?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health_checks: {
        Row: {
          check_type: string
          checked_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          response_time_ms: number | null
          status: string
          tenant_id: string | null
        }
        Insert: {
          check_type: string
          checked_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          status: string
          tenant_id?: string | null
        }
        Update: {
          check_type?: string
          checked_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          status?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_health_checks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_health_checks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_delivery_settings: {
        Row: {
          asap_eta_minutes: number
          created_at: string
          delivery_fee: number
          delivery_mode: string
          distance_based_delivery_enabled: boolean | null
          distance_calculation_type: string | null
          distance_slabs: Json | null
          fixed_delivery_fee_enabled: boolean | null
          free_delivery_above: number | null
          free_delivery_enabled: boolean | null
          max_delivery_distance: number | null
          max_delivery_fee: number | null
          max_delivery_fee_enabled: boolean | null
          min_order_amount: number
          minimum_order_enabled: boolean | null
          per_km_rate: number | null
          rounding_rule: string | null
          store_address: string | null
          store_latitude: number | null
          store_longitude: number | null
          tenant_id: string
        }
        Insert: {
          asap_eta_minutes?: number
          created_at?: string
          delivery_fee?: number
          delivery_mode?: string
          distance_based_delivery_enabled?: boolean | null
          distance_calculation_type?: string | null
          distance_slabs?: Json | null
          fixed_delivery_fee_enabled?: boolean | null
          free_delivery_above?: number | null
          free_delivery_enabled?: boolean | null
          max_delivery_distance?: number | null
          max_delivery_fee?: number | null
          max_delivery_fee_enabled?: boolean | null
          min_order_amount?: number
          minimum_order_enabled?: boolean | null
          per_km_rate?: number | null
          rounding_rule?: string | null
          store_address?: string | null
          store_latitude?: number | null
          store_longitude?: number | null
          tenant_id: string
        }
        Update: {
          asap_eta_minutes?: number
          created_at?: string
          delivery_fee?: number
          delivery_mode?: string
          distance_based_delivery_enabled?: boolean | null
          distance_calculation_type?: string | null
          distance_slabs?: Json | null
          fixed_delivery_fee_enabled?: boolean | null
          free_delivery_above?: number | null
          free_delivery_enabled?: boolean | null
          max_delivery_distance?: number | null
          max_delivery_fee?: number | null
          max_delivery_fee_enabled?: boolean | null
          min_order_amount?: number
          minimum_order_enabled?: boolean | null
          per_km_rate?: number | null
          rounding_rule?: string | null
          store_address?: string | null
          store_latitude?: number | null
          store_longitude?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_delivery_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_delivery_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_delivery_settings_d2c: {
        Row: {
          fixed_delivery_fee: number | null
          fixed_delivery_fee_enabled: boolean | null
          free_delivery_enabled: boolean | null
          free_delivery_threshold: number | null
          max_delivery_fee: number | null
          max_delivery_fee_enabled: boolean | null
          minimum_order_enabled: boolean | null
          minimum_order_value: number | null
          per_kg_rate: number | null
          tenant_id: string
          updated_at: string | null
          weight_based_delivery_enabled: boolean | null
          weight_calculation_type: string | null
          weight_slabs: Json | null
        }
        Insert: {
          fixed_delivery_fee?: number | null
          fixed_delivery_fee_enabled?: boolean | null
          free_delivery_enabled?: boolean | null
          free_delivery_threshold?: number | null
          max_delivery_fee?: number | null
          max_delivery_fee_enabled?: boolean | null
          minimum_order_enabled?: boolean | null
          minimum_order_value?: number | null
          per_kg_rate?: number | null
          tenant_id: string
          updated_at?: string | null
          weight_based_delivery_enabled?: boolean | null
          weight_calculation_type?: string | null
          weight_slabs?: Json | null
        }
        Update: {
          fixed_delivery_fee?: number | null
          fixed_delivery_fee_enabled?: boolean | null
          free_delivery_enabled?: boolean | null
          free_delivery_threshold?: number | null
          max_delivery_fee?: number | null
          max_delivery_fee_enabled?: boolean | null
          minimum_order_enabled?: boolean | null
          minimum_order_value?: number | null
          per_kg_rate?: number | null
          tenant_id?: string
          updated_at?: string | null
          weight_based_delivery_enabled?: boolean | null
          weight_calculation_type?: string | null
          weight_slabs?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_delivery_settings_d2c_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_delivery_settings_d2c_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_integrations: {
        Row: {
          created_at: string
          id: string
          razorpay_key_id: string | null
          razorpay_key_secret: string | null
          razorpay_oauth_access_token: string | null
          razorpay_oauth_connected: boolean | null
          razorpay_oauth_merchant_id: string | null
          razorpay_oauth_public_token: string | null
          razorpay_oauth_refresh_token: string | null
          razorpay_oauth_state: string | null
          razorpay_oauth_token_expires_at: string | null
          shiprocket_email: string | null
          shiprocket_password: string | null
          shiprocket_pickup_location: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          razorpay_key_id?: string | null
          razorpay_key_secret?: string | null
          razorpay_oauth_access_token?: string | null
          razorpay_oauth_connected?: boolean | null
          razorpay_oauth_merchant_id?: string | null
          razorpay_oauth_public_token?: string | null
          razorpay_oauth_refresh_token?: string | null
          razorpay_oauth_state?: string | null
          razorpay_oauth_token_expires_at?: string | null
          shiprocket_email?: string | null
          shiprocket_password?: string | null
          shiprocket_pickup_location?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          razorpay_key_id?: string | null
          razorpay_key_secret?: string | null
          razorpay_oauth_access_token?: string | null
          razorpay_oauth_connected?: boolean | null
          razorpay_oauth_merchant_id?: string | null
          razorpay_oauth_public_token?: string | null
          razorpay_oauth_refresh_token?: string | null
          razorpay_oauth_state?: string | null
          razorpay_oauth_token_expires_at?: string | null
          shiprocket_email?: string | null
          shiprocket_password?: string | null
          shiprocket_pickup_location?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_integrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_integrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          business_type: Database["public"]["Enums"]["business_type"]
          created_at: string
          deleted_at: string | null
          deletion_reason: string | null
          id: string
          is_active: boolean
          phone: string | null
          plan: Database["public"]["Enums"]["plan_type"]
          store_name: string
          store_slug: string
          trial_ends_at: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_type?: Database["public"]["Enums"]["business_type"]
          created_at?: string
          deleted_at?: string | null
          deletion_reason?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          store_name: string
          store_slug: string
          trial_ends_at?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_type?: Database["public"]["Enums"]["business_type"]
          created_at?: string
          deleted_at?: string | null
          deletion_reason?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          store_name?: string
          store_slug?: string
          trial_ends_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      theme_layout_history: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          layout_data: Json
          layout_id: string
          version: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          layout_data: Json
          layout_id: string
          version: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          layout_data?: Json
          layout_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "theme_layout_history_layout_id_fkey"
            columns: ["layout_id"]
            isOneToOne: false
            referencedRelation: "theme_layouts"
            referencedColumns: ["id"]
          },
        ]
      }
      theme_layouts: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_published: boolean | null
          layout_data: Json
          layout_name: string | null
          published_at: string | null
          tenant_id: string
          updated_at: string | null
          updated_by: string | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          layout_data?: Json
          layout_name?: string | null
          published_at?: string | null
          tenant_id: string
          updated_at?: string | null
          updated_by?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          layout_data?: Json
          layout_name?: string | null
          published_at?: string | null
          tenant_id?: string
          updated_at?: string | null
          updated_by?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "theme_layouts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "theme_layouts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tenants: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tenants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tenants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      variant_attributes: {
        Row: {
          attribute_id: string
          attribute_value_id: string
          id: string
          variant_id: string
        }
        Insert: {
          attribute_id: string
          attribute_value_id: string
          id?: string
          variant_id: string
        }
        Update: {
          attribute_id?: string
          attribute_value_id?: string
          id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_attributes_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_attributes_attribute_value_id_fkey"
            columns: ["attribute_value_id"]
            isOneToOne: false
            referencedRelation: "attribute_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_attributes_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          product_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          product_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          product_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      delivery_boys_safe: {
        Row: {
          created_at: string | null
          full_name: string | null
          has_bank_account: boolean | null
          has_upi: boolean | null
          id: string | null
          is_active: boolean | null
          mobile_number: string | null
          monthly_salary: number | null
          payment_type:
            | Database["public"]["Enums"]["delivery_payment_type"]
            | null
          per_order_amount: number | null
          percentage_value: number | null
          tenant_id: string | null
          total_earned: number | null
          total_paid: number | null
          updated_at: string | null
          wallet_balance: number | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          has_bank_account?: never
          has_upi?: never
          id?: string | null
          is_active?: boolean | null
          mobile_number?: string | null
          monthly_salary?: number | null
          payment_type?:
            | Database["public"]["Enums"]["delivery_payment_type"]
            | null
          per_order_amount?: number | null
          percentage_value?: number | null
          tenant_id?: string | null
          total_earned?: number | null
          total_paid?: number | null
          updated_at?: string | null
          wallet_balance?: number | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          has_bank_account?: never
          has_upi?: never
          id?: string | null
          is_active?: boolean | null
          mobile_number?: string | null
          monthly_salary?: number | null
          payment_type?:
            | Database["public"]["Enums"]["delivery_payment_type"]
            | null
          per_order_amount?: number | null
          percentage_value?: number | null
          tenant_id?: string | null
          total_earned?: number | null
          total_paid?: number | null
          updated_at?: string | null
          wallet_balance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_boys_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_boys_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_customer_lifetime_value: {
        Row: {
          avg_order_value: number | null
          customer_id: string | null
          delivered_orders: number | null
          first_order_date: string | null
          last_order_date: string | null
          lifetime_value: number | null
          tenant_id: string | null
          total_orders: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_daily_sales_summary: {
        Row: {
          avg_order_value: number | null
          cancelled_orders: number | null
          delivered_orders: number | null
          delivered_revenue: number | null
          sale_date: string | null
          tenant_id: string | null
          total_delivery_fee: number | null
          total_orders: number | null
          total_revenue: number | null
          unique_customers: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_product_performance: {
        Row: {
          avg_selling_price: number | null
          first_sale_date: string | null
          last_sale_date: string | null
          order_count: number | null
          product_id: string | null
          tenant_id: string | null
          total_quantity_sold: number | null
          total_revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_integrations_safe: {
        Row: {
          created_at: string | null
          has_razorpay_secret: boolean | null
          has_shiprocket_password: boolean | null
          id: string | null
          razorpay_key_id: string | null
          razorpay_oauth_connected: boolean | null
          razorpay_oauth_merchant_id: string | null
          razorpay_oauth_public_token: string | null
          shiprocket_email: string | null
          shiprocket_pickup_location: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          has_razorpay_secret?: never
          has_shiprocket_password?: never
          id?: string | null
          razorpay_key_id?: string | null
          razorpay_oauth_connected?: boolean | null
          razorpay_oauth_merchant_id?: string | null
          razorpay_oauth_public_token?: string | null
          shiprocket_email?: string | null
          shiprocket_pickup_location?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          has_razorpay_secret?: never
          has_shiprocket_password?: never
          id?: string | null
          razorpay_key_id?: string | null
          razorpay_oauth_connected?: boolean | null
          razorpay_oauth_merchant_id?: string | null
          razorpay_oauth_public_token?: string | null
          shiprocket_email?: string | null
          shiprocket_pickup_location?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_integrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_integrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants_public: {
        Row: {
          business_type: Database["public"]["Enums"]["business_type"] | null
          id: string | null
          is_active: boolean | null
          store_name: string | null
          store_slug: string | null
        }
        Insert: {
          business_type?: Database["public"]["Enums"]["business_type"] | null
          id?: string | null
          is_active?: boolean | null
          store_name?: string | null
          store_slug?: string | null
        }
        Update: {
          business_type?: Database["public"]["Enums"]["business_type"] | null
          id?: string | null
          is_active?: boolean | null
          store_name?: string | null
          store_slug?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      aggregate_daily_analytics: { Args: never; Returns: undefined }
      analyze_tables: { Args: never; Returns: undefined }
      archive_old_orders: {
        Args: never
        Returns: {
          archived_items: number
          archived_orders: number
        }[]
      }
      check_stock_availability: {
        Args: { p_items: Json }
        Returns: {
          available_qty: number
          is_available: boolean
          product_id: string
          requested_qty: number
          variant_id: string
        }[]
      }
      cleanup_old_logs: { Args: never; Returns: undefined }
      create_order_atomic: {
        Args: {
          p_cart_id?: string
          p_coupon_code?: string
          p_coupon_id?: string
          p_customer_email?: string
          p_customer_id?: string
          p_customer_name?: string
          p_customer_phone?: string
          p_delivery_fee?: number
          p_delivery_option?: string
          p_delivery_slot_id?: string
          p_delivery_zone_id?: string
          p_discount_total?: number
          p_order_items?: Json
          p_order_number: string
          p_payment_method?: string
          p_payment_status?: string
          p_razorpay_order_id?: string
          p_razorpay_payment_id?: string
          p_shipping_address?: Json
          p_status?: string
          p_subtotal?: number
          p_tenant_id: string
          p_total?: number
        }
        Returns: string
      }
      create_pos_sale_atomic: {
        Args: {
          p_cash_amount?: number
          p_change_amount?: number
          p_customer_id?: string
          p_customer_name?: string
          p_customer_phone?: string
          p_discount_amount?: number
          p_items?: Json
          p_online_amount?: number
          p_payment_method?: string
          p_sale_number: string
          p_subtotal?: number
          p_tenant_id: string
          p_total?: number
        }
        Returns: string
      }
      delete_tenant: { Args: { target_tenant_id: string }; Returns: boolean }
      generate_unique_order_number: {
        Args: { p_prefix?: string; p_tenant_id: string }
        Returns: string
      }
      get_all_tables: {
        Args: never
        Returns: {
          table_name: string
        }[]
      }
      get_analytics_daily: {
        Args: { p_date_from: string; p_date_to: string; p_tenant_id: string }
        Returns: {
          date: string
          page_views: number
          total_orders: number
          total_revenue: number
          total_sessions: number
          unique_visitors: number
        }[]
      }
      get_analytics_dashboard_data: {
        Args: { p_date_from: string; p_date_to: string; p_tenant_id: string }
        Returns: Json
      }
      get_analytics_summary: {
        Args: { p_date_from?: string; p_date_to?: string; p_tenant_id: string }
        Returns: {
          avg_load_time: number
          avg_session_duration: number
          bounce_rate: number
          conversion_rate: number
          failed_payments: number
          successful_payments: number
          total_orders: number
          total_page_views: number
          total_revenue: number
          total_sessions: number
          unique_visitors: number
        }[]
      }
      get_dashboard_stats: {
        Args: { p_date_from?: string; p_date_to?: string; p_tenant_id: string }
        Returns: {
          avg_order_value: number
          low_stock_products: number
          pending_orders: number
          total_customers: number
          total_orders: number
          total_products: number
          total_revenue: number
        }[]
      }
      get_delivery_boy_tenant_id: {
        Args: { delivery_boy_uuid: string }
        Returns: string
      }
      get_live_session_stats: {
        Args: { p_minutes?: number; p_tenant_id: string }
        Returns: {
          active_carts: number
          active_sessions: number
          checking_out: number
          purchased: number
          top_locations: Json
          visitors_right_now: number
        }[]
      }
      get_live_visitors: {
        Args: { p_tenant_id: string }
        Returns: {
          count: number
          locations: Json
        }[]
      }
      get_paginated_orders: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_payment_status?: string
          p_status?: string
          p_tenant_id: string
        }
        Returns: {
          orders: Json
          total_count: number
        }[]
      }
      get_paginated_products: {
        Args: {
          p_brand_id?: string
          p_category_id?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_tenant_id: string
        }
        Returns: {
          products: Json
          total_count: number
        }[]
      }
      get_pending_retries: {
        Args: { p_limit?: number }
        Returns: {
          attempts: number
          id: string
          operation_id: string
          operation_type: string
          payload: Json
          tenant_id: string
        }[]
      }
      get_tenant_id_by_domain: {
        Args: { custom_domain: string }
        Returns: string
      }
      get_tenant_id_by_slug: { Args: { store_slug: string }; Returns: string }
      get_user_accessible_tenant_ids: { Args: never; Returns: string[] }
      get_user_primary_tenant_id: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
      get_user_tenant_id: { Args: never; Returns: string }
      get_user_tenants: {
        Args: never
        Returns: {
          business_type: string
          created_at: string
          id: string
          is_active: boolean
          is_primary: boolean
          plan: string
          store_name: string
          store_slug: string
          trial_ends_at: string
        }[]
      }
      increment_coupon_usage: {
        Args: { p_coupon_id: string }
        Returns: undefined
      }
      is_super_admin: { Args: never; Returns: boolean }
      is_tenant_active: { Args: { p_tenant_id: string }; Returns: boolean }
      order_belongs_to_tenant: {
        Args: { _order_id: string; _tenant_id: string }
        Returns: boolean
      }
      reduce_stock_atomic: { Args: { p_items: Json }; Returns: boolean }
      refresh_analytics_views: { Args: never; Returns: undefined }
      refresh_today_analytics: {
        Args: { p_tenant_id: string }
        Returns: undefined
      }
      schedule_operation_retry: {
        Args: {
          p_error_message?: string
          p_operation_id: string
          p_operation_type: string
          p_payload: Json
          p_tenant_id: string
        }
        Returns: string
      }
      search_products: {
        Args: {
          p_brand_id?: string
          p_category_id?: string
          p_limit?: number
          p_max_price?: number
          p_min_price?: number
          p_offset?: number
          p_search_query: string
          p_tenant_id: string
        }
        Returns: {
          products: Json
          total_count: number
        }[]
      }
      set_primary_tenant: {
        Args: { target_tenant_id: string }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      user_has_tenant_access: {
        Args: { p_tenant_id: string }
        Returns: boolean
      }
      validate_delivery_boy_session: {
        Args: { p_token: string }
        Returns: string
      }
    }
    Enums: {
      business_type: "ecommerce" | "grocery"
      delivery_payment_type:
        | "monthly_salary"
        | "fixed_per_order"
        | "percentage_per_order"
      delivery_status:
        | "unassigned"
        | "assigned"
        | "picked_up"
        | "out_for_delivery"
        | "delivered"
        | "failed"
        | "returned"
      inventory_movement_type:
        | "purchase_received"
        | "sale"
        | "pos_sale"
        | "adjustment_add"
        | "adjustment_remove"
        | "return_customer"
        | "return_supplier"
        | "expired"
        | "damaged"
        | "transfer_in"
        | "transfer_out"
      payout_status: "pending" | "approved" | "paid" | "rejected"
      plan_type: "trial" | "pro"
      purchase_order_status:
        | "draft"
        | "ordered"
        | "partial"
        | "received"
        | "cancelled"
      return_status:
        | "requested"
        | "approved"
        | "rejected"
        | "refunded"
        | "cancelled"
      user_role: "owner" | "super_admin"
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
      business_type: ["ecommerce", "grocery"],
      delivery_payment_type: [
        "monthly_salary",
        "fixed_per_order",
        "percentage_per_order",
      ],
      delivery_status: [
        "unassigned",
        "assigned",
        "picked_up",
        "out_for_delivery",
        "delivered",
        "failed",
        "returned",
      ],
      inventory_movement_type: [
        "purchase_received",
        "sale",
        "pos_sale",
        "adjustment_add",
        "adjustment_remove",
        "return_customer",
        "return_supplier",
        "expired",
        "damaged",
        "transfer_in",
        "transfer_out",
      ],
      payout_status: ["pending", "approved", "paid", "rejected"],
      plan_type: ["trial", "pro"],
      purchase_order_status: [
        "draft",
        "ordered",
        "partial",
        "received",
        "cancelled",
      ],
      return_status: [
        "requested",
        "approved",
        "rejected",
        "refunded",
        "cancelled",
      ],
      user_role: ["owner", "super_admin"],
    },
  },
} as const
