import { ZmanimData } from '../types/zmanim';

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

export async function geocodeLocation(query: string): Promise<{ lat: number; lng: number; display_name: string }> {
  // Add country if not specified to improve geocoding accuracy
  if (!query.toLowerCase().includes('canada') && !query.toLowerCase().includes('usa') && !query.toLowerCase().includes('united states')) {
    query = `${query}, USA`;
  }
  // Try direct coordinate parsing first
  if (query.includes(',')) {
    const [lat, lng] = query.split(',').map(n => parseFloat(n.trim()));
    if (!isNaN(lat) && !isNaN(lng)) {
      return {
        lat,
        lng,
        display_name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      };
    }
  }

  // Otherwise try geocoding the location name
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `${CORS_PROXY}https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1&addressdetails=1&countrycodes=us,ca`
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error(`Location not found: ${query}`);
    }

    const result = data[0];
    if (!result.lat || !result.lon) {
      throw new Error(`Invalid geocoding response for: ${query}`);
    }

    // Extract city name from address details or use the original query
    const cityName = result.address?.city || result.address?.town || result.address?.village || query.split(',')[0];

    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      display_name: cityName
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `${CORS_PROXY}https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
    );
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.display_name;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
}


export async function fetchZmanim(
  location: { lat: number; lng: number } | string,
  startDate: string,
  endDate: string
): Promise<ZmanimData> {
  let lat: number, lng: number;

  if (typeof location === 'string') {
    const coords = location.split(',').map(n => parseFloat(n.trim()));
    if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) {
      try {
        const geocoded = await geocodeLocation(location);
        lat = geocoded.lat;
        lng = geocoded.lng;
      } catch (error) {
        console.error('Geocoding error:', error);
        throw new Error(`Could not geocode location: ${location}`);
      }
    } else {
      [lat, lng] = coords;
    }
  } else {
    lat = location.lat;
    lng = location.lng;
  }

  const params = new URLSearchParams({
    cfg: 'json',
    latitude: lat.toString(),
    longitude: lng.toString(),
    start: startDate,
    end: endDate,
    b: '18',
    M: 'on',
    m: '50',
    timezone: 'auto'
  });

  const response = await fetch(`https://www.hebcal.com/zmanim/v2?${params}`, {
    mode: 'cors',
    headers: {
      'Accept': 'application/json'
    }
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Hebcal API Error:', {
      status: response.status,
      statusText: response.statusText,
      errorText,
      url: response.url
    });
    throw new Error(`Failed to fetch zmanim data: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Normalize data structure for single and multiple dates
  if (startDate === endDate && data.times) {
    data.times = Object.fromEntries(
      Object.entries(data.times).map(([zman, time]) => [zman, { [startDate]: time }])
    );
  }

  return data;
}
