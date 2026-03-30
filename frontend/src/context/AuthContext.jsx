import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Authentication Context
 * Manages user authentication state using secure httpOnly cookies
 */

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userEmail, setUserEmail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch current user info from server
   * The server reads the auth_token cookie automatically
   */
  const fetchUserInfo = async () => {
    try {
      setIsLoading(true);
      console.log('🔐 [Auth] Fetching user info from /api/auth/me...');
      
      const response = await fetch('http://127.0.0.1:5000/api/auth/me', {
        credentials: 'include', // Include the httpOnly cookie
      });

      console.log('🔐 [Auth] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🔐 [Auth] Received user data:', data);
        setUserEmail(data.email);
        setError(null);
      } else if (response.status === 401) {
        // Not authenticated
        console.log('🔐 [Auth] User not authenticated (401)');
        setUserEmail(null);
        setError(null);
      } else {
        console.error('🔐 [Auth] Unexpected status:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('🔐 [Auth] Response error:', errorText);
        throw new Error(`Failed to fetch user info: ${response.statusText}`);
      }
    } catch (err) {
      console.error('❌ [Auth] Error fetching user info:', err.message);
      setError(err.message);
      setUserEmail(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check authentication status on app load
   */
  useEffect(() => {
    fetchUserInfo();
  }, []);

  /**
   * Check auth status when URL changes (after OAuth callback)
   */
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const authSuccess = searchParams.get('auth') === 'success';
    const authError = searchParams.get('auth') === 'error';

    if (authSuccess) {
      console.log('✅ [Auth] OAuth callback successful, fetching user info...');
      // Clear the URL params
      window.history.replaceState({}, document.title, window.location.pathname);
      // Fetch user info after successful auth
      fetchUserInfo();
    } else if (authError) {
      console.error('❌ [Auth] OAuth callback failed');
      setError('Authentication failed. Please try again.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  /**
   * Logout - clear the server-side session
   */
  const logout = async () => {
    try {
      await fetch('http://127.0.0.1:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setUserEmail(null);
      setError(null);
    } catch (err) {
      console.error('❌ [Auth] Logout error:', err.message);
      setError(err.message);
    }
  };

  return (
    <AuthContext.Provider value={{ userEmail, isLoading, error, logout, fetchUserInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
