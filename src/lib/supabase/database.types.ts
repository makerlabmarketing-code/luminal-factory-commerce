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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          product_id: string
          requested_quantity: number
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          product_id: string
          requested_quantity: number
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          product_id?: string
          requested_quantity?: number
          updated_at?: string
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
          currency: string
          customer_id: string | null
          expires_at: string
          guest_token_hash: string | null
          id: string
          last_activity_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_id?: string | null
          expires_at?: string
          guest_token_hash?: string | null
          id?: string
          last_activity_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer_id?: string | null
          expires_at?: string
          guest_token_hash?: string | null
          id?: string
          last_activity_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      commerce_events: {
        Row: {
          aggregate_id: string
          aggregate_type: string
          created_at: string
          event_type: string
          id: string
          idempotency_key: string
          occurred_at: string
          payload: Json
          processed_at: string | null
        }
        Insert: {
          aggregate_id: string
          aggregate_type: string
          created_at?: string
          event_type: string
          id?: string
          idempotency_key: string
          occurred_at?: string
          payload?: Json
          processed_at?: string | null
        }
        Update: {
          aggregate_id?: string
          aggregate_type?: string
          created_at?: string
          event_type?: string
          id?: string
          idempotency_key?: string
          occurred_at?: string
          payload?: Json
          processed_at?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          auth_user_id: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          metadata: Json
          phone: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          metadata?: Json
          phone?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          metadata?: Json
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          id: string
          product_id: string
          quantity_on_hand: number
          quantity_reserved: number
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          id?: string
          product_id: string
          quantity_on_hand?: number
          quantity_reserved?: number
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          quantity_on_hand?: number
          quantity_reserved?: number
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total_minor: number
          order_id: string
          product_id: string | null
          product_name_snapshot: string
          quantity: number
          sku_snapshot: string | null
          unit_price_minor: number
          variant_id: string | null
          variant_name_snapshot: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          line_total_minor: number
          order_id: string
          product_id?: string | null
          product_name_snapshot: string
          quantity: number
          sku_snapshot?: string | null
          unit_price_minor: number
          variant_id?: string | null
          variant_name_snapshot?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          line_total_minor?: number
          order_id?: string
          product_id?: string | null
          product_name_snapshot?: string
          quantity?: number
          sku_snapshot?: string | null
          unit_price_minor?: number
          variant_id?: string | null
          variant_name_snapshot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_payment_summary"
            referencedColumns: ["order_id"]
          },
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
          cancelled_at: string | null
          created_at: string
          currency: string
          customer_email_snapshot: string
          customer_id: string | null
          customer_name_snapshot: string | null
          discount_minor: number
          fulfilled_at: string | null
          grand_total_minor: number
          id: string
          notes: string | null
          order_number: string
          placed_at: string | null
          shipping_minor: number
          status: string
          subtotal_minor: number
          tax_minor: number
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          customer_email_snapshot: string
          customer_id?: string | null
          customer_name_snapshot?: string | null
          discount_minor?: number
          fulfilled_at?: string | null
          grand_total_minor?: number
          id?: string
          notes?: string | null
          order_number: string
          placed_at?: string | null
          shipping_minor?: number
          status?: string
          subtotal_minor?: number
          tax_minor?: number
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          customer_email_snapshot?: string
          customer_id?: string | null
          customer_name_snapshot?: string | null
          discount_minor?: number
          fulfilled_at?: string | null
          grand_total_minor?: number
          id?: string
          notes?: string | null
          order_number?: string
          placed_at?: string | null
          shipping_minor?: number
          status?: string
          subtotal_minor?: number
          tax_minor?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_minor: number
          authorized_at: string | null
          created_at: string
          currency: string
          failed_at: string | null
          id: string
          idempotency_key: string
          order_id: string
          provider: string
          provider_fee_minor: number
          provider_payment_id: string | null
          status: string
          succeeded_at: string | null
          updated_at: string
        }
        Insert: {
          amount_minor: number
          authorized_at?: string | null
          created_at?: string
          currency?: string
          failed_at?: string | null
          id?: string
          idempotency_key: string
          order_id: string
          provider: string
          provider_fee_minor?: number
          provider_payment_id?: string | null
          status?: string
          succeeded_at?: string | null
          updated_at?: string
        }
        Update: {
          amount_minor?: number
          authorized_at?: string | null
          created_at?: string
          currency?: string
          failed_at?: string | null
          id?: string
          idempotency_key?: string
          order_id?: string
          provider?: string
          provider_fee_minor?: number
          provider_payment_id?: string | null
          status?: string
          succeeded_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_payment_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_media: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          is_primary: boolean
          media_type: string
          product_id: string
          sort_order: number
          storage_path: string
          variant_id: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          media_type: string
          product_id: string
          sort_order?: number
          storage_path: string
          variant_id?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          media_type?: string
          product_id?: string
          sort_order?: number
          storage_path?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_media_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_media_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_prices: {
        Row: {
          active_from: string | null
          active_to: string | null
          amount_minor: number
          compare_at_amount_minor: number | null
          created_at: string
          currency: string
          id: string
          is_active: boolean
          product_id: string
          variant_id: string | null
        }
        Insert: {
          active_from?: string | null
          active_to?: string | null
          amount_minor: number
          compare_at_amount_minor?: number | null
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          product_id: string
          variant_id?: string | null
        }
        Update: {
          active_from?: string | null
          active_to?: string | null
          amount_minor?: number
          compare_at_amount_minor?: number | null
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          product_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_prices_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          attributes: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          product_id: string
          sku: string | null
          updated_at: string
        }
        Insert: {
          attributes?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          product_id: string
          sku?: string | null
          updated_at?: string
        }
        Update: {
          attributes?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          product_id?: string
          sku?: string | null
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
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          product_type: string
          published_at: string | null
          release_type: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          product_type: string
          published_at?: string | null
          release_type?: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          product_type?: string
          published_at?: string | null
          release_type?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount_minor: number
          created_at: string
          id: string
          idempotency_key: string
          payment_id: string
          provider_refund_id: string | null
          reason: string | null
          status: string
          succeeded_at: string | null
          updated_at: string
        }
        Insert: {
          amount_minor: number
          created_at?: string
          id?: string
          idempotency_key: string
          payment_id: string
          provider_refund_id?: string | null
          reason?: string | null
          status?: string
          succeeded_at?: string | null
          updated_at?: string
        }
        Update: {
          amount_minor?: number
          created_at?: string
          id?: string
          idempotency_key?: string
          payment_id?: string
          provider_refund_id?: string | null
          reason?: string | null
          status?: string
          succeeded_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      order_payment_summary: {
        Row: {
          amount_due_minor: number | null
          currency: string | null
          net_received_minor: number | null
          order_id: string | null
          order_number: string | null
          paid_amount_minor: number | null
          payment_status: string | null
          refunded_amount_minor: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      consume_customer_auth_rate_limit: {
        Args: { p_bucket: string; p_key_hash: string }
        Returns: boolean
      }
      consume_guest_cart_rate_limit: {
        Args: { p_bucket: string; p_key_hash: string }
        Returns: boolean
      }
      merge_verified_customer_guest_cart: {
        Args: {
          p_auth_user_id: string
          p_guest_token_hash: string
          p_verified_email: string
        }
        Returns: {
          capped_line_count: number
          merge_state: string
          unavailable_line_count: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
