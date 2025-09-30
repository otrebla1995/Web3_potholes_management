export interface OverpassResult {
  surface?: string
  roadType?: string // highway classification (residential, primary, secondary, etc.)
  lanes?: string
  maxSpeed?: string
  lighting?: string // yes/no/limited
  buildings: Array<{
    name: string
    type: string
    distance?: number
  }>
  publicTransport: Array<{
    name: string
    type: string // bus_stop, tram_stop, etc.
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
  // 1. Surface, highway type, lanes, speed limit, and lighting from nearest road
  // 2. Important buildings within radius (amenities, buildings with names)
  // 3. Public transport stops within radius
  const query = `
    [out:json][timeout:25];
    (
      // Get nearest way with highway tag (will include surface, lanes, maxspeed, lit)
      way(around:50,${lat},${lng})["highway"];

      // Get important buildings/amenities
      node(around:${radius},${lat},${lng})["amenity"]["name"];
      way(around:${radius},${lat},${lng})["amenity"]["name"];
      node(around:${radius},${lat},${lng})["building"]["name"];
      way(around:${radius},${lat},${lng})["building"]["name"];
      node(around:${radius},${lat},${lng})["tourism"]["name"];
      way(around:${radius},${lat},${lng})["tourism"]["name"];

      // Get public transport stops
      node(around:${radius},${lat},${lng})["highway"="bus_stop"];
      node(around:${radius},${lat},${lng})["public_transport"="platform"];
      node(around:${radius},${lat},${lng})["railway"="tram_stop"];
      node(around:${radius},${lat},${lng})["railway"="station"];
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
      buildings: [],
      publicTransport: []
    }
  }
}

/**
 * Parse Overpass API response to extract road data, buildings, and public transport
 */
function parseOverpassData(data: any, lat: number, lng: number): OverpassResult {
  const result: OverpassResult = {
    buildings: [],
    publicTransport: []
  }

  if (!data.elements || !Array.isArray(data.elements)) {
    return result
  }

  const seenBuildings = new Set<string>()
  const seenTransport = new Set<string>()

  for (const element of data.elements) {
    // Extract road information from ways with highway tag
    if (element.type === 'way' && element.tags?.highway) {
      // Extract surface material (if not already set)
      if (element.tags.surface && !result.surface) {
        result.surface = element.tags.surface
      }

      // Extract road type/classification (if not already set)
      if (element.tags.highway && !result.roadType) {
        result.roadType = element.tags.highway
      }

      // Extract number of lanes (if not already set)
      if (element.tags.lanes && !result.lanes) {
        result.lanes = element.tags.lanes
      }

      // Extract speed limit (if not already set)
      if (element.tags.maxspeed && !result.maxSpeed) {
        result.maxSpeed = element.tags.maxspeed
      }

      // Extract lighting information (if not already set)
      if (element.tags.lit && !result.lighting) {
        result.lighting = element.tags.lit
      }
    }

    // Extract public transport stops
    if (element.type === 'node') {
      const isTransport = element.tags?.highway === 'bus_stop' ||
                         element.tags?.public_transport === 'platform' ||
                         element.tags?.railway === 'tram_stop' ||
                         element.tags?.railway === 'station'

      if (isTransport) {
        const name = element.tags.name || 'Unnamed stop'
        const key = `${name}-${element.lat}-${element.lon}`

        if (!seenTransport.has(key)) {
          seenTransport.add(key)

          const type = element.tags.highway === 'bus_stop' ? 'bus_stop' :
                      element.tags.railway === 'tram_stop' ? 'tram_stop' :
                      element.tags.railway === 'station' ? 'station' :
                      'platform'

          const distance = calculateDistance(lat, lng, element.lat, element.lon)

          result.publicTransport.push({
            name,
            type,
            distance
          })
        }
      }
    }

    // Extract important buildings/amenities with names
    if (element.tags?.name) {
      const isBuilding = element.tags.amenity ||
                        element.tags.tourism ||
                        element.tags.building

      // Skip if it's already counted as public transport
      const isTransport = element.tags?.highway === 'bus_stop' ||
                         element.tags?.public_transport === 'platform' ||
                         element.tags?.railway === 'tram_stop' ||
                         element.tags?.railway === 'station'

      if (isBuilding && !isTransport) {
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
  }

  // Sort buildings by distance if available
  result.buildings.sort((a, b) => {
    if (a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance
    }
    return 0
  })

  // Sort public transport by distance
  result.publicTransport.sort((a, b) => {
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