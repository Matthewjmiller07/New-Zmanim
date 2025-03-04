import React, { useState, useCallback } from 'react';
import { debounce } from 'lodash';
import { QueryClient, QueryClientProvider } from 'react-query';
import {
  ThemeProvider,
  CssBaseline,
  Container,
  Typography,
  Box,
  Paper,
  Button,
  useMediaQuery,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { createTheme } from '@mui/material/styles';
import { format } from 'date-fns';

// Custom components and API functions
import ZmanimMap from './components/ZmanimMap';
import LocationInput from './components/LocationInput';
import ZmanimSelector from './components/ZmanimSelector';
import ZmanimChart from './components/ZmanimChart';
import ZmanimAnalysis from './components/ZmanimAnalysis';
import ZmanimTable from './components/ZmanimTable';
import QuickActions from './components/QuickActions';
import { fetchZmanim, geocodeLocation, reverseGeocode } from './api/hebcal';
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

  const [locations, setLocations] = useState<string[]>(['31.7767, 35.2345']); // Jerusalem coordinates
  const [mapMarkers, setMapMarkers] = useState<Array<{ lat: number; lng: number }>>([{ lat: 31.7767, lng: 35.2345 }]);
  const [selectedZmanim, setSelectedZmanim] = useState<string[]>(['sunrise', 'sunset', 'chatzot']);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [zmanimData, setZmanimData] = useState<ZmanimData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleLocationAdd = () => {
    setLocations([...locations, '']);
    setMapMarkers([...mapMarkers, { lat: 31.7767, lng: 35.2345 }]);
  };

  const handleLocationRemove = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
    setMapMarkers(mapMarkers.filter((_, i) => i !== index));
  };

  const debouncedHandleLocationChange = useCallback(
    debounce(async (index: number, value: string) => {
      console.log(`Fetching location for: ${value}`);
      try {
        const trimmedValue = value.trim();
        if (!trimmedValue) {
          setLocations(prev => {
            const newLocations = [...prev];
            newLocations[index] = '';
            return newLocations;
          });
          return;
        }

        if (trimmedValue.includes(',')) {
          const coords = trimmedValue.split(',').map(n => parseFloat(n.trim()));
          if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
            const result = await geocodeLocation(trimmedValue);
            setLocations(prev => {
              const newLocations = [...prev];
              newLocations[index] = `${result.display_name} (Lat: ${result.lat}, Lng: ${result.lng})`;
              return newLocations;
            });
            setMapMarkers(prev => {
              const newMarkers = [...prev];
              newMarkers[index] = { lat: result.lat, lng: result.lng };
              return newMarkers;
            });
          } else {
            console.error('Invalid coordinates format.');
          }
        } else {
          const result = await geocodeLocation(trimmedValue);
          setLocations(prev => {
            const newLocations = [...prev];
            newLocations[index] = `${result.display_name} (Lat: ${result.lat}, Lng: ${result.lng})`;
            return newLocations;
          });
          setMapMarkers(prev => {
            const newMarkers = [...prev];
            newMarkers[index] = { lat: result.lat, lng: result.lng };
            return newMarkers;
          });
        }
      } catch (error: any) {
        console.error('Error fetching location:', error.message || error);
        // Keep the input value as-is on error
      }
    }, 500),
    []
  );

  const handleLocationInputChange = (index: number, value: string) => {
    setLocations(prev => {
      const newLocations = [...prev];
      newLocations[index] = value;
      return newLocations;
    });
    debouncedHandleLocationChange(index, value);
  };

  const handleMapLocationSelect = async (location: { lat: number; lng: number }) => {
    try {
      const displayName = await reverseGeocode(location.lat, location.lng);
      setLocations([displayName || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`]);
      setMapMarkers([location]);
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      setLocations([`${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`]);
      setMapMarkers([location]);
    }
  };

  const handleTodayClick = () => {
    handleCurrentLocationClick();
  };

  const handleCurrentLocationClick = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    try {
      setIsLoading(true);
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const locationStr = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
      setLocations([locationStr]);
      setMapMarkers([location]);
      setStartDate(today);
      setEndDate(today);

      const formattedDate = format(today, 'yyyy-MM-dd');
      const results = await Promise.all([
        fetchZmanim(locationStr, formattedDate, formattedDate),
      ]);
      setZmanimData(results);
    } catch (error: any) {
      console.error('Error getting location:', error);
      alert('Error getting your location. Please try again or enter manually.');
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
        locations.map(location => fetchZmanim(location, formattedStartDate, formattedEndDate))
      );

      setZmanimData(results);
    } catch (error: any) {
      console.error('Error fetching zmanim:', error);
      alert('Error fetching zmanim data. Please try again.');
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
              <ZmanimMap onLocationSelect={handleMapLocationSelect} markers={mapMarkers} />

              <LocationInput
                locations={locations}
                onLocationChange={handleLocationInputChange}
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