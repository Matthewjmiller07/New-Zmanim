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
    m: '50'
  });

  if (typeof location === 'string') {
    params.append('city', location);
  } else {
    params.append('latitude', location.lat.toString());
    params.append('longitude', location.lng.toString());
  }

  const response = await fetch(`https://www.hebcal.com/zmanim?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch zmanim data');
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
