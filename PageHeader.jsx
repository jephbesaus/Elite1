import logo from "../assets/logo.jpg";

export default function PageHeader({ pageName, roleLabel, onBack }) {
  return (
    <div className="topbar">
      {onBack && (
        <button className="back" onClick={onBack} aria-label="Retour">
          ←
        </button>
      )}
      <div className="logo-badge">
        <img src={logo} alt="Logo ÉLITE 1" />
      </div>
      <div className="word">
        ÉLITE 1
        {pageName && <small>{pageName}</small>}
      </div>
      <div className="spacer"></div>
      {roleLabel && <span className="role-chip">{roleLabel}</span>}
    </div>
  );
}
