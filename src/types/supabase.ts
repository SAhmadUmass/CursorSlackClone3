export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      channels: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_by?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          channel_id: string | null
          dm_channel_id: string | null
          user_id: string
          content: string
          created_at: string
          client_generated_id: string
        }
        Insert: {
          id?: string
          channel_id?: string | null
          dm_channel_id?: string | null
          user_id: string
          content: string
          created_at?: string
          client_generated_id: string
        }
        Update: {
          id?: string
          channel_id?: string | null
          dm_channel_id?: string | null
          user_id?: string
          content?: string
          created_at?: string
          client_generated_id?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
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
  }
} 