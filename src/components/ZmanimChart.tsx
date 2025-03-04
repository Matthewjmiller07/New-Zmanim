import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { Paper, useTheme } from '@mui/material';
import { ZmanimData } from '../types/zmanim';

interface ZmanimChartProps {
  data: ZmanimData[];
  locations: string[];
  selectedZmanim: string[];
}

const ZmanimChart: React.FC<ZmanimChartProps> = ({ data, locations, selectedZmanim }) => {
  const theme = useTheme();

  const getSeries = () => {
    const series: ApexOptions['series'] = [];
    let minTime = Infinity;
    let maxTime = -Infinity;

    selectedZmanim.forEach(zman => {
      data.forEach((cityData, cityIndex) => {
        const timeData: [number, number][] = [];
        
        if (cityData.times[zman]) {
          Object.entries(cityData.times[zman]).forEach(([date, time]) => {
            if (time) {
              const parsedDate = new Date(date + 'T00:00:00');
              const zmanTime = new Date(time);

              if (!isNaN(zmanTime.getTime())) {
                const timeInHours = zmanTime.getHours() + zmanTime.getMinutes() / 60;
                timeData.push([parsedDate.getTime(), timeInHours]);

                minTime = Math.min(minTime, timeInHours);
                maxTime = Math.max(maxTime, timeInHours);
              }
            }
          });
        }

        if (timeData.length > 0) {
          series.push({
            name: `${zman} - ${locations[cityIndex]}`,
            data: timeData.sort((a, b) => a[0] - b[0]),
            type: 'line'
          });
        }
      });
    });

    return { series, timeRange: { min: minTime, max: maxTime } };
  };

  const { series, timeRange } = getSeries();

  const options: ApexOptions = {
    chart: {
      type: 'line',
      height: 400,
      background: 'transparent',
      toolbar: {
        show: true
      }
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    xaxis: {
      type: 'datetime',
      labels: {
        style: {
          colors: theme.palette.text.primary
        }
      }
    },
    yaxis: {
      min: Math.floor(timeRange.min - 0.5),
      max: Math.ceil(timeRange.max + 0.5),
      labels: {
        formatter: (value) => {
          const hours = Math.floor(value);
          const minutes = Math.round((value - hours) * 60);
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        },
        style: {
          colors: theme.palette.text.primary
        }
      }
    },
    tooltip: {
      theme: theme.palette.mode,
      x: {
        format: 'dd MMM yyyy'
      },
      y: {
        formatter: (value) => {
          const hours = Math.floor(value);
          const minutes = Math.round((value - hours) * 60);
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
      }
    },
    grid: {
      borderColor: theme.palette.divider
    },
    legend: {
      labels: {
        colors: theme.palette.text.primary
      }
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
      <ReactApexChart
        options={options}
        series={series}
        height={400}
      />
    </Paper>
  );
};

export default ZmanimChart;
