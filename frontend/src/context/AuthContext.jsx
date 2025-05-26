import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/current_user",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem("token");
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/local/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "Email not verified" && data.userId) {
          return {
            success: false,
            error: "Email not verified",
            userId: data.userId,
            requiresVerification: true,
          };
        }
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("token", data.token);
      setUser(data.user);
      navigate("/");
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signup = async (userData) => {
    try {
      console.log("Sending registration data:", userData);
      const response = await fetch(
        "http://localhost:5000/api/auth/local/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        }
      );

      const data = await response.json();
      console.log("Registration response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      return {
        success: true,
        userId: data.userId,
      };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: error.message || "Registration failed",
      };
    }
  };

  const verifyOTP = async (userId, otp) => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/local/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, otp }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "OTP verification failed");
      }

      localStorage.setItem("token", data.token);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message || "OTP verification failed",
      };
    }
  };

  const resendOTP = async (userId) => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/local/resend-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend OTP");
      }

      return { success: true, message: "OTP sent successfully" };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Failed to resend OTP",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  const handleGoogleCallback = async (token) => {
    if (token) {
      try {
        localStorage.setItem("token", token);
        const response = await fetch(
          "http://localhost:5000/api/auth/current_user",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          navigate("/");
        } else {
          throw new Error("Failed to get user data");
        }
      } catch (error) {
        console.error("Google callback error:", error);
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        signup,
        verifyOTP,
        resendOTP,
        loading,
        handleGoogleCallback,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
