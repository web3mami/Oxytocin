import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Admin from "./pages/Admin.jsx";
import BattleRoster from "./pages/BattleRoster.jsx";
import Raffle from "./pages/Raffle.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./styles.css";

const path = window.location.pathname.replace(/\/$/, "") || "/";

function Root() {
  if (path === "/admin") return <Admin />;
  if (path === "/roster") return <BattleRoster />;
  if (path === "/raffle") return <Raffle />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </React.StrictMode>
);
