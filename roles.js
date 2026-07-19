// Les 6 statuts internes de l'application.
//
// Volontairement NON affichés dans l'interface de connexion : l'utilisateur
// tape son statut au clavier plutôt que de le choisir dans une liste, afin
// que la liste des fonctions ne soit pas visible par n'importe qui.
// Distribuez l'orthographe exacte de chaque statut en privé à la personne
// concernée (voir README.md).

export const ROLES = {
  admin: {
    code: "admin",
    label: "Super Administrateur",
    dashboard: "SuperAdmin",
    accepted: ["super administrateur", "superadministrateur", "admin", "super admin"],
  },
  prefet: {
    code: "prefet",
    label: "Préfet",
    dashboard: "Prefet",
    accepted: ["prefet", "préfet"],
  },
  secretaire: {
    code: "secretaire",
    label: "Secrétaire",
    dashboard: "Secretaire",
    accepted: ["secretaire", "secrétaire"],
  },
  caissier: {
    code: "caissier",
    label: "Caissier",
    dashboard: "Caissier",
    accepted: ["caissier", "caissiere", "caissière"],
  },
  professeur: {
    code: "professeur",
    label: "Professeur",
    dashboard: "Professeur",
    accepted: ["professeur", "prof", "enseignant", "enseignante"],
  },
  surveillant: {
    code: "surveillant",
    label: "Surveillant",
    dashboard: "Surveillant",
    accepted: ["surveillant", "surveillante"],
  },
};

// Mot de passe maître pour le tout premier accès Super Administrateur.
// ⚠️ À CHANGER avant la mise en ligne définitive — ce fichier est visible
// dans le code source livré au navigateur. Voir README.md.
export const ADMIN_MASTER_PASSWORD = "2017lusumakindu";

function normalize(str) {
  return str
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // retire les accents
}

// Retourne la définition du rôle correspondant au texte tapé, ou null.
export function matchRole(typedStatut) {
  const n = normalize(typedStatut || "");
  if (!n) return null;
  for (const role of Object.values(ROLES)) {
    if (role.accepted.some((a) => normalize(a) === n)) return role;
  }
  return null;
}
