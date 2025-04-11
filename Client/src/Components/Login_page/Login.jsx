import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newUser, setNewUser] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerError, setRegisterError] = useState("");
  
  const { login, register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    
    try {
      if (newUser) {
        if (!name) {
          throw new Error("Name is required");
        }
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters");
        }
        
        await register({ name, email, password });
      } else {
        await login({ email, password });
      }
    } catch (err) {
      console.error("Authentication error:", err);
      let errorMsg;
      if (err.response?.data) {
        errorMsg = err.response.data.error || err.response.data.message;
      } 
      // Check if the error is coming from our API service or AuthContext
      else if (err.message) {
        errorMsg = err.message;
      }
      
      // If all else fails, provide a generic message
      if (!errorMsg || errorMsg.includes("Login failed") || errorMsg.includes("failed")) {
        errorMsg = "Authentication failed. Please check your credentials and try again.";
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // This is a placeholder for Google OAuth login
    // In a real implementation, you would use Google's OAuth library
    alert("Google login is not implemented yet");
  };

  const toggleNewUser = () => {
    setNewUser(!newUser);
    setErrorMessage(""); // Clear errors when switching modes
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError("");
    
    if (password !== confirmPassword) {
      setRegisterError("Passwords do not match");
      return;
    }
    
    try {
      setIsLoading(true);
      // Call register method from AuthContext with user data
      const registerResponse = await register({ name, email, password });
      // Login automatically after registration
      const loginResponse = await login({ email, password });
      // Redirect handled by AuthContext
    } catch (err) {
      console.error("Registration error:", err);
      
      // Better error extraction from different possible error formats
      let errorMsg;
      
      // Check if the error has a response object with data (from axios)
      if (err.response?.data) {
        errorMsg = err.response.data.error || err.response.data.message;
      } 
      // Check if the error is coming from our API service or AuthContext
      else if (err.message) {
        errorMsg = err.message;
      }
      
      // If all else fails, provide a generic message
      if (!errorMsg || errorMsg.includes("Registration failed") || errorMsg.includes("failed")) {
        errorMsg = "Registration failed. Please try again with different credentials.";
      }
      
      setRegisterError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-gradient-to-br from-[#120E1B] to-[#5D1BE3]">
      {/* Brand Logo Animation - Outside the login container */}
      <div className="absolute top-8 left-8">
        <div className="brand-text">
          <h1 className="text-4xl font-bold text-white">Level UP ✨</h1>
          <h2 className="text-7xl font-bold gradient-text">Productivity</h2>
        </div>
      </div>

      {/* Login Container - Now with fixed dimensions */}
      <div className="flex-1 flex items-center justify-center">
        <div className="login-container w-[25vw] h-[70vh] bg-[#362f2f57] backdrop-blur-md rounded-xl shadow-2xl p-12 border border-[#ffffff20]">
          <div className="text-left mb-8">
            <h1 className="text-3xl font-bold text-white mb-1">{newUser ? "Sign up" : "Login"}</h1>
            <p className="text-gray-300 text-sm">using email</p>
          </div>

          {errorMessage && (
            <div className="bg-red-500 bg-opacity-20 border border-red-500 text-white px-4 py-2 rounded mb-4">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {newUser && (
              <div className="form-group">
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-1 py-2 bg-transparent text-white border-b border-[#5d1be380] focus:outline-none focus:border-[#5D1BE3] transition-all duration-300"
                  placeholder="Enter your name"
                  required={newUser}
                  autoComplete="name"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="autocomplete-input w-full px-1 py-2 bg-transparent text-white border-b border-[#5d1be380] focus:outline-none focus:border-[#5D1BE3] transition-all duration-300"
                placeholder="Enter your email"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-1 py-2 bg-transparent text-white border-b border-[#5d1be380] focus:outline-none focus:border-[#5D1BE3] transition-all duration-300"
                  placeholder="Enter your password"
                  required
                  autoComplete={newUser ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-0 top-2 text-gray-300 hover:text-white transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center space-y-4 mt-6">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-3/4 py-2 cursor-pointer bg-[#1072F1] text-white rounded-lg font-bold hover:bg-blue-600 transition-all duration-300 shadow-lg ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Processing...' : newUser ? 'Sign Up' : 'Login'}
              </button>

              <div className="relative flex items-center justify-center w-full">
                <div className="border-t border-[#ffffff30] w-full"></div>
                <span className="bg-[#362F2F] px-4 text-sm text-gray-300 relative mx-2">or</span>
                <div className="border-t border-[#ffffff30] w-full"></div>
              </div>
              <div className="text-sm text-gray-300 cursor-pointer" onClick={toggleNewUser}>
                {newUser ? "Already have an account? " : "Don't have an account? "}
                <span className="font-bold">{newUser ? "Login" : "Sign Up"}</span>
              </div>
            </div>
          </form>
        </div>
      </div>
      <footer className="flex justify-center pb-4 text-sm text-gray-300 cursor-pointer">
        By continuing you agree to the <span className="font-bold underline pl-1">
          <a href="https://policies.google.com/terms?hl=en-US"> terms and services</a>
        </span>
      </footer>
    </div>
  );
};

export default Login;
