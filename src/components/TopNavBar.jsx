import React from "react";
import { motion } from "framer-motion";
import "../styles/topnavbar.css";

const navLinks = [
  { label: "Volvox", key: "volvox", selected: false },
  { label: "Kick Start", key: "kickstart", selected: false },
  { label: "Innoscope", key: "innoscope", selected: false },
  { label: "Smart Search", key: "smart_search", selected: true },
];

function getAuthSessionData() {
  let token = "";
  let userName = "";
  let userEmail = "";
  let userId = "";
  try {
    token = localStorage.getItem("token") || "";
    userName = localStorage.getItem("user_name") || "";
    userEmail = localStorage.getItem("user_email") || "";
    userId = localStorage.getItem("user_id") || "";

    if (!token) throw new Error("No token found");
    return { token, userName, userEmail, userId };
  } catch (e) {
    // fallback to empty values
  }
}

const openUrl = (key) => {
  // Use Vite env variables (import.meta.env)
  let baseUrlEnv = "";

  if (key === "innoscope") {
    baseUrlEnv = import.meta.env.VITE_INNOSCOPE_URL || "";
  } else if (key === "volvox") {
    baseUrlEnv = import.meta.env.VITE_VOLVOX_URL || "";
  } else if (key === "kickstart") {
    baseUrlEnv = import.meta.env.VITE_KICKSTART_URL || "";
  }

  const { token, userName, userEmail, userId } = getAuthSessionData();

  if (!baseUrlEnv) return;
  const url = new URL(baseUrlEnv);
  url.searchParams.set("token", token);
  url.searchParams.set("user_name", userName);
  url.searchParams.set("user_email", userEmail);
  url.searchParams.set("user_id", userId);
  window.location.href = url.toString();
};

export default function TopNavBar() {
  function handleGetStarted() {
    debugger;
    const LOGOUT_URL = import.meta.env.VITE_LOGOUT_URL
      ? import.meta.env.VITE_LOGOUT_URL + "/workflows"
      : "";

    console.log("Logout URL:", LOGOUT_URL);
    if (LOGOUT_URL) window.location.href = LOGOUT_URL;
  }

  function handleBackToDashboard() {
    const DASHBOARD_URL = import.meta.env.VITE_LOGOUT_URL || "";
    if (DASHBOARD_URL) window.location.href = DASHBOARD_URL;
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="top-navbar"
    >
      <div className="top-navbar-content">
        <div
          className="flex items-center gap-3"
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <div className="relative" style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 8,
                filter: "blur(8px)",
                opacity: 0.75,
                background: "linear-gradient(to right, #a78bfa, #06b6d4)",
              }}
            ></div>
            <div
              style={{
                position: "relative",
                background: "#000",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #a78bfa",
              }}
            >
              {/* Sparkles icon replacement */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#a78bfa"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M6.05 17.95l-1.414 1.414m12.728 0l-1.414-1.414M6.05 6.05L4.636 4.636M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <h1
            style={{
              background:
                "linear-gradient(to right, #a78bfa, #f472b6, #06b6d4)",
              WebkitBackgroundClip: "text",
              color: "transparent",
              fontWeight: 700,
              fontSize: 18,
              marginLeft: 12,
            }}
          >
            idealForge AI
          </h1>
        </div>
        <div className="top-navbar-items" style={{ gap: 24 }}>
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => openUrl(link.key)}
              className={`top-nav-item${link.selected ? " active" : ""}`}
              style={
                link.selected
                  ? {
                      background: "linear-gradient(to right, #a78bfa, #06b6d4)",
                      color: "#fff",
                      fontWeight: 800,
                      boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
                      border: "2px solid #a78bfa",
                      transform: "scale(1.05)",
                      outline: "2px solid #fff",
                      textShadow: "0 2px 8px rgba(0,0,0,0.25), 0 0 2px #fff",
                      letterSpacing: "0.03em",
                    }
                  : {
                      color: "#64748b",
                    }
              }
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={handleGetStarted}
            className="top-nav-item"
            style={{
              background: "linear-gradient(to right, #a78bfa, #06b6d4)",
              color: "#fff",
              fontWeight: 700,
              marginLeft: 12,
            }}
          >
            Agentic Workflows
          </button>
          <button
            onClick={handleBackToDashboard}
            className="top-nav-item"
            style={{
              background: "linear-gradient(to right, #f59e42, #ef4444)",
              color: "#fff",
              fontWeight: 700,
              marginLeft: 8,
            }}
          >
            Back
          </button>
        </div>
      </div>
    </motion.header>
  );
}
