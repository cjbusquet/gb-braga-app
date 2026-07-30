/**
 * Geolocation calculations (GPS check-in fence).
 */

const EARTH_RADIUS_M = 6371000;

/**
 * Great-circle distance between two lat/lon points, in metres (haversine formula).
 * Parameter order is (lat1, lon1, lat2, lon2) for both points — do not swap
 * lat/lon when calling this, the formula is not symmetric under that swap.
 */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
