import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Define the shape of our auth context
interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  error: null,
  signOut: async () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component that wraps the app and makes auth object available to any child component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Get the initial session
    const getInitialSession = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        setSession(data.session);
        setUser(data.session?.user || null);
      } catch (error) {
        console.error('Error getting initial session:', error);
        setError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    // Clean up the subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign out function
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
    }
  };

  // The value that will be provided to consumers of this context
  const value = {
    session,
    user,
    loading,
    error,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};