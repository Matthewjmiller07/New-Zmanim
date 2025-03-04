import React, { useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Typography,
  Box
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { ZmanimData, ZMANIM_OPTIONS } from '../types/zmanim';

interface ZmanimTableProps {
  data: ZmanimData[];
  locations: string[];
  selectedZmanim: string[];
}

const ZmanimTable: React.FC<ZmanimTableProps> = ({ data, locations, selectedZmanim }) => {
  const [copied, setCopied] = useState(false);

  const formatTimeWithTimezone = (date: Date, tzid: string): string => {
    return date.toLocaleTimeString('en-US', {
      timeZone: tzid,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Organize data by date and location
  const tableData = new Map<string, Map<string, { [key: string]: string }>>();
  
  data.forEach((cityData, index) => {
    selectedZmanim.forEach(zman => {
      if (cityData.times[zman]) {
        Object.entries(cityData.times[zman]).forEach(([date, time]) => {
          if (!tableData.has(date)) {
            tableData.set(date, new Map());
          }
          const dateMap = tableData.get(date)!;
          if (!dateMap.has(locations[index])) {
            dateMap.set(locations[index], {});
          }
          if (time) {
            const zmanTime = new Date(time);
            const timeString = formatTimeWithTimezone(zmanTime, cityData.location.tzid);
            const locationData = dateMap.get(locations[index])!;
            locationData[zman] = timeString;
          }
        });
      }
    });
  });

  const getZmanLabel = (zmanId: string): string => {
    const option = ZMANIM_OPTIONS.find(opt => opt.id === zmanId);
    return option?.label || zmanId;
  };

  const copyToClipboard = async () => {
    const dates = Array.from(tableData.keys()).sort();
    let text = 'Date\tLocation';
    selectedZmanim.forEach(zman => {
      text += `\t${getZmanLabel(zman)}`;
    });
    text += '\n';

    dates.forEach(date => {
      const locationMap = tableData.get(date);
      locations.forEach(location => {
        text += `${date}\t${location}`;
        selectedZmanim.forEach(zman => {
          text += `\t${locationMap?.get(location)?.[zman] || '-'}`;
        });
        text += '\n';
      });
    });

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <Paper sx={{ mt: 3, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Zmanim Table</Typography>
        <Tooltip title="Copy to clipboard">
          <IconButton onClick={copyToClipboard} color={copied ? "success" : "default"}>
            {copied ? <CheckIcon /> : <ContentCopyIcon />}
          </IconButton>
        </Tooltip>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Location</TableCell>
              {selectedZmanim.map(zman => (
                <TableCell key={zman}>{getZmanLabel(zman)}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from(tableData.entries())
              .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
              .map(([date, locationMap]) => (
                locations.map(location => (
                  <TableRow key={`${date}-${location}`}>
                    <TableCell>{date}</TableCell>
                    <TableCell>{location}</TableCell>
                    {selectedZmanim.map(zman => (
                      <TableCell key={zman}>
                        {locationMap.get(location)?.[zman] || '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default ZmanimTable;
