import { useEffect, useState } from "react";
import { getSession, clearSession } from "./lib/storage";
import Home from "./pages/Home.jsx";
import Auth from "./pages/Auth.jsx";
import SuperAdmin from "./pages/dashboards/SuperAdmin.jsx";
import Prefet from "./pages/dashboards/Prefet.jsx";
import Secretaire from "./pages/dashboards/Secretaire.jsx";
import Caissier from "./pages/dashboards/Caissier.jsx";
import Professeur from "./pages/dashboards/Professeur.jsx";
import Surveillant from "./pages/dashboards/Surveillant.jsx";

const DASHBOARDS = {
  SuperAdmin,
  Prefet,
  Secretaire,
  Caissier,
  Professeur,
  Surveillant,
};

export default function App() {
  const [view, setView] = useState("home"); // 'home' | 'auth' | 'dashboard'
  const [session, setSessionState] = useState(null);

  useEffect(() => {
    const existing = getSession();
    if (existing) {
      setSessionState(existing);
      setView("dashboard");
    }
  }, []);

  function handleLogin(sessionData) {
    setSessionState(sessionData);
    setView("dashboard");
  }

  function handleLogout() {
    clearSession();
    setSessionState(null);
    setView("home");
  }

  if (view === "home") {
    return <Home onConnexion={() => setView("auth")} />;
  }

  if (view === "auth") {
    return <Auth onBack={() => setView("home")} onLogin={handleLogin} />;
  }

  if (view === "dashboard" && session) {
    const Dashboard = DASHBOARDS[session.dashboard];
    if (!Dashboard) {
      // Sécurité : statut inconnu, on renvoie à l'accueil
      handleLogout();
      return null;
    }
    return <Dashboard session={session} onLogout={handleLogout} />;
  }

  return <Home onConnexion={() => setView("auth")} />;
}
