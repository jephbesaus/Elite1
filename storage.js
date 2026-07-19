// Couche de persistance côté client (localStorage).
//
// IMPORTANT — à lire avant la mise en production réelle :
// localStorage stocke les données uniquement dans le navigateur de chaque
// appareil. Deux personnes sur deux téléphones différents NE PARTAGENT PAS
// les mêmes données. C'est suffisant pour une démonstration ou un test sur
// un seul poste, mais PAS pour un usage multi-utilisateurs réel (plusieurs
// enseignants, un caissier, un secrétaire travaillant en même temps).
// Pour la mise en production définitive, cette couche devra être remplacée
// par une vraie base de données (voir README.md, section "Prochaine étape").

const NS = "elite1_";

export function getItem(key, fallback) {
  try {
    const raw = localStorage.getItem(NS + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function setItem(key, value) {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
  } catch (e) {
    console.error("Erreur de stockage local :", e);
  }
}

export function getSession() {
  try {
    const raw = sessionStorage.getItem(NS + "session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(session) {
  sessionStorage.setItem(NS + "session", JSON.stringify(session));
}

export function clearSession() {
  sessionStorage.removeItem(NS + "session");
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
