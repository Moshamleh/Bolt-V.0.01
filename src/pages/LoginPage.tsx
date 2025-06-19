import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { KeyRound, Mail, Loader2, Zap, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase, signUp, updateProfile } from '../lib/supabase';
import WelcomeModal from '../components/WelcomeModal';
import { extractErrorMessage } from '../lib/errorHandling';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [userName, setUserName] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [invitedBy, setInvitedBy] = useState<string | null>(null);

  useEffect(() => {
    // Check for referral in URL
    const params = new URLSearchParams(location.search);
    const referrerId = params.get('invited_by');
    
    if (referrerId) {
      // Store the referrer ID in session storage
      sessionStorage.setItem('invitedBy', referrerId);
      setInvitedBy(referrerId);
    } else {
      // Check if we have a stored referrer ID
      const storedReferrerId = sessionStorage.getItem('invitedBy');
      if (storedReferrerId) {
        setInvitedBy(storedReferrerId);
      }
    }
  }, [location]);

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
        // Record the login
        await supabase
          .from('user_logins')
          .insert({ user_id: session?.user.id });
          
        // Get user's name if available
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, username')
          .eq('id', session?.user.id)
          .single();
          
        if (profile) {
          setUserName(profile.full_name || profile.username || '');
        }
        
        // Show welcome modal instead of disclaimer
        setShowWelcomeModal(true);
      } else {
        // Check if user has completed initial setup
        const { data: profile } = await supabase
          .from('profiles')
          .select('initial_setup_complete')
          .eq('id', session?.user.id)
          .single();
        
        if (!profile) {
          // No profile exists, redirect to profile setup
          navigate('/profile-setup');
        } else if (profile.initial_setup_complete === false) {
          // Profile exists but setup not complete, redirect to vehicle setup
          navigate('/vehicle-setup');
        } else {
          // Setup complete, go to main app
          navigate('/diagnostic');
        }
      }
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Use the signUp function with the invitedBy parameter
      const { error } = await signUp(email, password, invitedBy || undefined);

      if (error) throw error;
      setError('Check your email for the confirmation link.');
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
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
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
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
          redirectTo: `${window.location.origin}/profile-setup`,
          queryParams: invitedBy ? { invited_by: invitedBy } : undefined
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Google sign in failed:', err);
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsAppleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/profile-setup`,
          queryParams: invitedBy ? { invited_by: invitedBy } : undefined
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Apple sign in failed:', err);
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      setIsAppleLoading(false);
    }
  };

  const handleSetupVehicle = async () => {
    try {
      // Update profile to mark initial_setup_complete as false
      await updateProfile({ initial_setup_complete: false });
      
      // Navigate to profile setup
      navigate('/profile-setup');
    } catch (error) {
      console.error('Error during setup:', error);
      // Navigate anyway even if there's an error
      navigate('/profile-setup');
    }
  };

  const handleExploreMarketplace = async () => {
    try {
      // Update profile to mark initial_setup_complete as true
      await updateProfile({ initial_setup_complete: true });
      
      // Navigate to marketplace
      navigate('/marketplace');
    } catch (error) {
      console.error('Error during setup:', error);
      // Navigate anyway even if there's an error
      navigate('/marketplace');
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-800 dark:from-gray-900 dark:to-blue-900 p-4">
      <div className="w-full max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white dark:bg-gray-800 shadow-lg mb-6">
            <Zap className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Bolt Auto</h1>
          <p className="text-lg text-blue-100 dark:text-gray-300">Your Personal AI Mechanic</p>
          
          {invitedBy && (
            <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 inline-block">
              <p className="text-white text-sm">
                You've been invited to join Bolt Auto! 🎉
              </p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              {isSignUp ? 'Create an Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {isSignUp 
                ? 'Sign up to get started with Bolt Auto' 
                : 'Sign in to continue to your account'}
            </p>
          </div>

          {/* Social Sign In Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm"
            >
              {isGoogleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
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

            <button
              onClick={handleAppleSignIn}
              disabled={isAppleLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm"
            >
              {isAppleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.55-2.09-.56-3.24 0-1.44.71-2.23.51-3.08-.35-4.06-4.16-3.61-10.11.82-10.33 1.17.08 2.19.71 2.93.71.7 0 2.02-.71 3.39-.71 1.94.14 3.25.99 4.14 2.5-3.61 2.07-3.03 6.69.52 7.83-.46 1.26-.98 2.5-2.4 4zM14.25 6.55c-.85-1.04-2.11-1.78-3.25-1.76-.16-1.44.52-2.95 1.54-3.89 1.08-.95 2.41-1.54 3.46-1.4.14 1.44-.38 2.95-1.4 3.89-.91.88-2.07 1.54-3.35 1.76z"/>
                  </svg>
                  Continue with Apple
                </>
              )}
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                  />
                </div>
              </div>
            </div>

            {!isSignUp && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Remember me
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isResettingPassword}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                >
                  {isResettingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Forgot password?'
                  )}
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-xl bg-red-50 dark:bg-red-900/30 p-4 border border-red-100 dark:border-red-800"
                >
                  <div className="flex items-center text-sm text-red-700 dark:text-red-200">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                isSignUp ? 'Sign Up' : 'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-blue-200 dark:text-gray-400 mt-8"
        >
          By signing in, you agree to our Terms of Service and Privacy Policy
        </motion.p>
      </div>

      {/* Welcome Modal for new users */}
      <WelcomeModal 
        isOpen={showWelcomeModal}
        onExploreMarketplace={handleExploreMarketplace}
        onSetupVehicle={handleSetupVehicle}
        userName={userName}
      />
    </div>
  );
};

export default LoginPage;