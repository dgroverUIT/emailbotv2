import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, LogOut, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface AuthButtonProps {
  isAuthenticated: boolean;
  onAuthChange: () => void;
}

export function AuthButton({ isAuthenticated, onAuthChange }: AuthButtonProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            email_confirm: true // Skip email confirmation
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error('An account with this email already exists. Please sign in instead.');
          setIsSignUp(false);
        } else {
          throw error;
        }
        return;
      }

      if (data.user) {
        toast.success('Account created successfully! Please sign in.');
        setIsSignUp(false); // Switch to sign in mode
        // Don't clear the form so the user can sign in right away
      } else {
        throw new Error('Failed to create account');
      }
    } catch (error) {
      console.error('Error during sign up:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please try again.');
        }
        throw error;
      }

      if (data.user) {
        toast.success('Signed in successfully');
        onAuthChange();
        setShowAuthModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error during sign in:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Signed out successfully');
      onAuthChange();
    } catch (error) {
      console.error('Error during sign out:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sign out');
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setShowAuthModal(false);
  };

  return (
    <>
      <button
        onClick={isAuthenticated ? handleSignOut : () => setShowAuthModal(true)}
        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
      >
        {isAuthenticated ? (
          <>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </>
        ) : (
          <>
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </>
        )}
      </button>

      {showAuthModal && !isAuthenticated && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {isSignUp ? 'Create Account' : 'Sign In'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="••••••"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Password must be at least 6 characters long
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !email || password.length < 6}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setPassword(''); // Clear password when switching modes
                  }}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  {isSignUp
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}