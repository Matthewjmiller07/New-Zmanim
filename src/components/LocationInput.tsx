import React, { useState, useEffect } from 'react';
import {
  TextField,
  IconButton,
  Box,
  Paper,
  Typography,
  Stack,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';

interface LocationInputProps {
  locations: string[];
  onLocationChange: (index: number, value: string) => void;
  onLocationAdd: () => void;
  onLocationRemove: (index: number) => void;
}

const LocationInput: React.FC<LocationInputProps> = ({
  locations,
  onLocationChange,
  onLocationAdd,
  onLocationRemove,
}) => {
  const [helperTexts, setHelperTexts] = useState<string[]>(locations.map(() => ''));

  useEffect(() => {
    // Update helper text dynamically based on the input value
    setHelperTexts(
      locations.map(location => {
        if (!location) return 'Enter a city name or click on the map';
        if (location.includes(',') && location.split(',').length === 2) {
          const coords = location.split(',').map(n => parseFloat(n.trim()));
          if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
            return 'Coordinates detected - fetching location name...';
          }
          return 'Invalid coordinates format';
        }
        return 'Enter a city name or click on the map';
      })
    );
  }, [locations]);

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Locations
      </Typography>
      <Stack spacing={2}>
        {locations.map((location, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              fullWidth
              label={`Location ${index + 1}`}
              value={location}
              onChange={(e) => onLocationChange(index, e.target.value)}
              placeholder="Enter city name or coordinates"
              size="small"
              helperText={helperTexts[index]}
              InputLabelProps={{ shrink: true }}
            />
            {locations.length > 1 && (
              <IconButton
                onClick={() => onLocationRemove(index)}
                color="error"
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        ))}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <IconButton
            onClick={onLocationAdd}
            color="primary"
            sx={{ borderRadius: 1 }}
          >
            <AddIcon />
          </IconButton>
        </Box>
      </Stack>
    </Paper>
  );
};

export default LocationInput;