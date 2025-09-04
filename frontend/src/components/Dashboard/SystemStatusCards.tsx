import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  CreditCard as CardIcon,
  Face as FaceIcon,
  Router as RouterIcon,
} from '@mui/icons-material';
import { useGetSystemStatusQuery } from '../../store/api/apiSlice';

const SystemStatusCards: React.FC = () => {
  const { data: systemStatus, error, isLoading } = useGetSystemStatusQuery(undefined, {
    pollingInterval: 5000, // Poll every 5 seconds
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load system status. Please check your connection to the backend service.
      </Alert>
    );
  }

  if (!systemStatus) {
    return (
      <Alert severity="warning">
        No system status data available.
      </Alert>
    );
  }

  const getStatusColor = (status: boolean) => {
    return status ? 'success' : 'error';
  };

  const getStatusIcon = (status: boolean) => {
    return status ? <CheckIcon /> : <ErrorIcon />;
  };

  const formatMemory = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <Grid container spacing={3}>
      {/* System Overview */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <SpeedIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" component="div">
                System Status
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" component="div" color="primary">
                  {systemStatus.system.initialized ? 'Online' : 'Offline'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Uptime: {formatUptime(systemStatus.system.uptime)}
                </Typography>
              </Box>
              <Chip
                icon={getStatusIcon(systemStatus.system.initialized)}
                label={systemStatus.system.initialized ? 'Healthy' : 'Error'}
                color={getStatusColor(systemStatus.system.initialized)}
                variant="outlined"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Smart Card Reader */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <CardIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" component="div">
                Smart Card
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" component="div" color="primary">
                  {systemStatus.ageVerification.smartCardReader.connected ? 'Connected' : 'Disconnected'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {systemStatus.ageVerification.smartCardReader.readerName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Card: {systemStatus.ageVerification.smartCardReader.cardPresent ? 'Present' : 'None'}
                </Typography>
              </Box>
              <Chip
                icon={getStatusIcon(systemStatus.ageVerification.smartCardReader.connected)}
                label={systemStatus.ageVerification.smartCardReader.connected ? 'Ready' : 'Error'}
                color={getStatusColor(systemStatus.ageVerification.smartCardReader.connected)}
                variant="outlined"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Biometric System */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <FaceIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" component="div">
                Biometric
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" component="div" color="primary">
                  {systemStatus.ageVerification.biometricVerifier.initialized ? 'Active' : 'Inactive'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Confidence: {(systemStatus.ageVerification.biometricVerifier.confidenceThreshold * 100).toFixed(0)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Models: {Object.values(systemStatus.ageVerification.biometricVerifier.models).filter(m => m.loaded).length}/3
                </Typography>
              </Box>
              <Chip
                icon={getStatusIcon(systemStatus.ageVerification.biometricVerifier.initialized)}
                label={systemStatus.ageVerification.biometricVerifier.initialized ? 'Ready' : 'Error'}
                color={getStatusColor(systemStatus.ageVerification.biometricVerifier.initialized)}
                variant="outlined"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* MDB Communication */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <RouterIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" component="div">
                MDB Protocol
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" component="div" color="primary">
                  {systemStatus.ageVerification.mdbCommunicator.connected ? 'Connected' : 'Disconnected'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Port: {systemStatus.ageVerification.mdbCommunicator.port}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Baud: {systemStatus.ageVerification.mdbCommunicator.baudRate}
                </Typography>
              </Box>
              <Chip
                icon={getStatusIcon(systemStatus.ageVerification.mdbCommunicator.connected)}
                label={systemStatus.ageVerification.mdbCommunicator.connected ? 'Online' : 'Offline'}
                color={getStatusColor(systemStatus.ageVerification.mdbCommunicator.connected)}
                variant="outlined"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Memory Usage */}
      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <MemoryIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" component="div">
                Memory Usage
              </Typography>
            </Box>
            <Box>
              <Typography variant="h4" component="div" color="primary">
                {formatMemory(systemStatus.system.memory.heapUsed)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Heap Used / {formatMemory(systemStatus.system.memory.heapTotal)} Total
              </Typography>
              <Typography variant="body2" color="text.secondary">
                RSS: {formatMemory(systemStatus.system.memory.rss)}
              </Typography>
              <Box mt={1}>
                <Typography variant="body2" color="text.secondary">
                  Usage: {((systemStatus.system.memory.heapUsed / systemStatus.system.memory.heapTotal) * 100).toFixed(1)}%
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Security Status */}
      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <SecurityIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" component="div">
                Security
              </Typography>
            </Box>
            <Box>
              <Typography variant="h4" component="div" color="primary">
                Secure
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Audit Logs: {systemStatus.ageVerification.securityManager.auditLogCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Failed Attempts: {systemStatus.ageVerification.securityManager.failedAttempts}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Locked Accounts: {systemStatus.ageVerification.securityManager.lockedAccounts}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* System Info */}
      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <CheckIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" component="div">
                System Info
              </Typography>
            </Box>
            <Box>
              <Typography variant="h4" component="div" color="primary">
                v{systemStatus.system.version}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Environment: {systemStatus.system.environment}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last Update: {new Date(systemStatus.timestamp).toLocaleTimeString()}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default SystemStatusCards;
