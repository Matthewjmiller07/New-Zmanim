import { ZmanimData } from '../types/zmanim';

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
    if (location.includes(',')) {
      // Handle lat,lng string format
      const [lat, lng] = location.split(',').map(n => parseFloat(n.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        params.append('latitude', lat.toString());
        params.append('longitude', lng.toString());
      } else {
        throw new Error('Invalid coordinates format');
      }
    } else {
      // Convert city name to a format the API accepts
      const formattedCity = location.trim();
      params.append('city', formattedCity);
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
