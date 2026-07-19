// Hachage simple côté client (Web Crypto SHA-256).
//
// ⚠️ Cela évite de stocker les mots de passe en clair dans le navigateur,
// mais ce n'est PAS une sécurité de niveau production : tout reste côté
// client, sans serveur pour vérifier réellement l'identité. Pour un usage
// réel avec plusieurs utilisateurs sensibles (finances, dossiers d'élèves),
// il faudra migrer l'authentification vers un vrai backend (voir README.md).

export async function hashPassword(password) {
  const enc = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateTempPassword() {
  return Math.random().toString(36).slice(2, 8) + Math.floor(Math.random() * 90 + 10);
}
