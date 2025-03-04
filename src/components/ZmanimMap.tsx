import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker, Popup } from 'react-leaflet';
import { LatLng } from 'leaflet';
import { Box, Paper, Typography } from '@mui/material';
import 'leaflet/dist/leaflet.css';

interface ZmanimMapProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  locations: string[];
}

interface MapEventsProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
}

function MapEvents({ onLocationSelect }: MapEventsProps) {
  useMapEvents({
    click: (e) => {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

const ZmanimMap: React.FC<ZmanimMapProps> = ({ onLocationSelect, locations }) => {
  const [markers, setMarkers] = useState<Array<{ position: LatLng; name: string }>>([]);

  useEffect(() => {
    const fetchLocations = async () => {
      const newMarkers = await Promise.all(
        locations.map(async (loc) => {
          try {
            // If location is already lat/lng
            if (loc.includes(',')) {
              const [lat, lng] = loc.split(',').map(n => parseFloat(n.trim()));
              if (isNaN(lat) || isNaN(lng)) {
                console.error('Invalid coordinates:', loc);
                return null;
              }
              
              try {
                const response = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
                );
                if (!response.ok) throw new Error('Geocoding failed');
                
                const data = await response.json();
                return {
                  position: new LatLng(lat, lng),
                  name: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
                };
              } catch (error) {
                // Fallback to coordinates if geocoding fails
                return {
                  position: new LatLng(lat, lng),
                  name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
                };
              }
            } else {
              // Forward geocode place name
              const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(loc)}&limit=1`
              );
              if (!response.ok) throw new Error('Geocoding failed');
              
              const data = await response.json();
              if (data[0]) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                return {
                  position: new LatLng(lat, lng),
                  name: loc
                };
              }
            }
          } catch (error) {
            console.error('Error processing location:', loc, error);
          }
          return null;
        })
      );
      
      const validMarkers = newMarkers.filter((marker): marker is { position: LatLng; name: string } => {
        return marker !== null && 
               !isNaN(marker.position.lat) && 
               !isNaN(marker.position.lng);
      });
      
      setMarkers(validMarkers);
    };

    fetchLocations();
  }, [locations]);
  const defaultPosition: LatLng = new LatLng(31.7767, 35.2345); // Jerusalem

  return (
    <Paper elevation={3} sx={{ height: { xs: 300, md: 400 }, mb: 2 }}>
      <Box sx={{ height: '100%', width: '100%' }}>
        <MapContainer
          center={defaultPosition}
          zoom={8}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents onLocationSelect={onLocationSelect} />
          {markers.map((marker, index) => (
            <Marker
              key={index}
              position={marker.position}
            >
              <Popup>
                <Typography variant="body2">{marker.name}</Typography>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Box>
    </Paper>
  );
};

export default ZmanimMap;
