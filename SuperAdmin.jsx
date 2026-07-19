import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader.jsx";
import { getItem, setItem } from "../../lib/storage.js";
import { generateTempPassword, hashPassword } from "../../lib/hash.js";
import { ROLES } from "../../lib/roles.js";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function SuperAdmin({ session, onLogout }) {
  const [tab, setTab] = useState("comptes");
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [tempPwInfo, setTempPwInfo] = useState(null);
  const [scheduleImg, setScheduleImg] = useState(null);

  useEffect(() => {
    setUsers(getItem("users", []));
    setStudents(getItem("students", []));
    setScheduleImg(getItem("schedule_image", null));
  }, []);

  function persistUsers(next) {
    setUsers(next);
    setItem("users", next);
  }

  function toggleActive(id) {
    persistUsers(users.map((u) => (u.id === id ? { ...u, active: u.active === false ? true : false } : u)));
  }

  async function resetPassword(id) {
    const temp = generateTempPassword();
    const hashed = await hashPassword(temp);
    persistUsers(users.map((u) => (u.id === id ? { ...u, passwordHash: hashed } : u)));
    setTempPwInfo({ id, temp });
  }

  async function handleScheduleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    setScheduleImg(b64);
    setItem("schedule_image", b64);
  }

  const roleLabel = (code) => Object.values(ROLES).find((r) => r.code === code)?.label || code;
  const roleCounts = users.reduce((acc, u) => {
    acc[u.roleCode] = (acc[u.roleCode] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="screen">
      <PageHeader pageName="Super Administration" roleLabel="Admin" onBack={onLogout} />
      <div className="dash-content">
        <div className="action-row">
          <button className={`action-btn ${tab !== "comptes" ? "outline" : ""}`} onClick={() => setTab("comptes")}>Comptes</button>
          <button className={`action-btn ${tab !== "stats" ? "outline" : ""}`} onClick={() => setTab("stats")}>Statistiques</button>
          <button className={`action-btn ${tab !== "horaire" ? "outline" : ""}`} onClick={() => setTab("horaire")}>Horaire profs</button>
        </div>

        {tab === "comptes" && (
          <div>
            <div className="dash-header"><h2>Comptes utilisateurs</h2><span>{users.length}</span></div>
            {users.length === 0 && <div className="empty-state">Aucun compte créé pour l'instant (hors admin).</div>}
            {users.map((u) => (
              <div className="list-row" key={u.id} style={{ flexWrap: "wrap" }}>
                <div className="avatar-circ">{u.fullName.slice(0, 2).toUpperCase()}</div>
                <div className="info">
                  <div className="n">{u.fullName}</div>
                  <div className="s">{roleLabel(u.roleCode)}</div>
                  {u.active === false ? <span className="debt-badge">Désactivé</span> : <span className="ok-badge">Actif</span>}
                </div>
                {u.roleCode !== "admin" && (
                  <div style={{ display: "flex", gap: 6, width: "100%", marginTop: 8 }}>
                    <button className="btn-secondary" style={{ flex: 1, padding: "8px", fontSize: 11 }} onClick={() => toggleActive(u.id)}>
                      {u.active === false ? "Réactiver" : "Désactiver"}
                    </button>
                    <button className="btn-secondary" style={{ flex: 1, padding: "8px", fontSize: 11 }} onClick={() => resetPassword(u.id)}>
                      Réinitialiser
                    </button>
                  </div>
                )}
                {tempPwInfo?.id === u.id && (
                  <div className="info-msg" style={{ width: "100%", marginTop: 8 }}>
                    Nouveau mot de passe temporaire : <strong>{tempPwInfo.temp}</strong> — à transmettre en privé et à faire changer.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "stats" && (
          <div>
            <div className="dash-header"><h2>Statistiques globales</h2></div>
            <div className="stat-row">
              <MiniStat k="Élèves" v={students.length} />
              <MiniStat k="Comptes" v={users.length} />
            </div>
            <div className="block-label" style={{ padding: 0 }}>Comptes par fonction</div>
            <div style={{ marginTop: 8 }}>
              {Object.entries(roleCounts).map(([role, count]) => (
                <div className="list-row" key={role}>
                  <div className="info"><div className="n">{roleLabel(role)}</div></div>
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{count}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "horaire" && (
          <div>
            <div className="dash-header"><h2>Horaire des professeurs</h2></div>
            <p style={{ fontSize: 12.5, color: "var(--slate)", marginBottom: 14 }}>
              L'image publiée ici apparaît directement dans l'espace de chaque professeur.
            </p>
            <div className="schedule-frame">
              {scheduleImg ? <img src={scheduleImg} alt="Horaire" /> : <div className="schedule-empty">Aucun horaire publié.</div>}
            </div>
            <div className="field">
              <label>Remplacer l'image de l'horaire</label>
              <input type="file" accept="image/*" onChange={handleScheduleUpload} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ k, v }) {
  return (
    <div className="stat-card">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  );
}
