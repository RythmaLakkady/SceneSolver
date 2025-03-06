import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 bg-white text-black p-6 z-50 font-serif shadow-md">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <div className="text-2xl tracking-wide font-semibold">
          <Link to="/">
            clue<span className="text-[#D83A3A]">Xpert</span>
          </Link>
        </div>
        <nav className="flex items-center space-x-6 text-lg">
          <Link
            to="/"
            className="hover:text-[#D83A3A] transition-colors duration-300"
          >
            Home
          </Link>
          {user ? (
            <>
              <Link
                to="/upload"
                className="hover:text-[#D83A3A] transition-colors duration-300"
              >
                Upload
              </Link>
              <button
                onClick={logout}
                className="hover:text-[#D83A3A] transition-colors duration-300"
              >
                Logout
              </button>
              <span className="text-[#D83A3A] font-semibold">
                Hello, {user.displayName}
              </span>
            </>
          ) : (
            <Link
              to="/login"
              className="hover:text-[#D83A3A] transition-colors duration-300"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
