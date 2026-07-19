import { useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import { matchRole, ADMIN_MASTER_PASSWORD } from "../lib/roles.js";
import { hashPassword } from "../lib/hash.js";
import { getItem, setItem, setSession, uid } from "../lib/storage.js";

export default function Auth({ onBack, onLogin }) {
  const [fullName, setFullName] = useState("");
  const [statut, setStatut] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !statut.trim() || !password) {
      setError("Veuillez renseigner votre nom, votre statut et un mot de passe.");
      return;
    }

    const role = matchRole(statut);
    if (!role) {
      setError("Statut non reconnu. Vérifiez l'orthographe exacte de votre fonction.");
      return;
    }

    setBusy(true);
    try {
      // ---- Cas particulier : Super Administrateur (mot de passe maître) ----
      if (role.code === "admin") {
        if (password !== confirm) {
          setError("Les mots de passe ne correspondent pas.");
          setBusy(false);
          return;
        }
        if (password !== ADMIN_MASTER_PASSWORD) {
          setError("Mot de passe administrateur incorrect.");
          setBusy(false);
          return;
        }
        const users = getItem("users", []);
        const already = users.find((u) => u.roleCode === "admin");
        if (!already) {
          users.push({
            id: uid(),
            fullName: fullName.trim(),
            roleCode: "admin",
            active: true,
            createdAt: new Date().toISOString(),
          });
          setItem("users", users);
        }
        const session = { fullName: fullName.trim(), roleCode: "admin", dashboard: role.dashboard };
        setSession(session);
        onLogin(session);
        return;
      }

      // ---- Autres statuts : inscription au premier accès, connexion ensuite ----
      const users = getItem("users", []);
      const key = fullName.trim().toLowerCase();
      const existing = users.find((u) => u.fullName.trim().toLowerCase() === key);

      if (existing) {
        if (existing.roleCode !== role.code) {
          setError("Ce nom est déjà enregistré avec une autre fonction. Vérifiez votre saisie.");
          setBusy(false);
          return;
        }
        if (existing.active === false) {
          setError("Ce compte a été désactivé. Contactez le Super Administrateur.");
          setBusy(false);
          return;
        }
        const hashed = await hashPassword(password);
        if (hashed !== existing.passwordHash) {
          setError("Mot de passe incorrect.");
          setBusy(false);
          return;
        }
        const session = { fullName: existing.fullName, roleCode: role.code, dashboard: role.dashboard };
        setSession(session);
        onLogin(session);
        return;
      }

      // Nouvel utilisateur : première connexion = création du compte
      if (password.length < 6) {
        setError("Le mot de passe doit contenir au moins 6 caractères.");
        setBusy(false);
        return;
      }
      if (password !== confirm) {
        setError("Les mots de passe ne correspondent pas.");
        setBusy(false);
        return;
      }
      const hashed = await hashPassword(password);
      users.push({
        id: uid(),
        fullName: fullName.trim(),
        roleCode: role.code,
        passwordHash: hashed,
        active: true,
        createdAt: new Date().toISOString(),
      });
      setItem("users", users);
      const session = { fullName: fullName.trim(), roleCode: role.code, dashboard: role.dashboard };
      setSession(session);
      onLogin(session);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen">
      <PageHeader pageName="Connexion" onBack={onBack} />
      <div className="auth-wrap">
        <div className="auth-head">
          <h2>Connexion</h2>
          <p>Saisissez vos informations pour accéder à votre espace.</p>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="fullname">Nom complet</label>
            <input
              id="fullname"
              type="text"
              placeholder="Ex. Kalombo Mbuyi Grace"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="statut">Statut</label>
            <input
              id="statut"
              type="text"
              placeholder="Votre fonction dans l'école"
              autoComplete="off"
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="pw">Mot de passe</label>
            <div className="pw-wrap">
              <input
                id="pw"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPw((v) => !v)}>
                {showPw ? "Masquer" : "Afficher"}
              </button>
            </div>
          </div>

          <div className="field">
            <label htmlFor="confirm">Confirmer le mot de passe</label>
            <input
              id="confirm"
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <div className="hint-box">
          Première connexion : votre compte est créé automatiquement avec le
          mot de passe choisi. Connexions suivantes : ce même mot de passe
          vous sera demandé.
        </div>
      </div>
    </div>
  );
}
