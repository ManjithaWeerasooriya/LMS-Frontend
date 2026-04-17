'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

import { getStoredAuthToken } from '@/lib/auth';
import { getMyProfile, type UserProfile } from '@/features/account/api/user';

type CurrentUserProfileContextValue = {
  profile: UserProfile | null;
  setProfile: Dispatch<SetStateAction<UserProfile | null>>;
  refreshProfile: () => Promise<UserProfile | null>;
  isLoading: boolean;
  error: string | null;
};

const defaultContextValue: CurrentUserProfileContextValue = {
  profile: null,
  setProfile: () => undefined,
  refreshProfile: async () => null,
  isLoading: false,
  error: null,
};

const CurrentUserProfileContext = createContext<CurrentUserProfileContextValue>(defaultContextValue);

export function CurrentUserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = async () => {
    const token = getStoredAuthToken();
    if (!token) {
      setProfile(null);
      setError(null);
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);

    try {
      const data = await getMyProfile();
      setProfile(data);
      setError(null);
      return data;
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load profile.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      const token = getStoredAuthToken();
      if (!token) {
        if (!active) return;
        setProfile(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const data = await getMyProfile();
        if (!active) return;
        setProfile(data);
        setError(null);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load profile.');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  return (
    <CurrentUserProfileContext.Provider
      value={{
        profile,
        setProfile,
        refreshProfile,
        isLoading,
        error,
      }}
    >
      {children}
    </CurrentUserProfileContext.Provider>
  );
}

export function useCurrentUserProfile() {
  return useContext(CurrentUserProfileContext);
}
