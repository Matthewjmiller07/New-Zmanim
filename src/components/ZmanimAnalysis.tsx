import React from 'react';
import { Typography, Paper, Box } from '@mui/material';
import { ZmanimData, ZMANIM_OPTIONS } from '../types/zmanim';
import { format } from 'date-fns';

interface ZmanimAnalysisProps {
  data: ZmanimData[];
  locations: string[];
  selectedZmanim: string[];
}

interface ZmanComparison {
  location: string;
  time: Date;
  timeString: string;
}

const ZmanimAnalysis: React.FC<ZmanimAnalysisProps> = ({ data, locations, selectedZmanim }) => {
  const formatTimeWithTimezone = (date: Date, tzid: string): string => {
    return date.toLocaleTimeString('en-US', {
      timeZone: tzid,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const analyzeZmanim = (zman: string) => {

    const dateComparisons = new Map<string, ZmanComparison[]>();

    // Collect all times for this zman across locations
    data.forEach((cityData, index) => {
      if (cityData.times[zman]) {
        Object.entries(cityData.times[zman]).forEach(([date, time]) => {
          if (time) {
            const zmanTime = new Date(time);
            const timeString = formatTimeWithTimezone(zmanTime, cityData.location.tzid);
            const comparison: ZmanComparison = {
              location: locations[index],
              time: zmanTime,
              timeString
            };

            if (!dateComparisons.has(date)) {
              dateComparisons.set(date, []);
            }
            dateComparisons.get(date)?.push(comparison);
          }
        });
      }
    });

    // Analyze the comparisons for each date
    const analysis: JSX.Element[] = [];
    dateComparisons.forEach((comparisons, date) => {
      if (comparisons.length > 0) {
        // Sort by time
        comparisons.sort((a, b) => a.time.getTime() - b.time.getTime());
        const earliest = comparisons[0];
        const latest = comparisons[comparisons.length - 1];

        analysis.push(
          <Box key={`${zman}-${date}`} sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {format(new Date(date), 'MMMM d, yyyy')}:
            </Typography>
            {comparisons.map((comp) => (
              <Typography key={comp.location} variant="body2">
                • {comp.location}: {comp.timeString}
              </Typography>
            ))}
            {comparisons.length > 1 && (
              <>
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                  Earliest: {earliest.location} at {earliest.timeString}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Latest: {latest.location} at {latest.timeString}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Time difference: {formatTimeDifference(latest.time.getTime() - earliest.time.getTime())}
                </Typography>
              </>
            )}
          </Box>
        );
      }
    });

    return analysis;
  };

  const formatTimeDifference = (diffMs: number): string => {
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return hours > 0 
      ? `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`
      : `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  const getZmanLabel = (zmanId: string): string => {
    const option = ZMANIM_OPTIONS.find(opt => opt.id === zmanId);
    return option?.label || zmanId;
  };

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Zmanim Analysis
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
