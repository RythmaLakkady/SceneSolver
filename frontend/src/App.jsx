import { useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AmbientFX from "./components/AmbientFX";
import Dashboard from "./Dashboard";
import Login from "./Login";
import Signup from "./Signup";
import Upload from "./Upload";
import User from "./user";
import About from "./about";
import CaseSummary from "./CaseSummary";
import { Loader2 } from "lucide-react";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0b0c12] px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] text-white/70">
          <Loader2 className="size-4 animate-spin text-amber-300" />
          Verifying credentials...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
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
  }, [location, handleGoogleCallback, navigate]);

  return (
    <div className="flex h-[70vh] items-center justify-center">
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0b0c12] px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] text-amber-300">
        <Loader2 className="size-4 animate-spin" />
        Synchronizing Google Session...
      </div>
    </div>
  );
}

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08080c] text-white">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0b0c12] px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] text-white/70">
          <Loader2 className="size-4 animate-spin text-amber-300" />
          Initializing SceneSolver...
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#08080c] text-[#f3f4f6] flex flex-col justify-between overflow-x-clip selection:bg-amber-400/30 selection:text-white">
      <AmbientFX />
      <Header />
      <main className="relative z-10 flex-grow pt-16">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/about" element={<About />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
