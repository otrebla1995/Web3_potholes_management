export interface OverpassResult {
  surface?: string
  buildings: Array<{
    name: string
    type: string
    distance?: number
  }>
}

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter'

/**
 * Query Overpass API to get surface material and nearby important buildings
 * @param lat Latitude
 * @param lng Longitude
 * @param radius Search radius in meters (default: 100m)
 * @returns Surface material and list of nearby important buildings
 */
export async function queryLocationData(
  lat: number,
  lng: number,
  radius: number = 100
): Promise<OverpassResult> {
  // Overpass QL query to get:
  // 1. Surface of the nearest way (road)
  // 2. Important buildings within radius (amenities, buildings with names)
  const query = `
    [out:json][timeout:25];
    (
      // Get nearest way with surface tag
      way(around:50,${lat},${lng})["highway"]["surface"];

      // Get important buildings/amenities
      node(around:${radius},${lat},${lng})["amenity"]["name"];
      way(around:${radius},${lat},${lng})["amenity"]["name"];
      node(around:${radius},${lat},${lng})["building"]["name"];
      way(around:${radius},${lat},${lng})["building"]["name"];
      node(around:${radius},${lat},${lng})["tourism"]["name"];
      way(around:${radius},${lat},${lng})["tourism"]["name"];
    );
    out body;
    >;
    out skel qt;
  `

  try {
    const response = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    })

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.statusText}`)
    }

    const data = await response.json()

    return parseOverpassData(data, lat, lng)
  } catch (error) {
    console.error('Error querying Overpass API:', error)
    return {
      buildings: []
    }
  }
}

/**
 * Parse Overpass API response to extract surface and buildings
 */
function parseOverpassData(data: any, lat: number, lng: number): OverpassResult {
  const result: OverpassResult = {
    buildings: []
  }

  if (!data.elements || !Array.isArray(data.elements)) {
    return result
  }

  const seenBuildings = new Set<string>()

  for (const element of data.elements) {
    // Extract surface from ways
    if (element.tags?.surface && !result.surface) {
      result.surface = element.tags.surface
    }

    // Extract important buildings/amenities with names
    if (element.tags?.name) {
      const name = element.tags.name

      // Avoid duplicates
      if (seenBuildings.has(name)) continue
      seenBuildings.add(name)

      // Determine type
      const type = element.tags.amenity ||
                   element.tags.tourism ||
                   element.tags.building ||
                   'building'

      // Calculate approximate distance if coordinates available
      let distance: number | undefined
      if (element.lat && element.lon) {
        distance = calculateDistance(lat, lng, element.lat, element.lon)
      }

      result.buildings.push({
        name,
        type,
        distance
      })
    }
  }

  // Sort buildings by distance if available
  result.buildings.sort((a, b) => {
    if (a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance
    }
    return 0
  })

  return result
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in meters
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return Math.round(R * c)
}