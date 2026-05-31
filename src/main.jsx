import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Admin from "./pages/Admin.jsx";
import "./styles.css";

const isAdminRoute = window.location.pathname === "/admin";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>{isAdminRoute ? <Admin /> : <App />}</React.StrictMode>
);
