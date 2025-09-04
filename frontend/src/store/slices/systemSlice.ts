import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SystemState {
  isConnected: boolean;
  lastUpdate: string | null;
  alerts: Alert[];
  selectedMachine: string | null;
}

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: string;
  read: boolean;
}

const initialState: SystemState = {
  isConnected: false,
  lastUpdate: null,
  alerts: [],
  selectedMachine: null,
};

const systemSlice = createSlice({
  name: 'system',
  initialState,
  reducers: {
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    updateLastUpdate: (state, action: PayloadAction<string>) => {
      state.lastUpdate = action.payload;
    },
    addAlert: (state, action: PayloadAction<Omit<Alert, 'id' | 'timestamp' | 'read'>>) => {
      const alert: Alert = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false,
      };
      state.alerts.unshift(alert);
      // Keep only last 50 alerts
      if (state.alerts.length > 50) {
        state.alerts = state.alerts.slice(0, 50);
      }
    },
    markAlertRead: (state, action: PayloadAction<string>) => {
      const alert = state.alerts.find(a => a.id === action.payload);
      if (alert) {
        alert.read = true;
      }
    },
    clearAlerts: (state) => {
      state.alerts = [];
    },
    selectMachine: (state, action: PayloadAction<string | null>) => {
      state.selectedMachine = action.payload;
    },
  },
});

export const {
  setConnectionStatus,
  updateLastUpdate,
  addAlert,
  markAlertRead,
  clearAlerts,
  selectMachine,
} = systemSlice.actions;

export default systemSlice.reducer;
