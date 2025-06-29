import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";

// Handle initial theme
const initializeTheme = () => {
  const storedTheme = localStorage.getItem("theme") || "system";

  if (storedTheme === "system") {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark");
    }
  } else if (storedTheme === "dark") {
    document.documentElement.classList.add("dark");
  }
};

initializeTheme();

// ✅ TEMP: Expose supabase globally
import { supabase } from "./lib/supabase";
(window as any).supabase = supabase;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            className: "dark:bg-gray-800 dark:text-white",
            duration: 3000,
            style: {
              background: "var(--toast-bg)",
              color: "var(--toast-color)",
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
