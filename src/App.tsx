import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import {
  ThemeProvider,
  CssBaseline,
  Container,
  Typography,
  Box,
  Paper,

  Button,
  useMediaQuery
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { createTheme } from '@mui/material/styles';
import { format } from 'date-fns';

import ZmanimMap from './components/ZmanimMap';
import LocationInput from './components/LocationInput';
import ZmanimSelector from './components/ZmanimSelector';
import ZmanimChart from './components/ZmanimChart';
import ZmanimAnalysis from './components/ZmanimAnalysis';
import ZmanimTable from './components/ZmanimTable';
import QuickActions from './components/QuickActions';
import { fetchZmanim } from './api/hebcal';
import { ZmanimData } from './types/zmanim';

const queryClient = new QueryClient();

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
        },
      }),
    [prefersDarkMode]
  );

  const [locations, setLocations] = useState<string[]>(['Jerusalem, Israel']);
  const [selectedZmanim, setSelectedZmanim] = useState<string[]>([
    'sunrise',
    'sunset',
    'chatzot'
  ]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [zmanimData, setZmanimData] = useState<ZmanimData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleLocationAdd = () => {
    setLocations([...locations, '']);
  };

  const handleLocationRemove = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const handleLocationChange = (index: number, value: string) => {
    const newLocations = [...locations];
    newLocations[index] = value;
    setLocations(newLocations);
  };

  const handleMapLocationSelect = (location: { lat: number; lng: number }) => {
    setLocations([`${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`]);
  };

  const handleTodayClick = async () => {
    const today = new Date();
    // Strip time component to avoid timezone issues
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    setStartDate(todayStart);
    setEndDate(todayStart);
    setIsLoading(true);

    try {
      const formattedDate = format(todayStart, 'yyyy-MM-dd');
      const results = await Promise.all(
        locations.map(location =>
          fetchZmanim(location, formattedDate, formattedDate)
        )
      );
      setZmanimData(results);
    } catch (error) {
      console.error('Error fetching zmanim:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCurrentLocationClick = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    try {
      // First check if we have permission
      const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
      
      if (permissionStatus.state === 'denied') {
        alert('Location access is blocked. Please enable location access in your browser settings.');
        return;
      }

      setIsLoading(true);
      
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      handleMapLocationSelect(location);
      
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      setStartDate(todayStart);
      setEndDate(todayStart);
      const formattedDate = format(todayStart, 'yyyy-MM-dd');
      
      const results = await Promise.all([
        fetchZmanim(
          `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
          formattedDate,
          formattedDate
        )
      ]);
      
      setZmanimData(results);
    } catch (error) {
      console.error('Error getting location:', error);
      if ((error as GeolocationPositionError).code === 1) {
        alert('Location access was denied. Please enable location access in your browser settings.');
      } else if ((error as GeolocationPositionError).code === 2) {
        alert('Location is not available. Please try again.');
      } else if ((error as GeolocationPositionError).code === 3) {
        alert('Location request timed out. Please try again.');
      } else {
        alert('Error getting location. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');

      const results = await Promise.all(
        locations.map(location =>
          fetchZmanim(location, formattedStartDate, formattedEndDate)
        )
      );

      setZmanimData(results);
    } catch (error) {
      console.error('Error fetching zmanim:', error);
      // You might want to add error handling UI here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <CssBaseline />
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom align="center">
              Zmanim Lookup
            </Typography>

            <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
              <QuickActions
                onTodayClick={handleTodayClick}
                onCurrentLocationClick={handleCurrentLocationClick}
                isLoading={isLoading}
              />
              <ZmanimMap onLocationSelect={handleMapLocationSelect} />
              
              <LocationInput
                locations={locations}
                onLocationChange={handleLocationChange}
                onLocationAdd={handleLocationAdd}
                onLocationRemove={handleLocationRemove}
              />

              <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Date Range
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(date) => date && setStartDate(date)}
                    sx={{ flex: 1 }}
                  />
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(date) => date && setEndDate(date)}
                    sx={{ flex: 1 }}
                  />
                </Box>
              </Paper>

              <ZmanimSelector
                selectedZmanim={selectedZmanim}
                onZmanimChange={setSelectedZmanim}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Get Zmanim'}
              </Button>
            </Box>

            {zmanimData.length > 0 && (
              <>
                <ZmanimChart
                  data={zmanimData}
                  locations={locations}
                  selectedZmanim={selectedZmanim}
                />
                <ZmanimAnalysis
                  startDate={startDate}
                  data={zmanimData}
                  locations={locations}
                  selectedZmanim={selectedZmanim}
                />
                <ZmanimTable
                  data={zmanimData}
                  locations={locations}
                  selectedZmanim={selectedZmanim}
                />
              </>
            )}
          </Container>
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
