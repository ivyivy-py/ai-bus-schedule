/**
 * Type definitions for Singapore Bus Arrival & Weather application.
 */

export interface BusStop {
  code: string;           // 5-digit bus stop code, e.g. "83139"
  roadName: string;       // e.g. "PTB2 Basement" or "Orchard Rd"
  description: string;    // e.g. "Aft Changi Airport PTB2" or "Opp Orchard Stn"
  latitude: number;
  longitude: number;
  distance?: number;      // Distance in meters from user's location
}

export type BusCrowdLevel = 'SEA' | 'SDA' | 'LSD'; // Seats Available, Standing Available, Limited Standing
export type BusVehicleType = 'SD' | 'DD' | 'BD';    // Single Deck, Double Deck, Bendy

export interface NextBusInfo {
  estimatedArrival: string; // ISO 8601 timestamp, or empty string if not available
  latitude?: string;
  longitude?: string;
  visitNumber?: string;
  load?: BusCrowdLevel;
  feature?: string;         // "WAB" for Wheelchair Accessible Bus
  type?: BusVehicleType;
}

export interface BusServiceArrival {
  serviceNo: string;
  operator: string;         // SBST, SMRT, TTS, GAS
  nextBus?: NextBusInfo;
  nextBus2?: NextBusInfo;
  nextBus3?: NextBusInfo;
  status?: string;          // "Operating" | "Not in Service"
}

export interface BusArrivalResponse {
  busStopCode: string;
  busStopName?: string;
  roadName?: string;
  services: BusServiceArrival[];
  isSimulated?: boolean;
  message?: string;
  timestamp: string;
}

export interface WeatherAreaMetadata {
  name: string;
  labelLocation: {
    latitude: number;
    longitude: number;
  };
}

export interface WeatherForecastItem {
  area: string;
  forecast: string;
  distance?: number;
}

export type WeatherCategory = 'sunny' | 'cloudy' | 'rain' | 'thunder' | 'night';

export interface WeatherForecastResponse {
  validPeriod: {
    start: string;
    end: string;
    text: string;
  };
  updateTimestamp: string;
  nearestArea: string;
  forecast: string;
  category: WeatherCategory;
  allForecasts?: WeatherForecastItem[];
}
