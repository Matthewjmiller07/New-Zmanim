import React from 'react';
import {
  TextField,
  IconButton,
  Box,
  Paper,
  Typography,
  Stack
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
  onLocationRemove
}) => {
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
