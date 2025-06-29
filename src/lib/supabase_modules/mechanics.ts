import { supabase } from "../supabase";
import { Profile } from "../supabase"; // Import Profile type from main supabase.ts

export interface Mechanic {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  location: string;
  experience: string;
  specialties: string[];
  is_certified: boolean;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  hourly_rate?: number;
  languages?: string[];
  bio?: string;
  // Enhanced fields for booking system
  availability_schedule?: AvailabilitySchedule;
  service_area_radius?: number; // in miles
  is_mobile?: boolean;
  is_online?: boolean;
  average_rating?: number;
  total_reviews?: number;
  latitude?: number;
  longitude?: number;
  stripe_account_id?: string;
  is_available_for_calls?: boolean;
  call_rate_per_minute?: number;
}

// New interfaces for enhanced functionality
export interface AvailabilitySchedule {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

export interface TimeSlot {
  start: string; // HH:MM format
  end: string; // HH:MM format
  available: boolean;
}

export interface Appointment {
  id: string;
  user_id: string;
  mechanic_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  service_type: "diagnostic" | "repair" | "consultation" | "inspection";
  estimated_duration: number; // in minutes
  hourly_rate: number;
  total_cost?: number;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  payment_status: "pending" | "paid" | "refunded";
  payment_intent_id?: string;
  location_type: "mobile" | "shop" | "remote";
  service_location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface VideoCall {
  id: string;
  appointment_id?: string;
  mechanic_id: string;
  user_id: string;
  call_type: "voice" | "video" | "screen_share";
  status: "initiating" | "ringing" | "active" | "ended" | "failed";
  started_at?: string;
  ended_at?: string;
  duration?: number; // in seconds
  call_rate_per_minute: number;
  total_cost?: number;
  peer_id?: string;
  offer?: string;
  answer?: string;
  ice_candidates?: string[];
  // Enhanced fields for booking system
  availability_schedule?: AvailabilitySchedule;
  service_area_radius?: number; // in miles
  is_mobile?: boolean;
  is_online?: boolean;
  average_rating?: number;
  total_reviews?: number;
  latitude?: number;
  longitude?: number;
  stripe_account_id?: string;
  is_available_for_calls?: boolean;
  call_rate_per_minute?: number;
}

// New interfaces for enhanced functionality
export interface AvailabilitySchedule {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

export interface TimeSlot {
  start: string; // HH:MM format
  end: string; // HH:MM format
  available: boolean;
}

export interface Appointment {
  id: string;
  user_id: string;
  mechanic_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  service_type: "diagnostic" | "repair" | "consultation" | "inspection";
  estimated_duration: number; // in minutes
  hourly_rate: number;
  total_cost?: number;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  payment_status: "pending" | "paid" | "refunded";
  payment_intent_id?: string;
  location_type: "mobile" | "shop" | "remote";
  service_location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface VideoCall {
  id: string;
  appointment_id?: string;
  mechanic_id: string;
  user_id: string;
  call_type: "voice" | "video" | "screen_share";
  status: "initiating" | "ringing" | "active" | "ended" | "failed";
  started_at?: string;
  ended_at?: string;
  duration?: number; // in seconds
  call_rate_per_minute: number;
  total_cost?: number;
  peer_id?: string;
  offer?: string;
  answer?: string;
  ice_candidates?: string[];
}

export interface MechanicChat {
  id: string;
  mechanic_id: string;
  user_id: string;
  message: string;
  is_from_mechanic: boolean;
  timestamp: string;
  read: boolean;
  gig_id: string | null;
}

export interface MechanicMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_type: "user" | "mechanic";
  message: string;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url: string;
  };
}

export async function getApprovedMechanics(
  specialties: string[] = []
): Promise<Mechanic[]> {
  let query = supabase.from("mechanics").select("*").eq("status", "approved");

  if (specialties.length > 0) {
    query = query.contains("specialties", specialties);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getMechanicProfile(): Promise<Mechanic | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("mechanics")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }
  return data;
}

export async function upsertMechanicProfile(
  profileData: Partial<Mechanic>
): Promise<Mechanic> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("mechanics")
    .upsert({ ...profileData, user_id: user.id }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getMechanicChatDetails(
  chatId: string
): Promise<{ mechanic: Mechanic; user: Profile }> {
  const { data, error } = await supabase
    .from("mechanic_chats")
    .select(
      `
      mechanic:mechanics(*),
      user:profiles(*)
    `
    )
    .eq("id", chatId)
    .single();

  if (error) throw error;
  return data;
}

export async function getMechanicMessages(
  chatId: string
): Promise<MechanicMessage[]> {
  const { data, error } = await supabase
    .from("mechanic_messages")
    .select(
      `
      *,
      sender:profiles(full_name, avatar_url)
    `
    )
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  // Enhanced functions for new features

  export async function createAppointment(
    appointmentData: Partial<Appointment>
  ): Promise<Appointment> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("appointments")
      .insert({ ...appointmentData, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  export async function getUserAppointments(): Promise<Appointment[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
      *,
      mechanic:mechanics(*)
    `
      )
      .eq("user_id", user.id)
      .order("scheduled_date", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  export async function getMechanicAppointments(): Promise<Appointment[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
      *,
      user:profiles(*)
    `
      )
      .eq("mechanic_id", user.id)
      .order("scheduled_date", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  export async function updateAppointmentStatus(
    appointmentId: string,
    status: Appointment["status"]
  ): Promise<void> {
    const { error } = await supabase
      .from("appointments")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", appointmentId);

    if (error) throw error;
  }

  export async function getMechanicAvailability(
    mechanicId: string,
    date: string
  ): Promise<TimeSlot[]> {
    const { data, error } = await supabase
      .from("mechanics")
      .select("availability_schedule")
      .eq("id", mechanicId)
      .single();

    if (error) throw error;

    // Get day of week from date
    const dayOfWeek = new Date(date).toLocaleLowerCase("en-US", {
      weekday: "long",
    });

    return data?.availability_schedule?.[dayOfWeek] || [];
  }

  export async function updateMechanicLocation(
    mechanicId: string,
    latitude: number,
    longitude: number
  ): Promise<void> {
    const { error } = await supabase
      .from("mechanics")
      .update({
        latitude,
        longitude,
        is_online: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mechanicId);

    if (error) throw error;
  }

  export async function getNearbyMechanics(
    latitude: number,
    longitude: number,
    radiusMiles: number = 25
  ): Promise<Mechanic[]> {
    // Using PostGIS extension if available, otherwise simple distance calculation
    const { data, error } = await supabase.rpc("get_nearby_mechanics", {
      lat: latitude,
      lng: longitude,
      radius_miles: radiusMiles,
    });

    if (error) {
      // Fallback to simple query if RPC doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("mechanics")
        .select("*")
        .eq("status", "approved")
        .eq("is_mobile", true)
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      if (fallbackError) throw fallbackError;
      return fallbackData || [];
    }

    return data || [];
  }

  export async function initiateVideoCall(
    mechanicId: string,
    callType: VideoCall["call_type"]
  ): Promise<VideoCall> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get mechanic's call rate
    const mechanic = await getMechanicById(mechanicId);
    if (!mechanic?.call_rate_per_minute) {
      throw new Error("Mechanic call rate not configured");
    }

    const { data, error } = await supabase
      .from("video_calls")
      .insert({
        mechanic_id: mechanicId,
        user_id: user.id,
        call_type: callType,
        status: "initiating",
        call_rate_per_minute: mechanic.call_rate_per_minute,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  export async function updateVideoCallStatus(
    callId: string,
    status: VideoCall["status"],
    additionalData?: Partial<VideoCall>
  ): Promise<void> {
    const updateData: any = { status };

    if (status === "active" && !additionalData?.started_at) {
      updateData.started_at = new Date().toISOString();
    }

    if (status === "ended" && !additionalData?.ended_at) {
      updateData.ended_at = new Date().toISOString();
    }

    if (additionalData) {
      Object.assign(updateData, additionalData);
    }

    const { error } = await supabase
      .from("video_calls")
      .update(updateData)
      .eq("id", callId);

    if (error) throw error;
  }
  return (data || []).map((msg) => ({
    ...msg,
    sender: msg.sender || undefined,
  }));
}

export async function getMechanicById(
  mechanicId: string
): Promise<Mechanic | null> {
  const { data, error } = await supabase
    .from("mechanics")
    .select("*")
    .eq("id", mechanicId)
    .single();

  if (error) throw error;
  return data;
}

export async function getOrCreateMechanicChat(
  userId: string,
  mechanicId: string
): Promise<string> {
  // Check if a chat already exists between this user and mechanic
  const { data: existingChat, error: chatError } = await supabase
    .from("mechanic_chats")
    .select("id")
    .eq("user_id", userId)
    .eq("mechanic_id", mechanicId)
    .single();

  if (existingChat) {
    return existingChat.id;
  }

  // If not, create a new chat
  const { data: newChat, error: createError } = await supabase
    .from("mechanic_chats")
    .insert({
      user_id: userId,
      mechanic_id: mechanicId,
      message: "Hello, I need some assistance with my vehicle.", // Initial message
      is_from_mechanic: false, // Sent by user
    })
    .select("id")
    .single();

  if (createError) throw createError;
  return newChat.id;
}

export async function getPendingMechanicRequests(): Promise<Mechanic[]> {
  const { data, error } = await supabase
    .from("mechanics")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function updateMechanicStatus(
  mechanicId: string,
  status: "approved" | "rejected"
): Promise<void> {
  const { error } = await supabase
    .from("mechanics")
    .update({ status })
    .eq("id", mechanicId);

  if (error) throw error;
}

// Enhanced functions for new features

export async function createAppointment(
  appointmentData: Partial<Appointment>
): Promise<Appointment> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("appointments")
    .insert({ ...appointmentData, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserAppointments(): Promise<Appointment[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      mechanic:mechanics(*)
    `
    )
    .eq("user_id", user.id)
    .order("scheduled_date", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getMechanicAppointments(): Promise<Appointment[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      user:profiles(*)
    `
    )
    .eq("mechanic_id", user.id)
    .order("scheduled_date", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: Appointment["status"]
): Promise<void> {
  const { error } = await supabase
    .from("appointments")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", appointmentId);

  if (error) throw error;
}

export async function getMechanicAvailability(
  mechanicId: string,
  date: string
): Promise<TimeSlot[]> {
  const { data, error } = await supabase
    .from("mechanics")
    .select("availability_schedule")
    .eq("id", mechanicId)
    .single();

  if (error) throw error;

  // Get day of week from date
  const dayOfWeek = new Date(date).toLocaleLowerCase("en-US", {
    weekday: "long",
  });

  return data?.availability_schedule?.[dayOfWeek] || [];
}

export async function updateMechanicLocation(
  mechanicId: string,
  latitude: number,
  longitude: number
): Promise<void> {
  const { error } = await supabase
    .from("mechanics")
    .update({
      latitude,
      longitude,
      is_online: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mechanicId);

  if (error) throw error;
}

export async function getNearbyMechanics(
  latitude: number,
  longitude: number,
  radiusMiles: number = 25
): Promise<Mechanic[]> {
  // Using PostGIS extension if available, otherwise simple distance calculation
  const { data, error } = await supabase.rpc("get_nearby_mechanics", {
    lat: latitude,
    lng: longitude,
    radius_miles: radiusMiles,
  });

  if (error) {
    // Fallback to simple query if RPC doesn't exist
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("mechanics")
      .select("*")
      .eq("status", "approved")
      .eq("is_mobile", true)
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (fallbackError) throw fallbackError;
    return fallbackData || [];
  }

  return data || [];
}

export async function initiateVideoCall(
  mechanicId: string,
  callType: VideoCall["call_type"]
): Promise<VideoCall> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get mechanic's call rate
  const mechanic = await getMechanicById(mechanicId);
  if (!mechanic?.call_rate_per_minute) {
    throw new Error("Mechanic call rate not configured");
  }

  const { data, error } = await supabase
    .from("video_calls")
    .insert({
      mechanic_id: mechanicId,
      user_id: user.id,
      call_type: callType,
      status: "initiating",
      call_rate_per_minute: mechanic.call_rate_per_minute,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateVideoCallStatus(
  callId: string,
  status: VideoCall["status"],
  additionalData?: Partial<VideoCall>
): Promise<void> {
  const updateData: any = { status };

  if (status === "active" && !additionalData?.started_at) {
    updateData.started_at = new Date().toISOString();
  }

  if (status === "ended" && !additionalData?.ended_at) {
    updateData.ended_at = new Date().toISOString();
  }

  if (additionalData) {
    Object.assign(updateData, additionalData);
  }

  const { error } = await supabase
    .from("video_calls")
    .update(updateData)
    .eq("id", callId);

  if (error) throw error;
}
