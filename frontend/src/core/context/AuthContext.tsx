import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import contractionApi, { setAuthToken } from '../../features/contraction-monitoring/api/contractionApi';
import { getIsOfflineMode } from '../config/api';

const TOKEN_KEY = '@maternalink_auth_token';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  age?: number;
  role: string;
}

export interface PregnancyProfile {
  id?: string;
  userId?: string;
  pregnancyWeek?: number;
  trimester?: number;
  expectedDeliveryDate?: string;
  weight?: number;
  bloodGroup?: string;
  gestationalAgeWeeks?: number;
  dueDate?: string;
  doctorName?: string;
  emergencyContact?: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  profile: PregnancyProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setProfile: React.Dispatch<React.SetStateAction<PregnancyProfile | null>>;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  age?: number;
  gestationalAgeWeeks?: number;
  dueDate?: string;
  doctorName?: string;
  emergencyContact?: string;
}

const MOCK_USER: UserProfile = {
  id: 'mock-user-id',
  email: 'test@maternalink.com',
  name: 'Test Mother',
  age: 28,
  role: 'user',
};

const MOCK_PROFILE: PregnancyProfile = {
  pregnancyWeek: 28,
  trimester: 3,
  gestationalAgeWeeks: 28,
  expectedDeliveryDate: '2026-09-15',
  dueDate: '2026-09-15',
  weight: 65,
  bloodGroup: 'O+',
  doctorName: 'Dr. Jane Smith',
  emergencyContact: '+123456789',
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState<PregnancyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const offlineMode = await getIsOfflineMode();
    if (offlineMode) {
      setUser(MOCK_USER);
      setProfile(MOCK_PROFILE);
    } else {
      try {
        const data = await contractionApi.getProfile();
        setUser(data.user);
        setProfile(data.profile);
      } catch (error) {
        console.error('Error refreshing profile:', error);
      }
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const offlineMode = await getIsOfflineMode();
        if (offlineMode) {
          // Auto-authenticate with mock user for offline testing
          setUser(MOCK_USER);
          setProfile(MOCK_PROFILE);
        } else {
          const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
          if (storedToken) {
            setAuthToken(storedToken);
            await refreshProfile();
          }
        }
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY);
        setAuthToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    const offlineMode = await getIsOfflineMode();
    if (offlineMode) {
      await AsyncStorage.setItem(TOKEN_KEY, 'mock-token');
      setUser({ ...MOCK_USER, email: email || MOCK_USER.email });
      setProfile(MOCK_PROFILE);
    } else {
      const data = await contractionApi.login({ email, password });
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      setProfile(data.profile);
    }
  };

  const register = async (payload: RegisterPayload) => {
    const offlineMode = await getIsOfflineMode();
    if (offlineMode) {
      await AsyncStorage.setItem(TOKEN_KEY, 'mock-token');
      setUser({ ...MOCK_USER, email: payload.email, name: payload.name });
      setProfile({
        ...MOCK_PROFILE,
        gestationalAgeWeeks: payload.gestationalAgeWeeks ?? MOCK_PROFILE.gestationalAgeWeeks,
        dueDate: payload.dueDate ?? MOCK_PROFILE.dueDate,
        doctorName: payload.doctorName ?? MOCK_PROFILE.doctorName,
        emergencyContact: payload.emergencyContact ?? MOCK_PROFILE.emergencyContact,
      });
    } else {
      const data = await contractionApi.register(payload);
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      setProfile(data.profile);
    }
  };

  const logout = async () => {
    contractionApi.logout();
    await AsyncStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshProfile,
        setProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
