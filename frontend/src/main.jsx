import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: "rgba(11, 17, 33, 0.95)",
              color: "#f8fafc",
              border: "1px solid rgba(51, 65, 85, 0.7)",
              borderRadius: "12px",
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              boxShadow: "0 16px 48px rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(16px)",
            },
            success: {
              iconTheme: { primary: "#10b981", secondary: "#0b1121" },
            },
            error: {
              iconTheme: { primary: "#f43f5e", secondary: "#0b1121" },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
