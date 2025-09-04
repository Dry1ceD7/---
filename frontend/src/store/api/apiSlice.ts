import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Define the base URL for the API
const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export interface SystemStatus {
  system: {
    initialized: boolean;
    uptime: number;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
    };
    cpu: {
      user: number;
      system: number;
    };
    timestamp: string;
    version: string;
    environment: string;
  };
  ageVerification: {
    initialized: boolean;
    smartCardReader: {
      connected: boolean;
      cardPresent: boolean;
      readerName: string;
      timeout: number;
    };
    biometricVerifier: {
      initialized: boolean;
      models: {
        faceDetection: { loaded: boolean; name: string };
        faceRecognition: { loaded: boolean; name: string };
        faceLandmark: { loaded: boolean; name: string };
      };
      confidenceThreshold: number;
      faceApi: string;
    };
    mdbCommunicator: {
      connected: boolean;
      initialized: boolean;
      port: string;
      baudRate: number;
      timeout: number;
    };
    securityManager: {
      initialized: boolean;
      auditLogCount: number;
      lockedAccounts: number;
      failedAttempts: number;
      policies: {
        maxLoginAttempts: number;
        lockoutDuration: number;
        sessionTimeout: number;
        passwordMinLength: number;
        requireSpecialChars: boolean;
        requireNumbers: boolean;
        requireUppercase: boolean;
      };
    };
  };
  timestamp: string;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  version: string;
  system: {
    initialized: boolean;
    uptime: number;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
    };
    cpu: {
      user: number;
      system: number;
    };
    timestamp: string;
    version: string;
    environment: string;
  };
}

export interface VerificationRequest {
  productCategory: string;
  productId: string;
  biometricData: {
    faceImage: string;
  };
}

export interface VerificationResponse {
  sessionId: string;
  success: boolean;
  authorized: boolean;
  age?: number;
  productCategory: string;
  processingTime: number;
  timestamp: string;
  error?: string;
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api`,
  }),
  tagTypes: ['SystemStatus', 'Health'],
  endpoints: (builder) => ({
    getSystemStatus: builder.query<SystemStatus, void>({
      query: () => '/status',
      providesTags: ['SystemStatus'],
    }),
    getHealth: builder.query<HealthStatus, void>({
      query: () => '/health',
      providesTags: ['Health'],
    }),
    verifyAge: builder.mutation<VerificationResponse, VerificationRequest>({
      query: (request) => ({
        url: '/verify-age',
        method: 'POST',
        body: request,
      }),
    }),
  }),
});

export const {
  useGetSystemStatusQuery,
  useGetHealthQuery,
  useVerifyAgeMutation,
} = apiSlice;
