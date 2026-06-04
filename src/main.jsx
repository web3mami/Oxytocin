import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Admin from "./pages/Admin.jsx";
import BattleRoster from "./pages/BattleRoster.jsx";
import "./styles.css";

const path = window.location.pathname.replace(/\/$/, "") || "/";

function Root() {
  if (path === "/admin") return <Admin />;
  if (path === "/roster") return <BattleRoster />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
