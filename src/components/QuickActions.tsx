import React from 'react';
import { Box, Button, ButtonGroup, Typography } from '@mui/material';
import TodayIcon from '@mui/icons-material/Today';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { format } from 'date-fns';

interface QuickActionsProps {
  onTodayClick: () => void;
  onCurrentLocationClick: () => void;
  isLoading: boolean;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onTodayClick,
  onCurrentLocationClick,
  isLoading
}) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Quick Actions
      </Typography>
      <ButtonGroup variant="outlined" size="small">
        <Button
          startIcon={<TodayIcon />}
          onClick={onTodayClick}
          disabled={isLoading}
        >
          Today's Zmanim ({format(new Date(), 'MMM d')})
        </Button>
        <Button
          startIcon={<MyLocationIcon />}
          onClick={onCurrentLocationClick}
          disabled={isLoading}
        >
          My Location
        </Button>
      </ButtonGroup>
    </Box>
  );
};

export default QuickActions;
