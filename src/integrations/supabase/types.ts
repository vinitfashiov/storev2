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
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
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
        ]
      }
      custom_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
          status: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          status?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_domains_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
        ]
      }
      delivery_areas: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          localities: string[] | null
          name: string
          pincodes: string[]
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          localities?: string[] | null
          name: string
          pincodes?: string[]
          tenant_id: string
        }
        Update: {
          created_at?: string
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
            foreignKeyName: "delivery_boy_areas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
            foreignKeyName: "delivery_payout_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
            foreignKeyName: "delivery_status_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
            foreignKeyName: "inventory_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
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
        ]
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
          id: string
          is_active: boolean
          price: number
          product_id: string
          sku: string | null
          stock_qty: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          compare_at_price?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          price: number
          product_id: string
          sku?: string | null
          stock_qty?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          compare_at_price?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          price?: number
          product_id?: string
          sku?: string | null
          stock_qty?: number
          tenant_id?: string
          updated_at?: string
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
        ]
      }
      shiprocket_shipments: {
        Row: {
          awb_code: string | null
          courier_name: string | null
          created_at: string
          id: string
          order_id: string
          raw_response: Json | null
          shipment_id: string | null
          shiprocket_order_id: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          awb_code?: string | null
          courier_name?: string | null
          created_at?: string
          id?: string
          order_id: string
          raw_response?: Json | null
          shipment_id?: string | null
          shiprocket_order_id?: string | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          awb_code?: string | null
          courier_name?: string | null
          created_at?: string
          id?: string
          order_id?: string
          raw_response?: Json | null
          shipment_id?: string | null
          shiprocket_order_id?: string | null
          status?: string | null
          tenant_id?: string
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
        ]
      }
      store_banners: {
        Row: {
          created_at: string
          cta_text: string | null
          cta_url: string | null
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
        ]
      }
      store_settings: {
        Row: {
          created_at: string
          favicon_path: string | null
          logo_path: string | null
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
        ]
      }
      tenant_delivery_settings: {
        Row: {
          asap_eta_minutes: number
          created_at: string
          delivery_fee: number
          delivery_mode: string
          free_delivery_above: number | null
          min_order_amount: number
          tenant_id: string
        }
        Insert: {
          asap_eta_minutes?: number
          created_at?: string
          delivery_fee?: number
          delivery_mode?: string
          free_delivery_above?: number | null
          min_order_amount?: number
          tenant_id: string
        }
        Update: {
          asap_eta_minutes?: number
          created_at?: string
          delivery_fee?: number
          delivery_mode?: string
          free_delivery_above?: number | null
          min_order_amount?: number
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
        ]
      }
      tenant_integrations: {
        Row: {
          created_at: string
          id: string
          razorpay_key_id: string | null
          razorpay_key_secret: string | null
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
        ]
      }
      tenants: {
        Row: {
          address: string | null
          business_type: Database["public"]["Enums"]["business_type"]
          created_at: string
          deleted_at: string | null
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
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_tenant: { Args: { target_tenant_id: string }; Returns: boolean }
      get_delivery_boy_tenant_id: {
        Args: { delivery_boy_uuid: string }
        Returns: string
      }
      get_tenant_id_by_domain: {
        Args: { custom_domain: string }
        Returns: string
      }
      get_tenant_id_by_slug: { Args: { store_slug: string }; Returns: string }
      get_user_primary_tenant_id: { Args: never; Returns: string }
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
      set_primary_tenant: {
        Args: { target_tenant_id: string }
        Returns: boolean
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
      user_role: "owner"
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
      user_role: ["owner"],
    },
  },
} as const
