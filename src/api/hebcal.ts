import { ZmanimData } from '../types/zmanim';

const CORS_PROXY = 'https://corsproxy.io/?';

export async function geocodeLocation(query: string): Promise<{ lat: number; lng: number; display_name: string }> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `${CORS_PROXY}https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1`
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      throw new Error('Location not found');
    }

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      display_name: data[0].display_name
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
  const params = new URLSearchParams({
    cfg: 'json',
    start: startDate,
    end: endDate,
    b: '18',
    M: 'on',
    m: '50',
    timezone: 'auto'
  });

  if (typeof location === 'string') {
    // First try to geocode if it's not already coordinates
    if (!location.includes(',')) {
      try {
        const geocoded = await geocodeLocation(location);
        params.append('latitude', geocoded.lat.toString());
        params.append('longitude', geocoded.lng.toString());
      } catch (error) {
        console.error('Geocoding error:', error);
        throw new Error(`Could not geocode location: ${location}`);
      }
    } else {
      // Handle lat,lng string format
      const [lat, lng] = location.split(',').map(n => parseFloat(n.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        params.append('latitude', lat.toString());
        params.append('longitude', lng.toString());
      } else {
        throw new Error('Invalid coordinates format');
      }
    }
  } else {
    if (isNaN(location.lat) || isNaN(location.lng)) {
      throw new Error('Invalid coordinates');
    }
    params.append('latitude', location.lat.toString());
    params.append('longitude', location.lng.toString());
  }

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
