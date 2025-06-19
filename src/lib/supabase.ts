import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Profile {
  id: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  created_at?: string;
  kyc_verified?: boolean;
  location?: string;
  push_notifications_enabled?: boolean;
  email_updates_enabled?: boolean;
  ai_repair_tips_enabled?: boolean;
  dark_mode_enabled?: boolean;
  is_admin?: boolean;
  initial_setup_complete?: boolean;
  diagnostic_suggestions_enabled?: boolean;
  role?: string;
  invited_by?: string;
  listing_boost_until?: string;
  first_diagnostic_completed?: boolean;
  first_club_joined?: boolean;
  first_part_listed?: boolean;
  wants_pro?: boolean;
  notification_preferences?: NotificationPreferences;
}

export interface Vehicle {
  id: string;
  user_id?: string;
  make?: string;
  model?: string;
  year?: number;
  trim?: string;
  created_at?: string;
  vin?: string;
  other_vehicle_description?: string;
  nickname?: string;
  mileage?: number;
}

export interface ServiceRecord {
  id: string;
  user_id: string;
  vehicle_id: string;
  service_date: string;
  service_type: string;
  description: string;
  mileage: number;
  cost: number;
  service_provider?: string;
  notes?: string;
  invoice_url?: string;
  created_at: string;
}

export interface Diagnosis {
  id: string;
  user_id: string;
  vehicle_id: string;
  prompt: string;
  response: string;
  timestamp: string;
  resolved?: boolean;
  vehicle?: Vehicle;
}

export interface Part {
  id: string;
  seller_id?: string;
  title: string;
  description?: string;
  condition?: string;
  price: number;
  image_url?: string;
  created_at?: string;
  sold?: boolean;
  location?: string;
  category?: string;
  vehicle_fit?: string;
  make?: string;
  model?: string;
  year?: number;
  trim?: string;
  part_number?: string;
  oem_number?: string;
  approved?: boolean;
  is_boosted?: boolean;
  boost_expires_at?: string;
  seller_is_trusted?: boolean; // Flattened from seller:profiles(is_trusted)
  seller_email?: string; // Flattened from seller:profiles(email)
}

export interface Badge {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  rarity: string;
  created_at?: string;
}

export interface UserEarnedBadge {
  id: string;
  user_id: string;
  badge_id: string;
  name: string;
  description?: string;
  icon_url?: string;
  rarity: string;
  awarded_at: string;
  note?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  read?: boolean;
  created_at?: string;
  link?: string;
}

export interface Club {
  id: string;
  name: string;
  description?: string;
  region?: string;
  image_url?: string;
  created_at?: string;
  topic?: string;
  member_count?: number; // Added for convenience
}

export interface ClubMessage {
  id: string;
  club_id: string;
  sender_id: string;
  sender_email?: string;
  sender_avatar_url?: string;
  content: string;
  created_at: string;
}

export interface KYCUser {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  location: string | null;
  kyc_status: string;
}

export interface DashboardStats {
  totalUsers: number;
  pendingKyc: number;
  pendingMechanics: number;
  reportedParts: number;
  totalDiagnoses: number;
  totalPartsListed: number;
  kycApprovedThisMonth: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PartFilters {
  search?: string;
  make?: string;
  condition?: string;
  category?: string;
  partNumber?: string;
  oemNumber?: string;
  approvalStatus?: 'approved' | 'unapproved';
  isTrustedSeller?: boolean;
}

export interface ReportedPart {
  id: string;
  part_id: string;
  reporter_id: string;
  reason: string;
  message: string | null;
  created_at: string;
  part: Part;
  reporter: Profile;
}

export interface PartChatPreview {
  id: string;
  created_at: string;
  part: Part;
  other_user: Profile;
  last_message: {
    content: string;
    created_at: string;
  } | null;
}

export interface PartMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_avatar_url?: string;
}

export interface AiFeedbackLog {
  id: string;
  diagnosis_id: string;
  user_id: string;
  was_helpful: boolean;
  timestamp: string;
  diagnosis: Diagnosis;
  user: Profile;
}

export interface SellerReview {
  id: string;
  seller_id: string;
  buyer_id: string;
  part_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  buyer?: Profile; // Joined profile data
}

export interface SellerRatingStats {
  seller_id: string;
  review_count: number;
  average_rating: number;
  five_star_count: number;
  four_star_count: number;
  three_star_count: number;
  two_star_count: number;
  one_star_count: number;
}

export interface LeaderboardEntry {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  location: string;
  rank: number;
  total_score: number;
  total_diagnoses: number;
  resolved_diagnoses: number;
  helpful_feedback: number;
  parts_listed: number;
  parts_sold: number;
  total_sales_value: number;
  clubs_founded: number;
  clubs_joined: number;
  total_badges: number;
  rare_badges: number;
  service_records: number;
  total_maintenance_cost: number;
}

export interface LeaderboardData {
  overall: LeaderboardEntry[];
  diagnosticians: LeaderboardEntry[];
  sellers: LeaderboardEntry[];
  contributors: LeaderboardEntry[];
  userRank?: {
    overall: number | null;
    diagnosticians: number | null;
    sellers: number | null;
    contributors: number | null;
  };
}

export interface WeeklyStats {
  diagnoses: number;
  partsListed: number;
  clubsJoined: number;
  messagesExchanged: number;
  serviceRecordsAdded: number;
}

export interface NotificationPreferences {
  chat_messages: boolean;
  ai_repair_tips: boolean;
  club_activity: boolean;
  service_reminders: boolean;
  marketplace_activity: boolean;
}

// Re-export all functions from modularized files
export * from './supabase_modules/auth';
export * from './supabase_modules/profile';
export * from './supabase_modules/vehicles';
export * from './supabase_modules/serviceRecords';
export * from './supabase_modules/diagnostics';
export * from './supabase_modules/parts';
export * from './supabase_modules/notifications';
export * from './supabase_modules/kyc';
export * from './supabase_modules/badges';
export * from './supabase_modules/achievements';
export * from './supabase_modules/mechanics';
export * from './supabase_modules/clubs';
export * from './supabase_modules/reviews';
export * from './supabase_modules/utils'; // For dashboard stats, etc.