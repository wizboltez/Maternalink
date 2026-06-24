import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import contractionApi, { setAuthToken } from '../../features/contraction-monitoring/api/contractionApi';

const TOKEN_KEY = '@maternalink_auth_token';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  age: number;
  role: string;
}

export interface PregnancyProfile {
  id?: string;
  userId?: string;
  pregnancyWeek: number;
  trimester: number;
  expectedDeliveryDate: string;
  weight: number;
  bloodGroup: string;
  gestationalAgeWeeks?: number; // Backwards compatibility
  dueDate?: string; // Backwards compatibility
  doctorName?: string; // Backwards compatibility
  emergencyContact?: string; // Backwards compatibility
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
  age: number;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState<PregnancyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const data = await contractionApi.getProfile();
      setUser(data.user);
      setProfile(data.profile);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        if (storedToken) {
          setAuthToken(storedToken);
          await refreshProfile();
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
    const data = await contractionApi.login({ email, password });
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    setProfile(data.profile);
  };

  const register = async (payload: RegisterPayload) => {
    const data = await contractionApi.register(payload);
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    setProfile(data.profile); // Will be null initially
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
