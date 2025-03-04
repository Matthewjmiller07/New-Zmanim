import React from 'react';
import { Typography, Paper, Box } from '@mui/material';
import { ZmanimData, ZMANIM_OPTIONS } from '../types/zmanim';
import { format } from 'date-fns';

interface ZmanimAnalysisProps {
  data: ZmanimData[];
  locations: string[];
  selectedZmanim: string[];
  startDate: Date;
}

interface ZmanComparison {
  location: string;
  time: Date;
  timeString: string;
  date: string;
}

const ZmanimAnalysis: React.FC<ZmanimAnalysisProps> = ({ data, locations, selectedZmanim, startDate }) => {
  const formatTimeWithTimezone = (date: Date, tzid: string): string => {
    return date.toLocaleTimeString('en-US', {
      timeZone: tzid,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const analyzeZmanim = (zman: string) => {
    const locationAnalysis = new Map<string, { earliest: ZmanComparison; latest: ZmanComparison }>();
    const allComparisons: ZmanComparison[] = [];

    // Collect all times for this zman across locations
    data.forEach((cityData, index) => {
      if (cityData.times[zman]) {
        const locationComparisons: ZmanComparison[] = [];
        Object.entries(cityData.times[zman]).forEach(([date, time]) => {
          if (time) {
            const zmanTime = new Date(time);
            const timeString = formatTimeWithTimezone(zmanTime, cityData.location.tzid);
            const comparison: ZmanComparison = {
              location: locations[index],
              time: zmanTime,
              timeString,
              date
            };
            locationComparisons.push(comparison);
            allComparisons.push(comparison);
          }
        });

        // Find earliest and latest for this location
        if (locationComparisons.length > 0) {
          locationComparisons.sort((a, b) => a.time.getTime() - b.time.getTime());
          locationAnalysis.set(locations[index], {
            earliest: locationComparisons[0],
            latest: locationComparisons[locationComparisons.length - 1]
          });
        }
      }
    });

    // Find overall earliest and latest
    allComparisons.sort((a, b) => a.time.getTime() - b.time.getTime());
    const overallEarliest = allComparisons[0];
    const overallLatest = allComparisons[allComparisons.length - 1];

    return (
      <Box sx={{ mb: 3 }}>
        {/* Overall analysis */}
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Overall Analysis:
        </Typography>
        <Typography variant="body2">
          • Earliest {getZmanLabel(zman).toLowerCase()}: {overallEarliest.location} on {format(new Date(overallEarliest.date), 'MMMM d')} at {overallEarliest.timeString}
        </Typography>
        <Typography variant="body2">
          • Latest {getZmanLabel(zman).toLowerCase()}: {overallLatest.location} on {format(new Date(overallLatest.date), 'MMMM d')} at {overallLatest.timeString}
        </Typography>

        {/* Per location analysis */}
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2, mb: 1 }}>
          By Location:
        </Typography>
        {Array.from(locationAnalysis.entries()).map(([location, analysis]) => (
          <Box key={location} sx={{ mb: 1 }}>
            <Typography variant="body2">
              • {location}:
            </Typography>
            <Typography variant="body2" sx={{ pl: 2 }}>
              Earliest: {format(new Date(analysis.earliest.date), 'MMMM d')} at {analysis.earliest.timeString}
            </Typography>
            <Typography variant="body2" sx={{ pl: 2 }}>
              Latest: {format(new Date(analysis.latest.date), 'MMMM d')} at {analysis.latest.timeString}
            </Typography>
          </Box>
        ))}

        {/* Location comparisons */}
        {locations.length > 1 && (
          <>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2, mb: 1 }}>
              Location Comparisons:
            </Typography>
            {locations.map((loc1, i) => 
              locations.slice(i + 1).map(loc2 => {
                const analysis1 = locationAnalysis.get(loc1);
                const analysis2 = locationAnalysis.get(loc2);
                if (analysis1 && analysis2) {
                  const isAlwaysEarlier = allComparisons
                    .filter(c => c.location === loc1)
                    .every(c1 => 
                      allComparisons
                        .filter(c2 => c2.location === loc2 && c2.date === c1.date)
                        .every(c2 => c1.time < c2.time)
                    );
                  const isAlwaysLater = allComparisons
                    .filter(c => c.location === loc1)
                    .every(c1 => 
                      allComparisons
                        .filter(c2 => c2.location === loc2 && c2.date === c1.date)
                        .every(c2 => c1.time > c2.time)
                    );
                  
                  if (isAlwaysEarlier || isAlwaysLater) {
                    return (
                      <Typography key={`${loc1}-${loc2}`} variant="body2">
                        • {loc1} is always {isAlwaysEarlier ? 'earlier' : 'later'} than {loc2}
                      </Typography>
                    );
                  }
                  return null;
                }
                return null;
              })
            )}
          </>
        )}
      </Box>
    );
  };

  const getZmanLabel = (zmanId: string): string => {
    const option = ZMANIM_OPTIONS.find(opt => opt.id === zmanId);
    return option?.label || zmanId;
  };

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Zmanim Analysis ({format(startDate, 'MMM d, yyyy')})
      </Typography>
      {selectedZmanim.map(zman => (
        <Box key={zman} sx={{ mb: 4 }}>
          <Typography variant="h6" color="primary" gutterBottom>
            {getZmanLabel(zman)}
          </Typography>
          {analyzeZmanim(zman)}
        </Box>
      ))}
    </Paper>
  );
};

export default ZmanimAnalysis;
