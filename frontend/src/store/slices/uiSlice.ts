import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  currentPage: string;
  loading: boolean;
  notifications: boolean;
}

const initialState: UiState = {
  sidebarOpen: true,
  theme: 'light',
  currentPage: 'dashboard',
  loading: false,
  notifications: true,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<string>) => {
      state.currentPage = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    toggleNotifications: (state) => {
      state.notifications = !state.notifications;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  setCurrentPage,
  setLoading,
  toggleNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;
