import React, { useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Header from "./components/Header";
import Dashboard from "./Dashboard";
import Login from "./Login";
import Signup from "./Signup";
import Upload from "./Upload";
import User from "./User"; // Import the User component
import About from "./about"; // Import the About component
import CaseSummary from "./CaseSummary";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

function AuthCallback() {
  const { handleGoogleCallback } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (token) {
      handleGoogleCallback(token);
    } else {
      navigate("/login");
    }
  }, [location]);

  return null;
}

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/about" element={<About />} /> {/* About Page Route */}
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user"
          element={
            <ProtectedRoute>
              <User />
            </ProtectedRoute>
          }
        />
        <Route
          path="/case-summary"
          element={
            <ProtectedRoute>
              <CaseSummary />
            </ProtectedRoute>
          }
        />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    </>
  );
}
