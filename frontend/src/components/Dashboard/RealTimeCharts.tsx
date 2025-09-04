import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Tabs,
  Tab,
  Grid,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';
import { useGetSystemStatusQuery } from '../../store/api/apiSlice';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`chart-tabpanel-${index}`}
      aria-labelledby={`chart-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const RealTimeCharts: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [transactionData, setTransactionData] = useState<any[]>([]);
  
  const { data: systemStatus } = useGetSystemStatusQuery(undefined, {
    pollingInterval: 5000,
  });

  useEffect(() => {
    if (systemStatus) {
      const timestamp = new Date().toLocaleTimeString();
      const memoryUsage = (systemStatus.system.memory.heapUsed / 1024 / 1024);
      const cpuUsage = Math.random() * 100; // Mock CPU usage since it's not in the real data
      
      setPerformanceData(prev => {
        const newData = [...prev, {
          time: timestamp,
          memory: parseFloat(memoryUsage.toFixed(1)),
          cpu: parseFloat(cpuUsage.toFixed(1)),
          uptime: systemStatus.system.uptime,
        }];
        // Keep only last 20 data points
        return newData.slice(-20);
      });

      // Mock transaction data
      setTransactionData(prev => {
        const shouldAddTransaction = Math.random() > 0.7; // 30% chance of new transaction
        if (shouldAddTransaction) {
          const newTransaction = {
            time: timestamp,
            successful: Math.random() > 0.1 ? 1 : 0, // 90% success rate
            failed: Math.random() > 0.9 ? 1 : 0, // 10% failure rate
            total: 1,
          };
          const newData = [...prev, newTransaction];
          return newData.slice(-20);
        }
        return prev;
      });
    }
  }, [systemStatus]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Generate mock historical data for demonstration
  const generateMockData = () => {
    const data = [];
    const categories = ['alcohol', 'tobacco', 'general', 'medicine'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      
      data.push({
        date: date.toLocaleDateString(),
        alcohol: Math.floor(Math.random() * 50) + 10,
        tobacco: Math.floor(Math.random() * 30) + 5,
        general: Math.floor(Math.random() * 100) + 20,
        medicine: Math.floor(Math.random() * 20) + 3,
      });
    }
    return data;
  };

  const weeklyData = generateMockData();

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Real-time Analytics
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="chart tabs">
            <Tab label="System Performance" />
            <Tab label="Transactions" />
            <Tab label="Weekly Overview" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="subtitle1" gutterBottom>
            System Performance Metrics
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="memory" 
                stroke="#8884d8" 
                name="Memory (MB)"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="cpu" 
                stroke="#82ca9d" 
                name="CPU (%)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="subtitle1" gutterBottom>
            Transaction Activity
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={transactionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="successful" 
                stackId="1"
                stroke="#4caf50" 
                fill="#4caf50"
                name="Successful"
              />
              <Area 
                type="monotone" 
                dataKey="failed" 
                stackId="1"
                stroke="#f44336" 
                fill="#f44336"
                name="Failed"
              />
            </AreaChart>
          </ResponsiveContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="subtitle1" gutterBottom>
            Weekly Transaction Overview by Category
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="alcohol" fill="#ff7043" name="Alcohol" />
              <Bar dataKey="tobacco" fill="#8d6e63" name="Tobacco" />
              <Bar dataKey="general" fill="#42a5f5" name="General" />
              <Bar dataKey="medicine" fill="#66bb6a" name="Medicine" />
            </BarChart>
          </ResponsiveContainer>
        </TabPanel>
      </CardContent>
    </Card>
  );
};

export default RealTimeCharts;
