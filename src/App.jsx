import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ChatProvider } from "./components/ChatContext.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import "./App.css";
import TopNavBar from "./components/TopNavBar.jsx";
import NavBar from "./components/NavBar.jsx";
import { Conversation } from "./components/Conversation.jsx";

function Dashboard({ isSidebarOpen, toggleSidebar, closeSidebar }) {
  return (
    <>
      <TopNavBar />

      <div className="page">
        <button
          className="menu-toggle"
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          <svg
            className="hamburger-icon"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div
          className={`sidebar-overlay ${isSidebarOpen ? "active" : ""}`}
          onClick={closeSidebar}
          aria-hidden="true"
        />

        <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
          <NavBar />
        </aside>

        <div className="main-wrapper">
          <Conversation />
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Extract token from URL and store in localStorage
  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    if (token) {
      localStorage.setItem("token", token);
      // Remove token from URL
      url.searchParams.delete("token");
      window.history.replaceState(
        {},
        document.title,
        url.pathname + url.search
      );
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const newState = !prev;
      if (newState) {
        document.body.classList.add("sidebar-open");
      } else {
        document.body.classList.remove("sidebar-open");
      }
      return newState;
    });
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    document.body.classList.remove("sidebar-open");
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isSidebarOpen) {
        closeSidebar();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isSidebarOpen]);

  useEffect(() => {
    closeSidebar();
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <ChatProvider>
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  isSidebarOpen={isSidebarOpen}
                  toggleSidebar={toggleSidebar}
                  closeSidebar={closeSidebar}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ChatProvider>
      </Router>
    </ErrorBoundary>
  );
}
