import React, { createContext, useContext, useState, useEffect } from 'react';
import { z } from 'zod';
import { Preferences } from '@capacitor/preferences';

// Define Zod schema for User
const UserSchema = z.object({
  username: z.string().min(1),
  name: z.string(),
});

type User = z.infer<typeof UserSchema>;

interface AuthContextType {
  user: User | null;
  login: (username: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  error: string | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'moometrics_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { value } = await Preferences.get({ key: STORAGE_KEY });
        if (value) {
          const parsed = JSON.parse(value);
          const result = UserSchema.safeParse(parsed);
          if (result.success) {
            setUser(result.data);
          } else {
            console.warn('Corrupted user data found in storage, clearing.');
            await Preferences.remove({ key: STORAGE_KEY });
          }
        }
      } catch (e) {
        console.error('Failed to load user from storage', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (username: string) => {
    setError(null);
    try {
      if (!username || username.trim() === '') {
        throw new Error('Username cannot be empty');
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      const newUser = { username, name: username };

      const result = UserSchema.safeParse(newUser);
      if (!result.success) {
        throw new Error('Invalid user data generated');
      }

      setUser(result.data);
      await Preferences.set({
        key: STORAGE_KEY,
        value: JSON.stringify(result.data)
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      console.error('Login error:', err);
      setUser(null);
      await Preferences.remove({ key: STORAGE_KEY });
    }
  };

  const logout = async () => {
    setUser(null);
    setError(null);
    await Preferences.remove({ key: STORAGE_KEY });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, error, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
