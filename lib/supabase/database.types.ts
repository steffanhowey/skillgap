// Generated 2026-08-28 from SkillGap (supabase-skillgap).
// Slice of public tables created for Track F schema v0.
// Full project dump was not committed because it includes unrelated HumanDeploy tables.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      fp_artifact_versions: {
        Row: {
          artifact_id: string
          content: Json
          content_hash: string
          created_at: string
          created_by: string
          id: string
          llm_run_id: string | null
          parent_version_id: string | null
          schema_version: string
          source_packet_hash: string
          user_id: string
          version: number
        }
        Insert: {
          artifact_id: string
          content: Json
          content_hash: string
          created_at?: string
          created_by: string
          id?: string
          llm_run_id?: string | null
          parent_version_id?: string | null
          schema_version: string
          source_packet_hash: string
          user_id: string
          version: number
        }
        Update: {
          artifact_id?: string
          content?: Json
          content_hash?: string
          created_at?: string
          created_by?: string
          id?: string
          llm_run_id?: string | null
          parent_version_id?: string | null
          schema_version?: string
          source_packet_hash?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "fp_artifact_versions_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "fp_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fp_artifact_versions_llm_run_id_fkey"
            columns: ["llm_run_id"]
            isOneToOne: false
            referencedRelation: "fp_llm_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fp_artifact_versions_parent_version_id_fkey"
            columns: ["parent_version_id"]
            isOneToOne: false
            referencedRelation: "fp_artifact_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      fp_artifacts: {
        Row: {
          artifact_type: string
          attempt_id: string
          created_at: string
          current_version_id: string | null
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          artifact_type: string
          attempt_id: string
          created_at?: string
          current_version_id?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          artifact_type?: string
          attempt_id?: string
          created_at?: string
          current_version_id?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fp_artifacts_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "fp_learning_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      fp_capability_applications: {
        Row: {
          created_at: string
          evidence_rubric: Json
          id: string
          professional_function: string
          role_archetype: string
          stable_key: string
          status: string
          target_behavior: string
          updated_at: string
          version: number
          workflow: string
        }
        Insert: {
          created_at?: string
          evidence_rubric: Json
          id?: string
          professional_function: string
          role_archetype: string
          stable_key: string
          status?: string
          target_behavior: string
          updated_at?: string
          version: number
          workflow: string
        }
        Update: {
          created_at?: string
          evidence_rubric?: Json
          id?: string
          professional_function?: string
          role_archetype?: string
          stable_key?: string
          status?: string
          target_behavior?: string
          updated_at?: string
          version?: number
          workflow?: string
        }
        Relationships: []
      }
      fp_evaluation_criteria: {
        Row: {
          confidence: number | null
          criterion_key: string
          evaluation_id: string
          evidence_refs: Json
          outcome: string
          rationale: string | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          criterion_key: string
          evaluation_id: string
          evidence_refs?: Json
          outcome: string
          rationale?: string | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          criterion_key?: string
          evaluation_id?: string
          evidence_refs?: Json
          outcome?: string
          rationale?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fp_evaluation_criteria_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "fp_evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      fp_evaluations: {
        Row: {
          artifact_version_id: string
          attempt_id: string
          confidence: number | null
          content_hash: string
          created_at: string
          evaluator_key: string
          evaluator_version: string
          id: string
          llm_run_id: string | null
          prompt_version: string
          result: Json
          rubric_version: string
          status: string
          user_id: string
        }
        Insert: {
          artifact_version_id: string
          attempt_id: string
          confidence?: number | null
          content_hash: string
          created_at?: string
          evaluator_key: string
          evaluator_version: string
          id?: string
          llm_run_id?: string | null
          prompt_version: string
          result: Json
          rubric_version: string
          status: string
          user_id: string
        }
        Update: {
          artifact_version_id?: string
          attempt_id?: string
          confidence?: number | null
          content_hash?: string
          created_at?: string
          evaluator_key?: string
          evaluator_version?: string
          id?: string
          llm_run_id?: string | null
          prompt_version?: string
          result?: Json
          rubric_version?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fp_evaluations_artifact_version_id_fkey"
            columns: ["artifact_version_id"]
            isOneToOne: false
            referencedRelation: "fp_artifact_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fp_evaluations_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "fp_learning_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fp_evaluations_llm_run_id_fkey"
            columns: ["llm_run_id"]
            isOneToOne: false
            referencedRelation: "fp_llm_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      fp_learning_attempts: {
        Row: {
          application_id: string
          application_version: number
          completed_at: string | null
          current_activity_id: string | null
          delivery_context: string
          id: string
          idempotency_key: string | null
          last_activity_at: string
          room_id: string | null
          source_packet: Json
          source_packet_hash: string
          source_packet_id: string | null
          started_at: string
          state: string
          user_id: string
        }
        Insert: {
          application_id: string
          application_version: number
          completed_at?: string | null
          current_activity_id?: string | null
          delivery_context?: string
          id?: string
          idempotency_key?: string | null
          last_activity_at?: string
          room_id?: string | null
          source_packet: Json
          source_packet_hash: string
          source_packet_id?: string | null
          started_at?: string
          state?: string
          user_id: string
        }
        Update: {
          application_id?: string
          application_version?: number
          completed_at?: string | null
          current_activity_id?: string | null
          delivery_context?: string
          id?: string
          idempotency_key?: string | null
          last_activity_at?: string
          room_id?: string | null
          source_packet?: Json
          source_packet_hash?: string
          source_packet_id?: string | null
          started_at?: string
          state?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fp_learning_attempts_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "fp_capability_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fp_learning_attempts_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "fp_parties"
            referencedColumns: ["id"]
          },
        ]
      }
      fp_llm_runs: {
        Row: {
          call_site: string
          created_at: string
          estimated_cost_usd: number | null
          failure_reason: string | null
          id: string
          input_hash: string
          input_tokens: number | null
          latency_ms: number | null
          model: string
          operation: string
          output_hash: string | null
          output_tokens: number | null
          prompt_version: string
          provider_request_id: string | null
          schema_version: string | null
          status: string
          trace_id: string
          user_id: string | null
        }
        Insert: {
          call_site: string
          created_at?: string
          estimated_cost_usd?: number | null
          failure_reason?: string | null
          id?: string
          input_hash: string
          input_tokens?: number | null
          latency_ms?: number | null
          model: string
          operation: string
          output_hash?: string | null
          output_tokens?: number | null
          prompt_version: string
          provider_request_id?: string | null
          schema_version?: string | null
          status: string
          trace_id: string
          user_id?: string | null
        }
        Update: {
          call_site?: string
          created_at?: string
          estimated_cost_usd?: number | null
          failure_reason?: string | null
          id?: string
          input_hash?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model?: string
          operation?: string
          output_hash?: string | null
          output_tokens?: number | null
          prompt_version?: string
          provider_request_id?: string | null
          schema_version?: string | null
          status?: string
          trace_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicTables = Database["public"]["Tables"]

export type Tables<T extends keyof PublicTables> = PublicTables[T]["Row"]
export type TablesInsert<T extends keyof PublicTables> = PublicTables[T]["Insert"]
export type TablesUpdate<T extends keyof PublicTables> = PublicTables[T]["Update"]
