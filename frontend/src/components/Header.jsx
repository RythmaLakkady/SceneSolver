import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 bg-white text-black p-6 z-50 font-serif shadow-md">
      <div className="max-w-7xl mx-auto">
        <div
          className={`flex items-center w-full ${
            user ? "justify-center gap-10" : "justify-between"
          }`}
        >
          <div className="text-2xl tracking-wide font-semibold">
            <Link to="/">
              Scene<span className="text-[#D83A3A]">Solver</span>
            </Link>
          </div>

          <nav className="flex items-center space-x-6 text-lg">
            <Link
              to="/"
              className="hover:text-[#D83A3A] transition-colors duration-300"
            >
              Home
            </Link>
            <Link
              to="/about"
              className="hover:text-[#D83A3A] transition-colors duration-300"
            >
              About
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
                <Link
                  to="/user"
                  className="text-[#D83A3A] font-semibold hover:underline"
                >
                  Hello, {user.displayName}
                </Link>
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
      </div>
    </header>
  );
}
