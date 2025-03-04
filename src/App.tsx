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
  const [mapMarkers, setMapMarkers] = useState<Array<{ lat: number; lng: number }>>([{ lat: 31.7767, lng: 35.2345 }]); // Jerusalem
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
    setMapMarkers([...mapMarkers, { lat: 31.7767, lng: 35.2345 }]);
  };

  const handleLocationRemove = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
    setMapMarkers(mapMarkers.filter((_, i) => i !== index));
  };

  const handleLocationChange = async (index: number, value: string) => {
    console.log(`Fetching location for: ${value}`); // Log the location being fetched
    try {
      // Trim whitespace from input
      const trimmedValue = value.trim();

      // Check if the input is in lat,lng format
      if (trimmedValue.includes(',')) {
        const coords = trimmedValue.split(',').map(n => parseFloat(n.trim()));
        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
          // If valid coordinates, fetch city name
          const result = await geocodeLocation(trimmedValue);
          console.log(`Geocoded location: ${JSON.stringify(result)}`); // Log the result of geocoding
          setLocations(prev => {
            const newLocations = [...prev];
            newLocations[index] = `${result.display_name} (Lat: ${result.lat}, Lng: ${result.lng})`; // Show city name and coordinates
            return newLocations;
          });
          setMapMarkers(prev => {
            const newMarkers = [...prev];
            newMarkers[index] = { lat: result.lat, lng: result.lng };
            return newMarkers;
          });
        } else {
          console.error('Invalid coordinates format.');
          setLocations(prev => {
            const newLocations = [...prev];
            newLocations[index] = 'Invalid coordinates'; // Show error message
            return newLocations;
          });
        }
      } else {
        // Otherwise, treat it as a city name
        const result = await geocodeLocation(trimmedValue);
        console.log(`Geocoded location: ${JSON.stringify(result)}`); // Log the result of geocoding
        setLocations(prev => {
          const newLocations = [...prev];
          newLocations[index] = `${result.display_name} (Lat: ${result.lat}, Lng: ${result.lng})`; // Show city name and coordinates
          return newLocations;
        });
        setMapMarkers(prev => {
          const newMarkers = [...prev];
          newMarkers[index] = { lat: result.lat, lng: result.lng };
          return newMarkers;
        });
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      setLocations(prev => {
        const newLocations = [...prev];
        newLocations[index] = 'Error fetching location'; // Show error message
        return newLocations;
      });
    }
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
    // Just trigger the current location handler
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
        navigator.geolocation.getCurrentPosition(resolve, (error) => {
          if (error.code === 1) {
            const isChrome = navigator.userAgent.indexOf('Chrome') > -1;
            const isSafari = navigator.userAgent.indexOf('Safari') > -1 && navigator.userAgent.indexOf('Chrome') === -1;
            
            let instructions = 'To enable location access:\n\n';
            if (isChrome) {
              instructions += '1. Click the lock/info icon in the address bar (left of the URL)\n' +
                           '2. Click "Site settings"\n' +
                           '3. Find "Location" and change it to "Allow"\n' +
                           '4. Refresh the page';
            } else if (isSafari) {
              instructions += '1. Click Safari in the menu bar\n' +
                           '2. Click "Settings" (or Preferences)\n' +
                           '3. Go to "Websites" tab\n' +
                           '4. Find "Location" on the left\n' +
                           '5. Find this website and set it to "Allow"\n' +
                           '6. Refresh the page';
            } else {
              instructions += 'Please enable location services in your browser settings and refresh the page.';
            }
            alert(instructions);
            reject(new Error('PERMISSION_DENIED'));
          } else {
            reject(error);
          }
        }, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Update state with coordinates
      const locationStr = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
      setLocations([locationStr]);
      setMapMarkers([location]);
      setStartDate(today);
      setEndDate(today);

      // Fetch zmanim
      const formattedDate = format(today, 'yyyy-MM-dd');
      const results = await Promise.all([
        fetchZmanim(
          locationStr,
          formattedDate,
          formattedDate
        )
      ]);
      setZmanimData(results);
    } catch (error) {
      console.error('Error getting location:', error);
      
      if (error instanceof Error && error.message === 'PERMISSION_DENIED') {
        const isChrome = navigator.userAgent.indexOf('Chrome') > -1;
        const isSafari = navigator.userAgent.indexOf('Safari') > -1 && navigator.userAgent.indexOf('Chrome') === -1;
        
        let instructions = 'To enable location access:\n\n';
        if (isChrome) {
          instructions += '1. Click the lock/info icon in the address bar (left of the URL)\n' +
                         '2. Click "Site settings"\n' +
                         '3. Find "Location" and change it to "Allow"\n' +
                         '4. Refresh the page';
        } else if (isSafari) {
          instructions += '1. Click Safari in the menu bar\n' +
                         '2. Click "Settings" (or Preferences)\n' +
                         '3. Go to "Websites" tab\n' +
                         '4. Click "Location" on the left\n' +
                         '5. Find this website and set it to "Allow"\n' +
                         '6. Refresh the page';
        } else {
          instructions += '1. Click the lock/info icon in the address bar\n' +
                         '2. Find and enable location access\n' +
                         '3. Refresh the page';
        }
        
        alert(instructions);
      } else if ((error as GeolocationPositionError).code === 2) {
        alert('Could not get your location. Please check your device\'s location services.');
      } else if ((error as GeolocationPositionError).code === 3) {
        alert('Location request timed out. Please check your internet connection and try again.');
      } else {
        alert('Error getting your location. Please try again or enter your location manually.');
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
              <ZmanimMap 
                onLocationSelect={handleMapLocationSelect}
                markers={mapMarkers}
              />
              
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
