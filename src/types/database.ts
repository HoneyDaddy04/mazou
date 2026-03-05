export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          plan: "free" | "growth" | "enterprise";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["organizations"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          org_id: string;
          email: string;
          full_name: string | null;
          role: "owner" | "admin" | "member" | "viewer";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      api_keys: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          key_prefix: string;
          key_hash: string;
          last_used_at: string | null;
          total_calls: number;
          status: "active" | "revoked";
          created_at: string;
          created_by: string;
        };
        Insert: Omit<Database["public"]["Tables"]["api_keys"]["Row"], "id" | "total_calls" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["api_keys"]["Insert"]>;
      };
      byok_keys: {
        Row: {
          id: string;
          org_id: string;
          provider: string;
          key_encrypted: string;
          label: string;
          status: "connected" | "disconnected" | "error";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["byok_keys"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["byok_keys"]["Insert"]>;
      };
      usage_logs: {
        Row: {
          id: string;
          org_id: string;
          api_key_id: string;
          model: string;
          provider: string;
          feature_tag: string | null;
          agent_id: string | null;
          input_tokens: number;
          output_tokens: number;
          cost_naira: number;
          latency_ms: number;
          routed_from: string | null;
          routed_to: string | null;
          routing_reason: string | null;
          savings_naira: number;
          cached: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["usage_logs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["usage_logs"]["Insert"]>;
      };
      agents: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          status: "live" | "idle" | "stopped";
          models: string[];
          config: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["agents"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["agents"]["Insert"]>;
      };
      routing_rules: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          description: string;
          condition: Json;
          action: Json;
          status: "active" | "paused";
          triggers_count: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["routing_rules"]["Row"], "id" | "triggers_count" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["routing_rules"]["Insert"]>;
      };
      wallets: {
        Row: {
          id: string;
          org_id: string;
          currency: "NGN" | "USDT";
          balance: number;
          auto_fund_threshold: number | null;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["wallets"]["Row"], "id" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["wallets"]["Insert"]>;
      };
      transactions: {
        Row: {
          id: string;
          org_id: string;
          wallet_id: string;
          type: "credit" | "debit";
          amount: number;
          currency: "NGN" | "USDT";
          description: string;
          reference: string | null;
          paystack_ref: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["transactions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
      };
      recommendations: {
        Row: {
          id: string;
          org_id: string;
          type: "save" | "swap" | "cache" | "batch";
          title: string;
          description: string;
          savings_naira: number;
          impact: "high" | "medium" | "low";
          status: "pending" | "applied" | "dismissed";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["recommendations"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["recommendations"]["Insert"]>;
      };
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
