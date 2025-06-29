import { supabase } from "./supabase";

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

export interface ServiceArea {
  id: string;
  mechanic_id: string;
  center_lat: number;
  center_lng: number;
  radius_miles: number;
  pricing_multiplier: number; // 1.0 = base rate, 1.2 = 20% increase
  is_active: boolean;
  created_at: string;
}

export interface MechanicLocation {
  id: string;
  mechanic_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  is_online: boolean;
  is_available: boolean;
  updated_at: string;
  estimated_arrival_time?: number; // in minutes
}

export interface DistancePricing {
  base_rate: number;
  distance_miles: number;
  travel_time_minutes: number;
  fuel_surcharge: number;
  total_rate: number;
  pricing_tier: "local" | "extended" | "long_distance";
}

export class LocationService {
  private static instance: LocationService;
  private watchId: number | null = null;
  private lastKnownLocation: LocationData | null = null;
  private locationUpdateCallbacks: ((location: LocationData) => void)[] = [];

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  // Get current user location
  async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
          };
          this.lastKnownLocation = location;
          resolve(location);
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }

  // Start watching user location (for mechanics)
  startLocationTracking(mechanicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      this.watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
          };

          this.lastKnownLocation = location;

          // Update location in database
          await this.updateMechanicLocation(mechanicId, location);

          // Notify callbacks
          this.locationUpdateCallbacks.forEach((callback) =>
            callback(location)
          );
        },
        (error) => {
          console.error("Location tracking error:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 60000, // 1 minute
        }
      );

      resolve();
    });
  }

  // Stop location tracking
  stopLocationTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Update mechanic location in database
  async updateMechanicLocation(
    mechanicId: string,
    location: LocationData
  ): Promise<void> {
    const { error } = await supabase.from("mechanic_locations").upsert({
      mechanic_id: mechanicId,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy || 0,
      is_online: true,
      is_available: true,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to update mechanic location:", error);
      throw error;
    }
  }

  // Get nearby mechanics with real-time locations
  async getNearbyMechanics(
    userLat: number,
    userLng: number,
    radiusMiles: number = 25
  ): Promise<
    Array<{
      mechanic_id: string;
      full_name: string;
      phone: string;
      specialties: string[];
      hourly_rate: number;
      latitude: number;
      longitude: number;
      distance_miles: number;
      estimated_arrival_time: number;
      is_online: boolean;
      is_available: boolean;
      last_seen: string;
    }>
  > {
    const { data, error } = await supabase.rpc(
      "get_nearby_mechanics_with_location",
      {
        user_lat: userLat,
        user_lng: userLng,
        radius_miles: radiusMiles,
      }
    );

    if (error) {
      console.error("Failed to get nearby mechanics:", error);
      throw error;
    }

    return data || [];
  }

  // Calculate distance between two points using Haversine formula
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Calculate estimated travel time (rough estimate based on distance)
  calculateTravelTime(distanceMiles: number): number {
    // Assume average speed of 30 mph in urban areas
    const averageSpeedMph = 30;
    const travelTimeHours = distanceMiles / averageSpeedMph;
    return Math.ceil(travelTimeHours * 60); // Convert to minutes
  }

  // Calculate distance-based pricing
  calculateDistancePricing(
    baseRate: number,
    distanceMiles: number,
    travelTimeMinutes?: number
  ): DistancePricing {
    const calculatedTravelTime =
      travelTimeMinutes || this.calculateTravelTime(distanceMiles);

    let pricingTier: DistancePricing["pricing_tier"];
    let multiplier: number;
    let fuelSurcharge: number;

    if (distanceMiles <= 10) {
      pricingTier = "local";
      multiplier = 1.0;
      fuelSurcharge = 0;
    } else if (distanceMiles <= 25) {
      pricingTier = "extended";
      multiplier = 1.15; // 15% increase
      fuelSurcharge = distanceMiles * 0.5; // $0.50 per mile
    } else {
      pricingTier = "long_distance";
      multiplier = 1.3; // 30% increase
      fuelSurcharge = distanceMiles * 0.75; // $0.75 per mile
    }

    const adjustedRate = baseRate * multiplier;
    const totalRate = adjustedRate + fuelSurcharge;

    return {
      base_rate: baseRate,
      distance_miles: distanceMiles,
      travel_time_minutes: calculatedTravelTime,
      fuel_surcharge: fuelSurcharge,
      total_rate: totalRate,
      pricing_tier: pricingTier,
    };
  }

  // Get service areas for a mechanic
  async getMechanicServiceAreas(mechanicId: string): Promise<ServiceArea[]> {
    const { data, error } = await supabase
      .from("service_areas")
      .select("*")
      .eq("mechanic_id", mechanicId)
      .eq("is_active", true)
      .order("radius_miles", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Create or update service area
  async upsertServiceArea(
    serviceArea: Partial<ServiceArea>
  ): Promise<ServiceArea> {
    const { data, error } = await supabase
      .from("service_areas")
      .upsert(serviceArea)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Check if location is within service area
  isLocationInServiceArea(
    userLat: number,
    userLng: number,
    serviceArea: ServiceArea
  ): boolean {
    const distance = this.calculateDistance(
      userLat,
      userLng,
      serviceArea.center_lat,
      serviceArea.center_lng
    );
    return distance <= serviceArea.radius_miles;
  }

  // Reverse geocoding to get address from coordinates
  async reverseGeocode(
    lat: number,
    lng: number
  ): Promise<Partial<LocationData>> {
    try {
      // Using a free geocoding service (you might want to use Google Maps API in production)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );

      if (!response.ok) {
        throw new Error("Geocoding failed");
      }

      const data = await response.json();

      return {
        address: data.locality || data.city,
        city: data.city,
        state: data.principalSubdivision,
        zip_code: data.postcode,
      };
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return {};
    }
  }

  // Subscribe to location updates
  onLocationUpdate(callback: (location: LocationData) => void): () => void {
    this.locationUpdateCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.locationUpdateCallbacks.indexOf(callback);
      if (index > -1) {
        this.locationUpdateCallbacks.splice(index, 1);
      }
    };
  }

  // Get last known location
  getLastKnownLocation(): LocationData | null {
    return this.lastKnownLocation;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Set mechanic availability status
  async setMechanicAvailability(
    mechanicId: string,
    isAvailable: boolean
  ): Promise<void> {
    const { error } = await supabase
      .from("mechanic_locations")
      .update({
        is_available: isAvailable,
        updated_at: new Date().toISOString(),
      })
      .eq("mechanic_id", mechanicId);

    if (error) throw error;
  }

  // Get real-time location updates for a specific mechanic
  subscribeMechanicLocation(
    mechanicId: string,
    callback: (location: MechanicLocation) => void
  ): () => void {
    const channel = supabase
      .channel(`mechanic_location:${mechanicId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "mechanic_locations",
          filter: `mechanic_id=eq.${mechanicId}`,
        },
        (payload) => {
          callback(payload.new as MechanicLocation);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const locationService = LocationService.getInstance();
