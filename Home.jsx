import logo from "../assets/logo.jpg";
import founder from "../assets/founder.jpg";

const CONTACTS = {
  whatsapp: "0978584685",
  vodacom: "0829947834",
  orange: "0800504504",
};

function waLink(local) {
  // DRC : remplace le 0 initial par l'indicatif 243 pour un lien wa.me valide
  const intl = "243" + local.replace(/^0/, "");
  return `https://wa.me/${intl}`;
}

export default function Home({ onConnexion }) {
  return (
    <div className="screen">
      <div className="logo-hero-wrap">
        <div className="logo-ring">
          <img src={logo} alt="Logo Complexe Scolaire ÉLITE 1" />
        </div>
        <h1>ÉLITE 1</h1>
        <div className="tag">Complexe Scolaire</div>
      </div>

      <div className="hero">
        <div className="hero-eyebrow">Fondé en 2017 · Kinshasa</div>
        <h2>Former la jeunesse avec exigence et humanité.</h2>
        <p>
          De la maternelle à l'enseignement technique, ÉLITE 1 accompagne
          chaque élève dans son parcours académique et professionnel.
        </p>
      </div>

      <div className="section-chips">
        {[
          "Maternelle",
          "Primaire",
          "Éducation de base",
          "Pédagogie générale",
          "Technique sociale",
          "Nutrition",
          "Commercial & gestion",
          "Technique agricole",
          "Menuiserie",
        ].map((s) => (
          <span className="chip" key={s}>
            {s}
          </span>
        ))}
      </div>

      <div className="block-label">Mot du fondateur</div>
      <div className="founder-card">
        <div className="top">
          <img src={founder} alt="LUSU MAKINDU Jean-Marie, fondateur d'ÉLITE 1" />
          <div>
            <div className="name">LUSU MAKINDU Jean-Marie</div>
            <div className="title">Fondateur — Directeur général</div>
            <div className="quote">
              « Notre mission : donner à chaque enfant les moyens de réussir. »
            </div>
          </div>
        </div>
        <div className="contact-row">
          <a className="contact-btn whatsapp" href={waLink(CONTACTS.whatsapp)} target="_blank" rel="noreferrer">
            <span className="ic">💬</span>WhatsApp
          </a>
          <a className="contact-btn" href={`tel:${CONTACTS.vodacom}`}>
            <span className="ic">📞</span>Vodacom
          </a>
          <a className="contact-btn" href={`tel:${CONTACTS.orange}`}>
            <span className="ic">📞</span>Orange
          </a>
        </div>
      </div>

      <div className="history-card">
        <p>
          <strong>Historique.</strong> L'École ÉLITE 1 a été créée le 8 août
          2017 avec la vision de contribuer au développement de l'éducation
          et à la formation de la jeunesse. L'établissement intègre
          aujourd'hui les nouvelles technologies pour améliorer sa gestion
          administrative, son suivi pédagogique et sa communication.
        </p>
      </div>

      <div className="home-cta">
        <button className="btn-primary" onClick={onConnexion}>
          Connexion <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
