import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader.jsx";
import { getItem, setItem } from "../../lib/storage.js";

export default function Surveillant({ session, onLogout }) {
  const [students, setStudents] = useState([]);
  const [presence, setPresence] = useState({}); // { studentId: true|false }
  const [sectionFilter, setSectionFilter] = useState("Toutes");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const list = getItem("students", []).filter((s) => s.status === "actif");
    setStudents(list);
    const today = new Date().toDateString();
    const attendance = getItem("attendance", []);
    const todays = attendance.find((a) => a.date === today);
    const initial = {};
    list.forEach((s) => {
      initial[s.id] = todays?.records?.[s.id] ?? true;
    });
    setPresence(initial);
  }, []);

  const sections = useMemo(() => ["Toutes", ...Array.from(new Set(students.map((s) => s.section)))], [students]);
  const filtered = students.filter((s) => sectionFilter === "Toutes" || s.section === sectionFilter);

  const fillesPresentes = students.filter((s) => s.genre === "Fille" && presence[s.id]).length;
  const garconsPresents = students.filter((s) => s.genre === "Garçon" && presence[s.id]).length;
  const totalPresents = fillesPresentes + garconsPresents;
  const totalAbsents = students.length - totalPresents;

  function toggle(id, val) {
    setPresence((p) => ({ ...p, [id]: val }));
    setSaved(false);
  }

  function saveDay() {
    const today = new Date().toDateString();
    const attendance = getItem("attendance", []);
    const next = attendance.filter((a) => a.date !== today);
    next.push({ date: today, records: presence });
    setItem("attendance", next);
    setSaved(true);
  }

  return (
    <div className="screen">
      <PageHeader pageName="Espace Surveillance" roleLabel="Surveillant" onBack={onLogout} />
      <div className="dash-content">
        <div className="dash-header">
          <h2>Présences du jour</h2>
          <span>{new Date().toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</span>
        </div>

        <div className="stat-row">
          <MiniStat k="Filles présentes" v={fillesPresentes} />
          <MiniStat k="Garçons présents" v={garconsPresents} />
        </div>
        <div className="stat-row">
          <MiniStat k="Total présents" v={totalPresents} />
          <MiniStat k="Total absents" v={totalAbsents} />
        </div>

        <div className="section-chips" style={{ padding: "0 0 12px" }}>
          {sections.map((sec) => (
            <span
              key={sec}
              className="chip"
              style={{
                cursor: "pointer",
                ...(sec === sectionFilter ? { background: "var(--navy-950)", color: "#fff", borderColor: "var(--navy-950)" } : {}),
              }}
              onClick={() => setSectionFilter(sec)}
            >
              {sec}
            </span>
          ))}
        </div>

        {filtered.length === 0 && <div className="empty-state">Aucun élève dans cette section.</div>}
        {filtered.map((s) => (
          <div className="attend-row" key={s.id}>
            <div className="avatar-circ">{s.photo ? <img src={s.photo} alt={s.name} /> : s.name.slice(0, 2).toUpperCase()}</div>
            <div className="info">
              <div className="n">{s.name}</div>
              <div className="s">{s.section}</div>
            </div>
            <div className="attend-toggle">
              <button className={`present ${presence[s.id] ? "active" : ""}`} onClick={() => toggle(s.id, true)}>Présent</button>
              <button className={`absent ${!presence[s.id] ? "active" : ""}`} onClick={() => toggle(s.id, false)}>Absent</button>
            </div>
          </div>
        ))}

        <button className="btn-primary" style={{ marginTop: 10 }} onClick={saveDay}>Enregistrer la journée</button>
        {saved && <div className="info-msg" style={{ marginTop: 12 }}>✅ Présences enregistrées pour aujourd'hui.</div>}
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
