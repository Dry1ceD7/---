import React, { useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Container,
  Grid,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  MonitorHeart as MonitorIcon,
  Settings as SettingsIcon,
  BarChart as AnalyticsIcon,
  Assessment as ReportsIcon,
  People as UsersIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { toggleSidebar, setCurrentPage, setSidebarOpen } from '../../store/slices/uiSlice';
import SystemStatusCards from './SystemStatusCards';
import RealTimeCharts from './RealTimeCharts';
import RecentTransactions from './RecentTransactions';

const drawerWidth = 240;

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  const { sidebarOpen, currentPage } = useSelector((state: RootState) => state.ui);

  const handleDrawerToggle = () => {
    dispatch(toggleSidebar());
  };

  const handlePageChange = (page: string) => {
    dispatch(setCurrentPage(page));
    if (isMobile) {
      dispatch(setSidebarOpen(false));
    }
  };

  useEffect(() => {
    if (isMobile) {
      dispatch(setSidebarOpen(false));
    }
  }, [isMobile, dispatch]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'monitoring', label: 'Monitoring', icon: <MonitorIcon /> },
    { id: 'analytics', label: 'Analytics', icon: <AnalyticsIcon /> },
    { id: 'reports', label: 'Reports', icon: <ReportsIcon /> },
    { id: 'users', label: 'Users', icon: <UsersIcon /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
  ];

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Vending Control
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem
            key={item.id}
            onClick={() => handlePageChange(item.id)}
            sx={{
              cursor: 'pointer',
              backgroundColor: currentPage === item.id ? 'action.selected' : 'transparent',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <SystemStatusCards />
              </Grid>
              <Grid item xs={12} lg={8}>
                <RealTimeCharts />
              </Grid>
              <Grid item xs={12} lg={4}>
                <RecentTransactions />
              </Grid>
            </Grid>
          </Container>
        );
      case 'monitoring':
        return (
          <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              System Monitoring
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Detailed system monitoring interface coming soon...
            </Typography>
          </Container>
        );
      case 'analytics':
        return (
          <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              Analytics Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Advanced analytics and insights coming soon...
            </Typography>
          </Container>
        );
      case 'reports':
        return (
          <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              Reports
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Compliance and usage reports coming soon...
            </Typography>
          </Container>
        );
      case 'users':
        return (
          <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              User Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              User administration interface coming soon...
            </Typography>
          </Container>
        );
      case 'settings':
        return (
          <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              System Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Configuration management interface coming soon...
            </Typography>
          </Container>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${sidebarOpen ? drawerWidth : 0}px)` },
          ml: { md: sidebarOpen ? `${drawerWidth}px` : 0 },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Advanced Vending Machine Age Verification System
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="navigation menu"
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'persistent'}
          open={sidebarOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${sidebarOpen ? drawerWidth : 0}px)` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar />
        {renderContent()}
      </Box>
    </Box>
  );
};

export default Dashboard;
