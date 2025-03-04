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
          // If location is already lat/lng
          if (loc.includes(',')) {
            const [lat, lng] = loc.split(',').map(Number);
            // Reverse geocode to get place name
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
              );
              const data = await response.json();
              return {
                position: new LatLng(lat, lng),
                name: data.display_name || `${lat}, ${lng}`
              };
            } catch (error) {
              return {
                position: new LatLng(lat, lng),
                name: `${lat}, ${lng}`
              };
            }
          } else {
            // Forward geocode place name
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(loc)}`
              );
              const data = await response.json();
              if (data[0]) {
                return {
                  position: new LatLng(Number(data[0].lat), Number(data[0].lon)),
                  name: loc
                };
              }
            } catch (error) {
              console.error('Error geocoding location:', error);
            }
          }
          return null;
        })
      );
      setMarkers(newMarkers.filter((marker): marker is { position: LatLng; name: string } => marker !== null));
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
