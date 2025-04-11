import { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService, userService } from "../services/api";

// Create the auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      // Check if we have a token in localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        // No token, not authenticated
        setIsAuthenticated(false);
        setIsLoading(false);
        
        // If on a protected route, redirect to login
        if (!window.location.pathname.includes('/login') && 
            !window.location.pathname.includes('/register') &&
            !window.location.pathname.includes('/startup')) {
          navigate('/login');
        }
        return;
      }
      
      try {
        setIsLoading(true);
        const response = await authService.getCurrentUser();
        
        // Extract user data from response - the server returns {success, data}
        const userData = response.data || response;
        
        setUser(userData);
        setIsAuthenticated(true);
        
        // Store username in localStorage for the homepage
        if (userData && userData.name) {
          localStorage.setItem('username', userData.name);
        }
        
        // Handle routing based on current path and startup status
        const hasCompletedStartup = localStorage.getItem('hasCompletedStartup') === 'true';
        const currentPath = window.location.pathname;
        
        // If user is on login or register page, redirect them appropriately
        if (currentPath === '/login' || currentPath === '/register') {
          if (hasCompletedStartup) {
            navigate('/home');
          } else {
            navigate('/startup');
          }
        }
        // If user is on startup page but has already completed it, redirect to home
        else if (currentPath === '/startup' && hasCompletedStartup) {
          navigate('/home');
        }
        // If user is on root path, redirect appropriately
        else if (currentPath === '/') {
          if (hasCompletedStartup) {
            navigate('/home');
          } else {
            navigate('/startup');
          }
        }
      } catch (err) {
        // Token is invalid or expired
        console.error("Auth status check failed:", err);
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setUser(null);
        setIsAuthenticated(false);
        
        // If on a protected route, redirect to login
        if (!window.location.pathname.includes('/login') && 
            !window.location.pathname.includes('/register') &&
            !window.location.pathname.includes('/startup')) {
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [navigate]);

  // Register a new user
  const register = async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.register(userData);
      
      // Ensure response has expected structure
      if (!response.success) {
        throw new Error('Registration failed: Invalid response from server');
      }
      
      // Store token
      if (response.token) {
        localStorage.setItem('token', response.token);
      } else {
        throw new Error('No token received from server');
      }
      
      // Get user from response
      if (!response.user) {
        throw new Error('No user data received from server');
      }
      
      setUser(response.user);
      setIsAuthenticated(true);
      
      // Store username
      const username = response.user.name;
      if (username) {
        localStorage.setItem('username', username);
      }
      
      // Mark as new user who hasn't completed startup
      localStorage.removeItem('hasCompletedStartup');
      
      navigate("/startup");
      return response;
    } catch (err) {
      console.error("Register error details:", err); // More detailed error logging
      setError(err.message || "Registration failed. Please try again.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Login user
  const login = async (credentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.login(credentials);
      
      // Ensure response has expected structure
      if (!response.success) {
        throw new Error(response.message || 'Login failed: Invalid response from server');
      }
      
      // Store token
      if (response.token) {
        localStorage.setItem('token', response.token);
      } else {
        throw new Error('No token received from server');
      }
      
      // Get user from response
      if (!response.user) {
        throw new Error('No user data received from server');
      }
      
      setUser(response.user);
      setIsAuthenticated(true);
      
      // Store username
      const username = response.user.name;
      if (username) {
        localStorage.setItem('username', username);
      }
      
      // Check if user has completed startup before
      const hasCompletedStartup = localStorage.getItem('hasCompletedStartup');
      
      // Only redirect to startup if user is new
      if (hasCompletedStartup === 'true') {
        navigate("/home");
      } else {
        navigate("/startup");
      }
      
      return response;
    } catch (err) {
      console.error("Login error details:", err); // More detailed error logging
      
      // Pass along the specific error message from the API or service
      let errorMessage = err.message;
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
      throw err; // Rethrow the error to be caught by the login component
    } finally {
      setIsLoading(false);
    }
  };

  // Login with Google
  const googleLogin = async (token) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.googleLogin(token);
      
      // Ensure response has expected structure
      if (!response.success) {
        throw new Error('Google login failed: Invalid response from server');
      }
      
      // Store token
      if (response.token) {
        localStorage.setItem('token', response.token);
      } else {
        throw new Error('No token received from server');
      }
      
      // Get user from response
      if (!response.user) {
        throw new Error('No user data received from server');
      }
      
      setUser(response.user);
      setIsAuthenticated(true);
      
      // Store username
      const username = response.user.name;
      if (username) {
        localStorage.setItem('username', username);
      }
      
      // Check if user has completed startup before
      const hasCompletedStartup = localStorage.getItem('hasCompletedStartup');
      
      // Only redirect to startup if user is new
      if (hasCompletedStartup === 'true') {
        navigate("/home");
      } else {
        navigate("/startup");
      }
      
      return response;
    } catch (err) {
      console.error("Google login error details:", err); // More detailed error logging
      setError(err.message || "Google login failed. Please try again.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      setIsLoading(true);
      
      await authService.logout();

      // Clear all auth data
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      setUser(null);
      setIsAuthenticated(false);
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
      
      // Clear data anyway on error
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      setUser(null);
      setIsAuthenticated(false);
      setError(err.message);
      navigate("/login");
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await userService.updateProfile(profileData);
      
      setUser(prevUser => ({...prevUser, ...response.data}));
      if (profileData.name) {
        localStorage.setItem('username', profileData.name);
      }
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        register,
        googleLogin,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 