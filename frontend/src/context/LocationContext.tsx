import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { z } from 'zod';
import { Preferences } from '@capacitor/preferences';

// Define Zod schema for runtime validation
const LocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  name: z.string().optional(),
  source: z.enum(['browser', 'manual', 'default']),
});

type Location = z.infer<typeof LocationSchema>;

interface LocationContextType {
  location: Location | null;
  setManualLocation: (lat: number, lon: number, name?: string) => void;
  requestBrowserLocation: () => void;
  isLoading: boolean;
  error: string | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const STORAGE_KEY = 'moometrics_location';

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isMounted = useRef(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    isMounted.current = true;

    const loadSavedLocation = async () => {
      try {
        const { value } = await Preferences.get({ key: STORAGE_KEY });
        if (value) {
          const parsed = JSON.parse(value);
          const result = LocationSchema.safeParse(parsed);
          if (result.success) {
            setLocation(result.data);
            setIsLoading(false);
            return;
          }
        }
        // If no saved location, request browser location
        requestBrowserLocation();
      } catch (e) {
        console.error('Failed to load location from storage', e);
        requestBrowserLocation();
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    };

    loadSavedLocation();

    return () => {
      isMounted.current = false;
    };
  }, []);

  const requestBrowserLocation = () => {
    if (!navigator.geolocation) {
      if (isMounted.current) {
        setError('Geolocation is not supported by your browser');
        const defaultLoc: Location = {
          latitude: 40.7128,
          longitude: -74.006,
          name: 'Default Location',
          source: 'default',
        };
        saveLocation(defaultLoc);
      }
      return;
    }

    if (isMounted.current) {
      setIsLoading(true);
      setError(null);
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isMounted.current) return;

        const newLocation: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          name: 'Current Location',
          source: 'browser',
        };
        saveLocation(newLocation);
        setIsLoading(false);
      },
      (err) => {
        if (!isMounted.current) return;

        setError(`Location access denied: ${err.message}`);
        setIsLoading(false);
        const defaultLoc: Location = {
          latitude: 40.7128,
          longitude: -74.006,
          name: 'Default Location',
          source: 'default',
        };
        saveLocation(defaultLoc);
      }
    );
  };

  const saveLocation = async (loc: Location) => {
    setLocation(loc);
    await Preferences.set({
      key: STORAGE_KEY,
      value: JSON.stringify(loc)
    });
  };

  const setManualLocation = async (lat: number, lon: number, name?: string) => {
    const newLocation: Location = {
      latitude: lat,
      longitude: lon,
      name: name || 'Manual Location',
      source: 'manual',
    };

    const result = LocationSchema.safeParse(newLocation);
    if (!result.success) {
      console.error('Attempted to set invalid location', result.error);
      if (isMounted.current) setError('Internal Error: Invalid location data');
      return;
    }

    if (isMounted.current) {
      await saveLocation(result.data);
      setError(null);
    }
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        setManualLocation,
        requestBrowserLocation,
        isLoading,
        error,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
