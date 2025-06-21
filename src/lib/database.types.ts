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
      ai_context_log: {
        Row: {
          context_json: Json
          created_at: string | null
          diagnosis_id: string
          id: string
        }
        Insert: {
          context_json: Json
          created_at?: string | null
          diagnosis_id: string
          id?: string
        }
        Update: {
          context_json?: Json
          created_at?: string | null
          diagnosis_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_context_log_diagnosis_id_fkey"
            columns: ["diagnosis_id"]
            referencedRelation: "diagnoses"
            referencedColumns: ["id"]
          }
        ]
      }
      ai_logs: {
        Row: {
          diagnosis_id: string
          id: string
          timestamp: string | null
          user_id: string
          was_helpful: boolean
        }
        Insert: {
          diagnosis_id: string
          id?: string
          timestamp?: string | null
          user_id: string
          was_helpful: boolean
        }
        Update: {
          diagnosis_id?: string
          id?: string
          timestamp?: string | null
          user_id?: string
          was_helpful?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ai_logs_diagnosis_id_fkey"
            columns: ["diagnosis_id"]
            referencedRelation: "diagnoses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      badges: {
        Row: {
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          name: string
          rarity: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name: string
          rarity: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          rarity?: string
        }
        Relationships: []
      }
      boost_orders: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          part_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          part_id?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          part_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boost_orders_part_id_fkey"
            columns: ["part_id"]
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boost_orders_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      challenges: {
        Row: {
          badge_reward_id: string | null
          created_at: string | null
          description: string
          end_date: string | null
          frequency: string
          id: string
          name: string
          start_date: string | null
          target_value: number
          type: string
          xp_reward: number
        }
        Insert: {
          badge_reward_id?: string | null
          created_at?: string | null
          description: string
          end_date?: string | null
          frequency: string
          id?: string
          name: string
          start_date?: string | null
          target_value: number
          type: string
          xp_reward: number
        }
        Update: {
          badge_reward_id?: string | null
          created_at?: string | null
          description?: string
          end_date?: string | null
          frequency?: string
          id?: string
          name?: string
          start_date?: string | null
          target_value?: number
          type?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "challenges_badge_reward_id_fkey"
            columns: ["badge_reward_id"]
            referencedRelation: "badges"
            referencedColumns: ["id"]
          }
        ]
      }
      club_members: {
        Row: {
          club_id: string | null
          id: string
          joined_at: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          club_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          club_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_members_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      club_messages: {
        Row: {
          club_id: string | null
          content: string
          created_at: string | null
          id: string
          sender_avatar_url: string | null
          sender_email: string | null
          sender_id: string | null
        }
        Insert: {
          club_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          sender_avatar_url?: string | null
          sender_email?: string | null
          sender_id?: string | null
        }
        Update: {
          club_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          sender_avatar_url?: string | null
          sender_email?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_messages_club_id_fkey"
            columns: ["club_id"]
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_messages_sender_id_fkey"
            columns: ["sender_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      clubs: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          owner_id: string | null
          region: string | null
          topic: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          owner_id?: string | null
          region?: string | null
          topic?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          owner_id?: string | null
          region?: string | null
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clubs_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: {
          comment_text: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      diagnoses: {
        Row: {
          id: string
          prompt: string
          resolved: boolean | null
          response: string
          timestamp: string | null
          user_id: string
          vehicle_id: string
        }
        Insert: {
          id?: string
          prompt: string
          resolved?: boolean | null
          response: string
          timestamp?: string | null
          user_id: string
          vehicle_id: string
        }
        Update: {
          id?: string
          prompt?: string
          resolved?: boolean | null
          response?: string
          timestamp?: string | null
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnoses_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnoses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          }
        ]
      }
      feedback: {
        Row: {
          created_at: string | null
          helpful: boolean | null
          id: string
          message: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          helpful?: boolean | null
          id?: string
          message?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          helpful?: boolean | null
          id?: string
          message?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      feedback_stats: {
        Row: {
          helpful_feedback: number | null
          user_id: string | null
        }
        Insert: {
          helpful_feedback?: number | null
          user_id?: string | null
        }
        Update: {
          helpful_feedback?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_stats_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      kyc_requests: {
        Row: {
          business_name: string | null
          created_at: string | null
          full_name: string
          gov_id_url: string
          government_id_url: string | null
          id: string
          proof_of_address_url: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          business_name?: string | null
          created_at?: string | null
          full_name: string
          gov_id_url: string
          government_id_url?: string | null
          id?: string
          proof_of_address_url: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          business_name?: string | null
          created_at?: string | null
          full_name?: string
          gov_id_url?: string
          government_id_url?: string | null
          id?: string
          proof_of_address_url?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kyc_requests_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      mechanic_chats: {
        Row: {
          created_at: string | null
          gig_id: string | null
          id: string
          is_from_mechanic: boolean
          mechanic_id: string | null
          message: string
          read: boolean | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          gig_id?: string | null
          id?: string
          is_from_mechanic: boolean
          mechanic_id?: string | null
          message: string
          read?: boolean | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          gig_id?: string | null
          id?: string
          is_from_mechanic?: boolean
          mechanic_id?: string | null
          message?: string
          read?: boolean | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_chats_mechanic_id_fkey"
            columns: ["mechanic_id"]
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_chats_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      mechanic_messages: {
        Row: {
          chat_id: string | null
          created_at: string | null
          id: string
          message: string
          sender_id: string | null
          sender_type: string | null
        }
        Insert: {
          chat_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          sender_id?: string | null
          sender_type?: string | null
        }
        Update: {
          chat_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          sender_id?: string | null
          sender_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_messages_chat_id_fkey"
            columns: ["chat_id"]
            referencedRelation: "mechanic_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_messages_sender_id_fkey"
            columns: ["sender_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      mechanic_profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          expertise: string[] | null
          hourly_rate: number | null
          id: string
          is_verified: boolean | null
          languages: string[] | null
          name: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          expertise?: string[] | null
          hourly_rate?: number | null
          id: string
          is_verified?: boolean | null
          languages?: string[] | null
          name?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          expertise?: string[] | null
          hourly_rate?: number | null
          id?: string
          is_verified?: boolean | null
          languages?: string[] | null
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      mechanics: {
        Row: {
          created_at: string | null
          experience: string | null
          full_name: string | null
          id: string
          is_certified: boolean | null
          location: string | null
          phone: string | null
          specialties: string[] | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          experience?: string | null
          full_name?: string | null
          id?: string
          is_certified?: boolean | null
          location?: string | null
          phone?: string | null
          specialties?: string[] | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          experience?: string | null
          full_name?: string | null
          id?: string
          is_certified?: boolean | null
          location?: string | null
          phone?: string | null
          specialties?: string[] | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mechanics_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          read: boolean | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          read?: boolean | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          read?: boolean | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      offers: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          message: string | null
          parent_offer_id: string | null
          part_id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          message?: string | null
          parent_offer_id?: string | null
          part_id: string
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          message?: string | null
          parent_offer_id?: string | null
          part_id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_parent_offer_id_fkey"
            columns: ["parent_offer_id"]
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_part_id_fkey"
            columns: ["part_id"]
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_receiver_id_fkey"
            columns: ["receiver_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_sender_id_fkey"
            columns: ["sender_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      part_chats: {
        Row: {
          buyer_id: string | null
          created_at: string | null
          id: string
          part_id: string | null
          seller_id: string | null
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string | null
          id?: string
          part_id?: string | null
          seller_id?: string | null
        }
        Update: {
          buyer_id?: string | null
          created_at?: string | null
          id?: string
          part_id?: string | null
          seller_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "part_chats_buyer_id_fkey"
            columns: ["buyer_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_chats_part_id_fkey"
            columns: ["part_id"]
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_chats_seller_id_fkey"
            columns: ["seller_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      part_messages: {
        Row: {
          chat_id: string | null
          content: string | null
          created_at: string | null
          id: string
          sender_id: string | null
        }
        Insert: {
          chat_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          sender_id?: string | null
        }
        Update: {
          chat_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "part_messages_chat_id_fkey"
            columns: ["chat_id"]
            referencedRelation: "part_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_messages_sender_id_fkey"
            columns: ["sender_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      parts: {
        Row: {
          approved: boolean | null
          boost_expires_at: string | null
          category: string | null
          condition: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_boosted: boolean | null
          location: string | null
          make: string | null
          model: string | null
          oem_number: string | null
          part_number: string | null
          price: number
          seller_id: string | null
          sold: boolean | null
          title: string
          trim: string | null
          vehicle_fit: string | null
          year: number | null
        }
        Insert: {
          approved?: boolean | null
          boost_expires_at?: string | null
          category?: string | null
          condition?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_boosted?: boolean | null
          location?: string | null
          make?: string | null
          model?: string | null
          oem_number?: string | null
          part_number?: string | null
          price: number
          seller_id?: string | null
          sold?: boolean | null
          title: string
          trim?: string | null
          vehicle_fit?: string | null
          year?: number | null
        }
        Update: {
          approved?: boolean | null
          boost_expires_at?: string | null
          category?: string | null
          condition?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_boosted?: boolean | null
          location?: string | null
          make?: string | null
          model?: string | null
          oem_number?: string | null
          part_number?: string | null
          price?: number
          seller_id?: string | null
          sold?: boolean | null
          title?: string
          trim?: string | null
          vehicle_fit?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_seller_id_fkey"
            columns: ["seller_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          ai_repair_tips_enabled: boolean | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          dark_mode_enabled: boolean | null
          diagnostic_suggestions_enabled: boolean | null
          email_updates_enabled: boolean | null
          first_club_joined: boolean | null
          first_diagnostic_completed: boolean | null
          first_part_listed: boolean | null
          full_name: string | null
          id: string
          initial_setup_complete: boolean | null
          invited_by: string | null
          is_admin: boolean | null
          kyc_verified: boolean | null
          listing_boost_until: string | null
          location: string | null
          notification_preferences: Json | null
          push_notifications_enabled: boolean | null
          role: string | null
          username: string | null
          wants_pro: boolean | null
        }
        Insert: {
          ai_repair_tips_enabled?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          dark_mode_enabled?: boolean | null
          diagnostic_suggestions_enabled?: boolean | null
          email_updates_enabled?: boolean | null
          first_club_joined?: boolean | null
          first_diagnostic_completed?: boolean | null
          first_part_listed?: boolean | null
          full_name?: string | null
          id: string
          initial_setup_complete?: boolean | null
          invited_by?: string | null
          is_admin?: boolean | null
          kyc_verified?: boolean | null
          listing_boost_until?: string | null
          location?: string | null
          notification_preferences?: Json | null
          push_notifications_enabled?: boolean | null
          role?: string | null
          username?: string | null
          wants_pro?: boolean | null
        }
        Update: {
          ai_repair_tips_enabled?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          dark_mode_enabled?: boolean | null
          diagnostic_suggestions_enabled?: boolean | null
          email_updates_enabled?: boolean | null
          first_club_joined?: boolean | null
          first_diagnostic_completed?: boolean | null
          first_part_listed?: boolean | null
          full_name?: string | null
          id?: string
          initial_setup_complete?: boolean | null
          invited_by?: string | null
          is_admin?: boolean | null
          kyc_verified?: boolean | null
          listing_boost_until?: string | null
          location?: string | null
          notification_preferences?: Json | null
          push_notifications_enabled?: boolean | null
          role?: string | null
          username?: string | null
          wants_pro?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_auth"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_invited_by_fkey"
            columns: ["invited_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      repair_knowledge: {
        Row: {
          component: string
          created_at: string | null
          id: string
          make: string
          model: string
          safety_notes: string | null
          source_url: string | null
          steps: Json
          trim: string | null
          user_id: string | null
          year: number
        }
        Insert: {
          component: string
          created_at?: string | null
          id?: string
          make: string
          model: string
          safety_notes?: string | null
          source_url?: string | null
          steps: Json
          trim?: string | null
          user_id?: string | null
          year: number
        }
        Update: {
          component?: string
          created_at?: string | null
          id?: string
          make?: string
          model?: string
          safety_notes?: string | null
          source_url?: string | null
          steps?: Json
          trim?: string | null
          user_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "repair_knowledge_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      reported_parts: {
        Row: {
          created_at: string | null
          id: string
          part_id: string | null
          reason: string | null
          reporter_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          part_id?: string | null
          reason?: string | null
          reporter_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          part_id?: string | null
          reason?: string | null
          reporter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reported_parts_part_id_fkey"
            columns: ["part_id"]
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reported_parts_reporter_id_fkey"
            columns: ["reporter_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      saved_parts: {
        Row: {
          created_at: string | null
          id: string
          part_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          part_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          part_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_parts_part_id_fkey"
            columns: ["part_id"]
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_parts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      seller_reviews: {
        Row: {
          buyer_id: string
          comment: string | null
          created_at: string | null
          id: string
          part_id: string | null
          rating: number
          seller_id: string
        }
        Insert: {
          buyer_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          part_id?: string | null
          rating: number
          seller_id: string
        }
        Update: {
          buyer_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          part_id?: string | null
          rating?: number
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_reviews_buyer_id_fkey"
            columns: ["buyer_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_reviews_part_id_fkey"
            columns: ["part_id"]
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_reviews_seller_id_fkey"
            columns: ["seller_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      service_records: {
        Row: {
          cost: number
          created_at: string
          description: string
          id: string
          invoice_url: string | null
          mileage: number
          notes: string | null
          service_date: string
          service_provider: string | null
          service_type: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          cost: number
          created_at?: string
          description: string
          id?: string
          invoice_url?: string | null
          mileage: number
          notes?: string | null
          service_date: string
          service_provider?: string | null
          service_type: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          description?: string
          id?: string
          invoice_url?: string | null
          mileage?: number
          notes?: string | null
          service_date?: string
          service_provider?: string | null
          service_type?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_records_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          awarded_at: string | null
          badge_awarded: string | null
          id: string
          user_id: string | null
          xp_awarded: number
        }
        Insert: {
          achievement_id: string
          awarded_at?: string | null
          badge_awarded?: string | null
          id?: string
          user_id?: string | null
          xp_awarded: number
        }
        Update: {
          achievement_id?: string
          awarded_at?: string | null
          badge_awarded?: string | null
          id?: string
          user_id?: string | null
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_badge_awarded_fkey"
            columns: ["badge_awarded"]
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_badges: {
        Row: {
          awarded_at: string | null
          badge_id: string | null
          id: string
          note: string | null
          user_id: string | null
        }
        Insert: {
          awarded_at?: string | null
          badge_id?: string | null
          id?: string
          note?: string | null
          user_id?: string | null
        }
        Update: {
          awarded_at?: string | null
          badge_id?: string | null
          id?: string
          note?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed: boolean
          completed_at: string | null
          created_at: string | null
          current_progress: number
          id: string
          last_updated: string | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number
          id?: string
          last_updated?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number
          id?: string
          last_updated?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_challenges_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_feedback: {
        Row: {
          created_at: string | null
          id: string
          message: string
          sentiment: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          sentiment?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          sentiment?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_logins: {
        Row: {
          created_at: string
          disclaimer_accepted: boolean | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          disclaimer_accepted?: boolean | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          disclaimer_accepted?: boolean | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_logins_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_trusted: boolean | null
          kyc_status: string | null
          level: number | null
          location: string | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_trusted?: boolean | null
          kyc_status?: string | null
          level?: number | null
          location?: string | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_trusted?: boolean | null
          kyc_status?: string | null
          level?: number | null
          location?: string | null
          xp?: number | null
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          created_at: string | null
          id: string
          make: string | null
          mileage: number | null
          model: string | null
          nickname: string | null
          other_vehicle_description: string | null
          trim: string | null
          user_id: string | null
          vin: string | null
          year: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          make?: string | null
          mileage?: number | null
          model?: string | null
          nickname?: string | null
          other_vehicle_description?: string | null
          trim?: string | null
          user_id?: string | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          make?: string | null
          mileage?: number | null
          model?: string | null
          nickname?: string | null
          other_vehicle_description?: string | null
          trim?: string | null
          user_id?: string | null
          vin?: string | null
          year?: number | null
        }
        Relationships: []
      }
      xp_logs: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          new_level: number
          new_xp: number
          previous_level: number
          previous_xp: number
          reason: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          new_level: number
          new_xp: number
          previous_level: number
          previous_xp: number
          reason?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          new_level?: number
          new_xp?: number
          previous_level?: number
          previous_xp?: number
          reason?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "xp_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      feedback_summary: {
        Row: {
          feedback_count: number | null
          user_id: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          email: string | null
          full_name: string | null
          id: string | null
        }
        Relationships: []
      }
      seller_rating_stats: {
        Row: {
          average_rating: number | null
          five_star_count: number | null
          four_star_count: number | null
          one_star_count: number | null
          review_count: number | null
          seller_id: string | null
          three_star_count: number | null
          two_star_count: number | null
        }
        Relationships: []
      }
      user_leaderboard_stats: {
        Row: {
          avatar_url: string | null
          clubs_founded: number | null
          clubs_joined: number | null
          full_name: string | null
          helpful_feedback: number | null
          id: string | null
          joined_at: string | null
          location: string | null
          parts_listed: number | null
          parts_sold: number | null
          rare_badges: number | null
          resolved_diagnoses: number | null
          service_records: number | null
          total_badges: number | null
          total_diagnoses: number | null
          total_maintenance_cost: number | null
          total_sales_value: number | null
          total_score: number | null
          username: string | null
        }
        Relationships: []
      }
      vehicle_context: {
        Row: {
          make: string | null
          model: string | null
          other_vehicle_description: string | null
          owner_location: string | null
          owner_name: string | null
          trim: string | null
          vehicle_id: string | null
          vin: string | null
          year: number | null
        }
        Relationships: []
      }
      view_user_feedback_stats: {
        Row: {
          helpful_feedback: number | null
          unhelpful_feedback: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      award_level_badge: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      award_xp: {
        Args: {
          user_id: string
          amount: number
          reason: string
        }
        Returns: {
          new_xp: number
          new_level: number
          level_up_occurred: boolean
        }
      }
      check_boost_expiry: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_level_up: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_trusted_seller_status: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_user_diagnostician_rank: {
        Args: {
          user_id: string
        }
        Returns: number
      }
      get_user_rank_by_score: {
        Args: {
          user_id: string
        }
        Returns: number
      }
      get_user_seller_rank: {
        Args: {
          user_id: string
        }
        Returns: number
      }
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      handle_new_user_referral: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      remove_expired_boosts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      uid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      update_challenge_progress: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_updated_at_column: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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