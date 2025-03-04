import React from 'react';
import {
  Paper,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Button,
  Box,
  Divider,
  useTheme
} from '@mui/material';
import { ZMANIM_OPTIONS } from '../types/zmanim';

interface ZmanimSelectorProps {
  selectedZmanim: string[];
  onZmanimChange: (zmanim: string[]) => void;
}

const ZmanimSelector: React.FC<ZmanimSelectorProps> = ({
  selectedZmanim,
  onZmanimChange,
}) => {
  const theme = useTheme();

  const handleSelectAll = () => {
    onZmanimChange(ZMANIM_OPTIONS.map(option => option.id));
  };

  const handleDeselectAll = () => {
    onZmanimChange([]);
  };

  const handleToggle = (zmanId: string) => {
    const newSelected = selectedZmanim.includes(zmanId)
      ? selectedZmanim.filter(id => id !== zmanId)
      : [...selectedZmanim, zmanId];
    onZmanimChange(newSelected);
  };

  const categories = ['morning', 'afternoon', 'evening', 'night'] as const;

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Select Zmanim
      </Typography>
      
      <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={handleSelectAll}
          sx={{ flex: 1 }}
        >
          Select All
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={handleDeselectAll}
          sx={{ flex: 1 }}
        >
          Deselect All
        </Button>
      </Box>

      {categories.map((category, idx) => (
        <React.Fragment key={category}>
          {idx > 0 && <Divider sx={{ my: 1 }} />}
          <Typography
            variant="subtitle2"
            sx={{
              color: theme.palette.primary.main,
              textTransform: 'capitalize',
              mt: 1
            }}
          >
            {category}
          </Typography>
          <FormGroup>
            {ZMANIM_OPTIONS
              .filter(option => option.category === category)
              .map(option => (
                <FormControlLabel
                  key={option.id}
                  control={
                    <Checkbox
                      checked={selectedZmanim.includes(option.id)}
                      onChange={() => handleToggle(option.id)}
                      size="small"
                    />
                  }
                  label={option.label}
                />
              ))}
          </FormGroup>
        </React.Fragment>
      ))}
    </Paper>
  );
};

export default ZmanimSelector;
