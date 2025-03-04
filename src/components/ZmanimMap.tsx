import React from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { LatLng } from 'leaflet';
import { Box, Paper } from '@mui/material';

interface ZmanimMapProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
}

function MapEvents({ onLocationSelect }: ZmanimMapProps) {
  useMapEvents({
    click: (e) => {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

const ZmanimMap: React.FC<ZmanimMapProps> = ({ onLocationSelect }) => {
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
        </MapContainer>
      </Box>
    </Paper>
  );
};

export default ZmanimMap;
