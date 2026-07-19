# ÉLITE 1 — Gestion Scolaire

Application web installable (PWA) pour la gestion de l'École ÉLITE 1 :
élèves, caisse, personnel, cours et assistant IA.

**Stack :** HTML, CSS, JavaScript, React (Vite) — hébergement Vercel.

---

## 1. Installation locale

```bash
npm install
npm run dev
```

L'application s'ouvre sur `http://localhost:5173`.

Pour tester l'assistant IA en local, créez un fichier `.env.local` à partir
de `.env.example` et ajoutez votre clé Anthropic, puis utilisez la CLI
Vercel pour lancer aussi la fonction serverless :

```bash
npm i -g vercel
vercel dev
```

(`npm run dev` seul fait tourner le front-end mais pas la fonction
`/api/ai-assistant` — normal, c'est une fonction serverless qui a besoin de
l'environnement Vercel pour s'exécuter.)

---

## 2. Déploiement sur Vercel

**Option A — via GitHub (recommandé)**
1. Poussez ce projet sur un dépôt GitHub.
2. Sur [vercel.com](https://vercel.com), cliquez sur *Add New → Project*, puis importez le dépôt.
3. Vercel détecte automatiquement Vite (aucune configuration à toucher).
4. Avant de cliquer sur *Deploy*, ouvrez **Environment Variables** et ajoutez :
   - `ANTHROPIC_API_KEY` = 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
5. Cliquez sur *Deploy*.

**Option B — via la CLI Vercel**
```bash
npm i -g vercel
vercel login
vercel
vercel env add ANTHROPIC_API_KEY
vercel --prod
```

Sans la variable `ANTHROPIC_API_KEY`, toute l'application fonctionne
normalement — seul l'assistant IA (caisse, secrétariat, préparation de
cours) affichera un message d'indisponibilité.

---

## 3. Installer l'application sur un téléphone (PWA)

Une fois le site en ligne :
- **Android (Chrome) :** ouvrir le lien → menu ⋮ → *Installer l'application* (ou bandeau automatique en bas de l'écran).
- **iPhone (Safari) :** ouvrir le lien → bouton Partager → *Sur l'écran d'accueil*.

L'icône ÉLITE 1 apparaît alors comme une application normale.

---

## 4. Les 6 statuts internes (à distribuer en privé)

Sur la page de connexion, le statut se **tape au clavier**, il n'apparaît
dans aucune liste déroulante — volontairement, pour que la liste des
fonctions ne soit pas visible par n'importe qui. Donnez à chaque personne,
en privé, l'orthographe exacte de sa fonction :

| Statut à taper | Espace ouvert |
|---|---|
| `Super Administrateur` (ou `Admin`) | Super Administration |
| `Préfet` | Espace Préfet |
| `Secrétaire` | Espace Secrétariat |
| `Caissier` | Espace Caissier |
| `Professeur` (ou `Prof`, `Enseignant`) | Espace Professeur |
| `Surveillant` | Espace Surveillance |

**Premier accès Super Administrateur :** mot de passe maître
`2017lusumakindu`, défini dans `src/lib/roles.js`.
⚠️ **Changez ce mot de passe dans le code avant la mise en ligne
définitive** — modifiez la constante `ADMIN_MASTER_PASSWORD` et redéployez.

**Tous les autres statuts** : la première connexion avec un nom + mot de
passe crée automatiquement le compte ; les connexions suivantes avec le
même nom demandent ce même mot de passe.

---

## 5. ⚠️ Limite importante à connaître avant l'usage réel

Cette version stocke les données (élèves, paiements, comptes, présences)
directement **dans le navigateur de chaque appareil** (`localStorage`), pas
sur un serveur central. Concrètement :

- Un même appareil retrouve bien ses données d'une session à l'autre.
- **Deux appareils différents ne partagent pas les mêmes données.** Si le
  Caissier utilise son téléphone et la Secrétaire le sien, ils ne verront
  pas les mêmes listes d'élèves.

C'est adapté pour **tester l'application sur un seul poste** avant de la
présenter au propriétaire, comme vous le prévoyez. Mais pour un usage réel
avec plusieurs employés travaillant en même temps sur des appareils
différents, il faudra ensuite brancher une vraie base de données partagée
(par exemple Supabase, Firebase, ou une base Postgres via Vercel). C'est un
chantier à part, que je peux préparer avec vous quand vous serez prêt à
passer à cette étape.

De la même façon, l'authentification actuelle (mot de passe haché côté
navigateur) convient pour une phase de test, mais une vraie mise en
production avec des données financières mérite une authentification gérée
par un serveur.

---

## 6. Structure du projet

```
elite1-app/
├── api/
│   └── ai-assistant.js       # Fonction serverless (proxy sécurisé vers l'API Claude)
├── public/
│   ├── manifest.json         # Config PWA (installable)
│   ├── service-worker.js     # Cache hors-ligne
│   └── icons/                # Icônes de l'application
├── src/
│   ├── assets/                # Logo + photo du fondateur
│   ├── components/            # PageHeader, RingProgress, StatCard
│   ├── lib/                   # Stockage, rôles, hachage, appel IA, calendrier scolaire
│   ├── pages/
│   │   ├── Home.jsx            # Page d'accueil publique
│   │   ├── Auth.jsx            # Connexion / inscription
│   │   └── dashboards/         # Un fichier par statut (6 tableaux de bord)
│   ├── App.jsx                 # Navigation entre les pages
│   └── main.jsx                # Point d'entrée React
└── README.md
```

---

## 7. Ce qui est fonctionnel dans cette version

- **Accueil** : logo animé, historique, sections/filières, photo et contacts du fondateur (WhatsApp, Vodacom, Orange), bouton Connexion.
- **Connexion** : nom + statut tapé + mot de passe + confirmation, création automatique au premier accès.
- **Caissier** (complet) : solde jour/semaine/mois calculé sur les vraies dates, liste des élèves avec anneau de progression, fiche de paiement Septembre→Juillet, dépenses qui réduisent le solde, assistant IA connecté aux données réelles.
- **Secrétaire** (complet) : inscription d'élève avec photo, statistiques (total, filles, garçons, abandons, décès), rapports par période, rédaction de lettres/rapports par IA avec impression en PDF.
- **Professeur** (complet) : affichage de l'horaire publié par l'administration, préparation de cours par IA (objectifs, explications, exemples, exercices, évaluation), téléchargement du plan de cours.
- **Surveillant** (complet) : présences/absences par élève, totaux filles/garçons, enregistrement journalier.
- **Préfet** (complet, lecture seule) : vue d'ensemble consolidée de tous les modules.
- **Super Administrateur** (complet) : gestion des comptes (désactivation, réinitialisation de mot de passe), statistiques globales, publication de l'image d'horaire pour les professeurs.

## 8. Prochaines étapes possibles

- Base de données partagée multi-appareils (Supabase / Firebase / Postgres).
- Authentification côté serveur.
- Génération de bulletins et gestion complète des notes.
- Export PDF natif (au lieu de l'impression navigateur).
- Notifications (paiements, événements).
