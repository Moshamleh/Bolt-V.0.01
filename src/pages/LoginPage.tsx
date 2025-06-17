import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Mail, Loader2, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  useEffect(() => {
    let timeoutId: number;
    if (error) {
      timeoutId = window.setTimeout(() => {
        setError(null);
      }, 3000);
    }
    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [error]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if this is the first login
      const { data: loginHistory } = await supabase
        .from('user_logins')
        .select('id')
        .eq('user_id', session?.user.id)
        .limit(1);

      if (!loginHistory?.length) {
        setShowDisclaimer(true);
        // Record the login
        await supabase
          .from('user_logins')
          .insert({ user_id: session?.user.id });
          
        // Set initial_setup_complete to false to trigger onboarding
        await supabase
          .from('profiles')
          .update({ initial_setup_complete: false })
          .eq('id', session?.user.id);
      } else {
        // Check if profile is complete
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, username, initial_setup_complete')
          .eq('id', session?.user.id)
          .single();

        if (!profile) {
          // No profile exists, redirect to profile setup
          navigate('/profile-setup');
        } else if (!profile.full_name || !profile.username) {
          // Profile exists but is incomplete, redirect to profile setup
          navigate('/profile-setup');
        } else if (profile.initial_setup_complete === false) {
          // Profile is complete but vehicle setup is not, redirect to vehicle setup
          navigate('/vehicle-setup');
        } else {
          // Everything is complete, redirect to main app
          navigate('/diagnostic');
        }
      }
    } catch (err: any) {
      setError('Login failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            initial_setup_complete: false // Set this for new users
          }
        }
      });

      if (error) throw error;
      setError('Check your email for the confirmation link.');
    } catch (err: any) {
      setError('Sign up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast.success('Password reset instructions sent to your email');
    } catch (err) {
      setError('Failed to send reset instructions. Please try again.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/profile-setup`
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Google sign in failed:', err);
      setError('Failed to sign in with Google');
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsAppleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/profile-setup`
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Apple sign in failed:', err);
      setError('Failed to sign in with Apple');
      setIsAppleLoading(false);
    }
  };

  const handleAcceptDisclaimer = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Mark initial setup as incomplete to trigger the profile setup flow
        await supabase
          .from('profiles')
          .update({ initial_setup_complete: false })
          .eq('id', user.id);
      }
      
      setShowDisclaimer(false);
      navigate('/profile-setup');
    } catch (error) {
      console.error('Error updating profile:', error);
      // Navigate anyway even if there's an error
      setShowDisclaimer(false);
      navigate('/profile-setup');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-neutral-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white mb-4">
            <Zap className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">Bolt Auto</h1>
          <p className="text-lg text-neutral-600 dark:text-gray-400">Your Personal AI Mechanic</p>
        </div>

        <div className="bg-neutral-100 dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-neutral-600 dark:text-gray-400 mb-8">
              Sign in or create an account to get started
            </p>
          </div>

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-3 border border-neutral-300 dark:border-gray-600 rounded-lg text-neutral-700 dark:text-gray-300 bg-neutral-100 dark:bg-gray-700 hover:bg-neutral-200 dark:hover:bg-gray-600 transition-colors"
          >
            {isGoogleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <svg className="h-5 w-5\" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Apple Sign In Button */}
          <button
            onClick={handleAppleSignIn}
            disabled={isAppleLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-6 border border-neutral-300 dark:border-gray-600 rounded-lg text-neutral-700 dark:text-gray-300 bg-neutral-100 dark:bg-gray-700 hover:bg-neutral-200 dark:hover:bg-gray-600 transition-colors"
          >
            {isAppleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <svg className="h-5 w-5\" viewBox="0 0 24 24\" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.55-2.09-.56-3.24 0-1.44.71-2.23.51-3.08-.35-4.06-4.16-3.61-10.11.82-10.33 1.17.08 2.19.71 2.93.71.7 0 2.02-.71 3.39-.71 1.94.14 3.25.99 4.14 2.5-3.61 2.07-3.03 6.69.52 7.83-.46 1.26-.98 2.5-2.4 4zM14.25 6.55c-.85-1.04-2.11-1.78-3.25-1.76-.16-1.44.52-2.95 1.54-3.89 1.08-.95 2.41-1.54 3.46-1.4.14 1.44-.38 2.95-1.4 3.89-.91.88-2.07 1.54-3.35 1.76z"/>
                </svg>
                Continue with Apple
              </>
            )}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-neutral-100 dark:bg-gray-800 text-neutral-500 dark:text-gray-400">Or continue with</span>
            </div>
          </div>

          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2 border border-neutral-300 dark:border-gray-600 placeholder-neutral-500 dark:placeholder-gray-400 text-neutral-900 dark:text-white bg-neutral-100 dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2 border border-neutral-300 dark:border-gray-600 placeholder-neutral-500 dark:placeholder-gray-400 text-neutral-900 dark:text-white bg-neutral-100 dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                  />
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-lg bg-red-50 dark:bg-red-900/50 p-4 border border-red-100 dark:border-red-800"
                >
                  <div className="text-sm text-red-700 dark:text-red-200">{error}</div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="relative flex-1 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Sign In'
                )}
              </button>
              <button
                type="button"
                onClick={handleSignUp}
                disabled={isLoading}
                className="relative flex-1 flex justify-center py-2 px-4 border border-neutral-300 dark:border-gray-600 text-sm font-medium rounded-lg text-neutral-700 dark:text-gray-300 bg-neutral-100 dark:bg-gray-700 hover:bg-neutral-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Sign Up'
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={isResettingPassword}
              className="w-full text-center text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            >
              {isResettingPassword ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                'Forgot your password?'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* First Login Disclaimer Modal */}
      <AnimatePresence>
        {showDisclaimer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-100 dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">
                    Welcome to Bolt Auto
                  </h3>
                </div>
                <button
                  onClick={() => setShowDisclaimer(false)}
                  className="text-neutral-400 dark:text-gray-500 hover:text-neutral-500 dark:hover:text-gray-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-neutral-600 dark:text-gray-400 mb-6">
                By using Bolt Auto, you accept our Terms and understand that
                AI-generated responses may not always be accurate. Always verify
                critical information with a certified mechanic.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleAcceptDisclaimer}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  I Understand
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;