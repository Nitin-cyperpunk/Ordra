export type Json =
  string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      cafe_invitations: {
        Row: {
          cafe_id: string;
          created_at: string;
          email: string;
          id: string;
          invited_by: string;
          role: Database["public"]["Enums"]["cafe_role"];
          status: Database["public"]["Enums"]["cafe_invite_status"];
          token: string;
          updated_at: string;
        };
        Insert: {
          cafe_id: string;
          created_at?: string;
          email: string;
          id?: string;
          invited_by: string;
          role: Database["public"]["Enums"]["cafe_role"];
          status?: Database["public"]["Enums"]["cafe_invite_status"];
          token?: string;
          updated_at?: string;
        };
        Update: {
          cafe_id?: string;
          created_at?: string;
          email?: string;
          id?: string;
          invited_by?: string;
          role?: Database["public"]["Enums"]["cafe_role"];
          status?: Database["public"]["Enums"]["cafe_invite_status"];
          token?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cafe_invitations_cafe_id_fkey";
            columns: ["cafe_id"];
            isOneToOne: false;
            referencedRelation: "cafes";
            referencedColumns: ["id"];
          },
        ];
      };
      cafe_table_sections: {
        Row: {
          cafe_id: string;
          created_at: string;
          id: string;
          name: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          cafe_id: string;
          created_at?: string;
          id?: string;
          name: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          cafe_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cafe_table_sections_cafe_id_fkey";
            columns: ["cafe_id"];
            isOneToOne: false;
            referencedRelation: "cafes";
            referencedColumns: ["id"];
          },
        ];
      };
      cafe_tables: {
        Row: {
          cafe_id: string;
          capacity: number;
          code: string;
          created_at: string;
          id: string;
          public_token: string;
          section_id: string | null;
          sort_order: number;
          status: Database["public"]["Enums"]["cafe_table_status"];
          updated_at: string;
        };
        Insert: {
          cafe_id: string;
          capacity: number;
          code: string;
          created_at?: string;
          id?: string;
          public_token?: string;
          section_id?: string | null;
          sort_order?: number;
          status?: Database["public"]["Enums"]["cafe_table_status"];
          updated_at?: string;
        };
        Update: {
          cafe_id?: string;
          capacity?: number;
          code?: string;
          created_at?: string;
          id?: string;
          public_token?: string;
          section_id?: string | null;
          sort_order?: number;
          status?: Database["public"]["Enums"]["cafe_table_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cafe_tables_cafe_id_fkey";
            columns: ["cafe_id"];
            isOneToOne: false;
            referencedRelation: "cafes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cafe_tables_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "cafe_table_sections";
            referencedColumns: ["id"];
          },
        ];
      };
      cafes: {
        Row: {
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          country: string | null;
          cover_image_url: string | null;
          created_at: string;
          currency: string;
          description: string | null;
          email: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          opening_hours: Json;
          owner_id: string;
          phone: string | null;
          postal_code: string | null;
          slug: string;
          state: string | null;
          status: Database["public"]["Enums"]["cafe_status"];
          timezone: string;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          country?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          currency?: string;
          description?: string | null;
          email?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          opening_hours?: Json;
          owner_id: string;
          phone?: string | null;
          postal_code?: string | null;
          slug: string;
          state?: string | null;
          status?: Database["public"]["Enums"]["cafe_status"];
          timezone?: string;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          country?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          currency?: string;
          description?: string | null;
          email?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          opening_hours?: Json;
          owner_id?: string;
          phone?: string | null;
          postal_code?: string | null;
          slug?: string;
          state?: string | null;
          status?: Database["public"]["Enums"]["cafe_status"];
          timezone?: string;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      memberships: {
        Row: {
          cafe_id: string;
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["cafe_role"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          cafe_id: string;
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["cafe_role"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cafe_id?: string;
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["cafe_role"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memberships_cafe_id_fkey";
            columns: ["cafe_id"];
            isOneToOne: false;
            referencedRelation: "cafes";
            referencedColumns: ["id"];
          },
        ];
      };
      menu_categories: {
        Row: {
          cafe_id: string;
          created_at: string;
          description: string | null;
          display_order: number;
          id: string;
          is_active: boolean;
          name: string;
          updated_at: string;
        };
        Insert: {
          cafe_id: string;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          name: string;
          updated_at?: string;
        };
        Update: {
          cafe_id?: string;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "menu_categories_cafe_id_fkey";
            columns: ["cafe_id"];
            isOneToOne: false;
            referencedRelation: "cafes";
            referencedColumns: ["id"];
          },
        ];
      };
      menu_items: {
        Row: {
          cafe_id: string;
          category_id: string;
          created_at: string;
          description: string | null;
          diet: Database["public"]["Enums"]["menu_item_diet"];
          display_order: number;
          id: string;
          image_path: string | null;
          is_available: boolean;
          name: string;
          price: number;
          source_import_id: string | null;
          updated_at: string;
        };
        Insert: {
          cafe_id: string;
          category_id: string;
          created_at?: string;
          description?: string | null;
          diet?: Database["public"]["Enums"]["menu_item_diet"];
          display_order?: number;
          id?: string;
          image_path?: string | null;
          is_available?: boolean;
          name: string;
          price: number;
          source_import_id?: string | null;
          updated_at?: string;
        };
        Update: {
          cafe_id?: string;
          category_id?: string;
          created_at?: string;
          description?: string | null;
          diet?: Database["public"]["Enums"]["menu_item_diet"];
          display_order?: number;
          id?: string;
          image_path?: string | null;
          is_available?: boolean;
          name?: string;
          price?: number;
          source_import_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "menu_items_cafe_id_fkey";
            columns: ["cafe_id"];
            isOneToOne: false;
            referencedRelation: "cafes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "menu_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "menu_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "menu_items_source_import_id_fkey";
            columns: ["source_import_id"];
            isOneToOne: false;
            referencedRelation: "menu_imports";
            referencedColumns: ["id"];
          },
        ];
      };
      menu_imports: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          cafe_id: string;
          completed_at: string | null;
          created_at: string;
          created_by: string;
          error_code: string | null;
          extracted_payload: Json | null;
          id: string;
          provider: string | null;
          source_file_name: string;
          source_file_path: string;
          source_file_size: number;
          source_mime: string;
          status: Database["public"]["Enums"]["menu_import_status"];
          updated_at: string;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          cafe_id: string;
          completed_at?: string | null;
          created_at?: string;
          created_by: string;
          error_code?: string | null;
          extracted_payload?: Json | null;
          id?: string;
          provider?: string | null;
          source_file_name: string;
          source_file_path: string;
          source_file_size: number;
          source_mime: string;
          status?: Database["public"]["Enums"]["menu_import_status"];
          updated_at?: string;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          cafe_id?: string;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string;
          error_code?: string | null;
          extracted_payload?: Json | null;
          id?: string;
          provider?: string | null;
          source_file_name?: string;
          source_file_path?: string;
          source_file_size?: number;
          source_mime?: string;
          status?: Database["public"]["Enums"]["menu_import_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "menu_imports_cafe_id_fkey";
            columns: ["cafe_id"];
            isOneToOne: false;
            referencedRelation: "cafes";
            referencedColumns: ["id"];
          },
        ];
      };
      waitlist: {
        Row: {
          cafe_address: string;
          cafe_name: string;
          created_at: string;
          email: string;
          id: string;
          owner_name: string;
          phone: string;
          status: Database["public"]["Enums"]["waitlist_status"];
          updated_at: string;
        };
        Insert: {
          cafe_address: string;
          cafe_name: string;
          created_at?: string;
          email: string;
          id?: string;
          owner_name: string;
          phone: string;
          status?: Database["public"]["Enums"]["waitlist_status"];
          updated_at?: string;
        };
        Update: {
          cafe_address?: string;
          cafe_name?: string;
          created_at?: string;
          email?: string;
          id?: string;
          owner_name?: string;
          phone?: string;
          status?: Database["public"]["Enums"]["waitlist_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          cafe_id: string;
          completed_at: string | null;
          confirmed_at: string | null;
          created_at: string;
          customer_session_id: string;
          id: string;
          idempotency_key: string;
          notes: string | null;
          order_number: number;
          preparing_at: string | null;
          public_token: string;
          ready_at: string | null;
          rejected_at: string | null;
          rejection_reason: string | null;
          status: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          table_id: string;
          total: number;
          updated_at: string;
        };
        Insert: {
          cafe_id: string;
          completed_at?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          customer_session_id: string;
          id?: string;
          idempotency_key: string;
          notes?: string | null;
          order_number: number;
          preparing_at?: string | null;
          public_token?: string;
          ready_at?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          table_id: string;
          total: number;
          updated_at?: string;
        };
        Update: {
          cafe_id?: string;
          completed_at?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          customer_session_id?: string;
          id?: string;
          idempotency_key?: string;
          notes?: string | null;
          order_number?: number;
          preparing_at?: string | null;
          public_token?: string;
          ready_at?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal?: number;
          table_id?: string;
          total?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_cafe_id_fkey";
            columns: ["cafe_id"];
            isOneToOne: false;
            referencedRelation: "cafes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_table_id_fkey";
            columns: ["table_id"];
            isOneToOne: false;
            referencedRelation: "cafe_tables";
            referencedColumns: ["id"];
          },
        ];
      };
      order_status_history: {
        Row: {
          cafe_id: string;
          changed_by: string | null;
          created_at: string;
          id: string;
          note: string | null;
          new_status: Database["public"]["Enums"]["order_status"];
          old_status: Database["public"]["Enums"]["order_status"] | null;
          order_id: string;
        };
        Insert: {
          cafe_id: string;
          changed_by?: string | null;
          created_at?: string;
          id?: string;
          note?: string | null;
          new_status: Database["public"]["Enums"]["order_status"];
          old_status?: Database["public"]["Enums"]["order_status"] | null;
          order_id: string;
        };
        Update: {
          cafe_id?: string;
          changed_by?: string | null;
          created_at?: string;
          id?: string;
          note?: string | null;
          new_status?: Database["public"]["Enums"]["order_status"];
          old_status?: Database["public"]["Enums"]["order_status"] | null;
          order_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_status_history_cafe_id_fkey";
            columns: ["cafe_id"];
            isOneToOne: false;
            referencedRelation: "cafes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          created_at: string;
          id: string;
          item_name_snapshot: string;
          item_price_snapshot: number;
          line_total: number;
          menu_item_id: string | null;
          notes: string | null;
          order_id: string;
          quantity: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          item_name_snapshot: string;
          item_price_snapshot: number;
          line_total: number;
          menu_item_id?: string | null;
          notes?: string | null;
          order_id: string;
          quantity: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          item_name_snapshot?: string;
          item_price_snapshot?: number;
          line_total?: number;
          menu_item_id?: string | null;
          notes?: string | null;
          order_id?: string;
          quantity?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey";
            columns: ["menu_item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      cafe_invoice_counters: {
        Row: {
          cafe_id: string;
          last_number: number;
        };
        Insert: {
          cafe_id: string;
          last_number?: number;
        };
        Update: {
          cafe_id?: string;
          last_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "cafe_invoice_counters_cafe_id_fkey";
            columns: ["cafe_id"];
            isOneToOne: true;
            referencedRelation: "cafes";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          cafe_address_snapshot: string | null;
          cafe_email_snapshot: string | null;
          cafe_id: string;
          cafe_logo_url_snapshot: string | null;
          cafe_name_snapshot: string;
          cafe_phone_snapshot: string | null;
          created_at: string;
          currency: string;
          customer_name: string | null;
          customer_phone: string | null;
          discount_amount: number;
          id: string;
          invoice_number: string;
          issued_at: string;
          issued_by: string | null;
          notes_snapshot: string | null;
          order_id: string;
          order_number: number;
          status: Database["public"]["Enums"]["invoice_status"];
          subtotal: number;
          table_code: string | null;
          tax_amount: number;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          cafe_address_snapshot?: string | null;
          cafe_email_snapshot?: string | null;
          cafe_id: string;
          cafe_logo_url_snapshot?: string | null;
          cafe_name_snapshot: string;
          cafe_phone_snapshot?: string | null;
          created_at?: string;
          currency?: string;
          customer_name?: string | null;
          customer_phone?: string | null;
          discount_amount?: number;
          id?: string;
          invoice_number: string;
          issued_at?: string;
          issued_by?: string | null;
          notes_snapshot?: string | null;
          order_id: string;
          order_number: number;
          status?: Database["public"]["Enums"]["invoice_status"];
          subtotal: number;
          table_code?: string | null;
          tax_amount?: number;
          total_amount: number;
          updated_at?: string;
        };
        Update: {
          cafe_address_snapshot?: string | null;
          cafe_email_snapshot?: string | null;
          cafe_id?: string;
          cafe_logo_url_snapshot?: string | null;
          cafe_name_snapshot?: string;
          cafe_phone_snapshot?: string | null;
          created_at?: string;
          currency?: string;
          customer_name?: string | null;
          customer_phone?: string | null;
          discount_amount?: number;
          id?: string;
          invoice_number?: string;
          issued_at?: string;
          issued_by?: string | null;
          notes_snapshot?: string | null;
          order_id?: string;
          order_number?: number;
          status?: Database["public"]["Enums"]["invoice_status"];
          subtotal?: number;
          table_code?: string | null;
          tax_amount?: number;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_cafe_id_fkey";
            columns: ["cafe_id"];
            isOneToOne: false;
            referencedRelation: "cafes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: true;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice_items: {
        Row: {
          created_at: string;
          id: string;
          invoice_id: string;
          item_name_snapshot: string;
          line_total: number;
          menu_item_id: string | null;
          quantity: number;
          unit_price_snapshot: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          invoice_id: string;
          item_name_snapshot: string;
          line_total: number;
          menu_item_id?: string | null;
          quantity: number;
          unit_price_snapshot: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          invoice_id?: string;
          item_name_snapshot?: string;
          line_total?: number;
          menu_item_id?: string | null;
          quantity?: number;
          unit_price_snapshot?: number;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoice_items_menu_item_id_fkey";
            columns: ["menu_item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      public_cafes: {
        Row: {
          city: string | null;
          currency: string | null;
          description: string | null;
          id: string | null;
          logo_url: string | null;
          name: string | null;
          slug: string | null;
          status: Database["public"]["Enums"]["cafe_status"] | null;
        };
        Relationships: [];
      };
      public_cafe_tables: {
        Row: {
          cafe_id: string | null;
          code: string | null;
          public_token: string | null;
          status: Database["public"]["Enums"]["cafe_table_status"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "cafe_tables_cafe_id_fkey";
            columns: ["cafe_id"];
            isOneToOne: false;
            referencedRelation: "cafes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cafe_tables_cafe_id_fkey";
            columns: ["cafe_id"];
            isOneToOne: false;
            referencedRelation: "public_cafes";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      current_user_cafe_role: {
        Args: { p_cafe_id: string };
        Returns: Database["public"]["Enums"]["cafe_role"];
      };
      place_customer_order: {
        Args: {
          p_cafe_slug: string;
          p_customer_session_id: string;
          p_idempotency_key: string;
          p_items: Json;
          p_notes: string | null;
          p_table_token: string;
        };
        Returns: Json;
      };
      get_customer_order: {
        Args: { p_customer_session_id: string; p_public_token: string };
        Returns: Json;
      };
      transition_order_status: {
        Args: {
          p_next: Database["public"]["Enums"]["order_status"];
          p_note?: string | null;
          p_order_id: string;
        };
        Returns: Database["public"]["Tables"]["orders"]["Row"];
      };
      issue_invoice_for_order: {
        Args: { p_order_id: string };
        Returns: Database["public"]["Tables"]["invoices"]["Row"];
      };
      issue_guest_invoice: {
        Args: { p_customer_session_id: string; p_public_token: string };
        Returns: Json;
      };
      get_customer_invoice: {
        Args: { p_customer_session_id: string; p_public_token: string };
        Returns: Json;
      };
      get_cafe_insights: {
        Args: {
          p_cafe_id: string;
          p_from: string;
          p_to: string;
          p_prev_from: string;
          p_prev_to: string;
        };
        Returns: Json;
      };
      commit_menu_import: {
        Args: {
          p_cafe_id: string;
          p_draft: Json;
          p_import_id: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      cafe_invite_status: "pending" | "accepted" | "revoked";
      cafe_role: "owner" | "manager" | "staff";
      cafe_status: "active" | "inactive";
      cafe_table_status: "active" | "inactive";
      menu_item_diet: "vegetarian" | "non_vegetarian";
      menu_import_status: "uploaded" | "processing" | "review" | "completed" | "failed";
      order_status:
        "pending" | "confirmed" | "preparing" | "ready" | "completed" | "rejected";
      invoice_status: "issued";
      waitlist_status: "pending" | "contacted" | "archived";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      cafe_invite_status: ["pending", "accepted", "revoked"],
      cafe_role: ["owner", "manager", "staff"],
      cafe_status: ["active", "inactive"],
      cafe_table_status: ["active", "inactive"],
      menu_item_diet: ["vegetarian", "non_vegetarian"],
      menu_import_status: ["uploaded", "processing", "review", "completed", "failed"],
      invoice_status: ["issued"],
      waitlist_status: ["pending", "contacted", "archived"],
    },
  },
} as const;
