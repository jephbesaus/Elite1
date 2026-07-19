import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader.jsx";
import { getItem, setItem, uid } from "../../lib/storage.js";
import { MONTHS } from "../../lib/academic.js";
import { askAI } from "../../lib/ai.js";

const SECTIONS = [
  "Maternelle",
  "Primaire",
  "7ème année",
  "8ème année",
  "Pédagogie générale",
  "Technique sociale",
  "Nutrition",
  "Commercial et gestion",
  "Technique agricole",
  "Menuiserie",
];

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Secretaire({ session, onLogout }) {
  const [tab, setTab] = useState("apercu");
  const [students, setStudents] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: "", section: SECTIONS[0], genre: "Fille", age: "", photo: null });
  const [reportPeriod, setReportPeriod] = useState("journalier");
  const [letterSubject, setLetterSubject] = useState("");
  const [letterOutput, setLetterOutput] = useState("");
  const [letterLoading, setLetterLoading] = useState(false);

  useEffect(() => {
    setStudents(getItem("students", []));
  }, []);

  function persist(next) {
    setStudents(next);
    setItem("students", next);
  }

  const total = students.length;
  const filles = students.filter((s) => s.genre === "Fille").length;
  const garcons = students.filter((s) => s.genre === "Garçon").length;
  const abandons = students.filter((s) => s.status === "abandon").length;
  const deces = students.filter((s) => s.status === "décès").length;

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    setForm((f) => ({ ...f, photo: b64 }));
  }

  function submitStudent(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.age) return;
    const paid = {};
    MONTHS.forEach((m) => (paid[m] = false));
    const record = {
      id: uid(),
      name: form.name.trim(),
      section: form.section,
      genre: form.genre,
      age: Number(form.age),
      photo: form.photo,
      status: "actif",
      paid,
      amounts: {},
      createdAt: new Date().toISOString(),
    };
    persist([record, ...students]);
    setForm({ name: "", section: SECTIONS[0], genre: "Fille", age: "", photo: null });
    setFormOpen(false);
  }

  function setStatus(id, status) {
    persist(students.map((s) => (s.id === id ? { ...s, status } : s)));
  }

  function reportCount() {
    const now = new Date();
    return students.filter((s) => {
      const d = new Date(s.createdAt);
      if (reportPeriod === "journalier") return d.toDateString() === now.toDateString();
      if (reportPeriod === "hebdomadaire") {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        return d >= start;
      }
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }

  async function generateLetter() {
    if (!letterSubject.trim()) return;
    setLetterLoading(true);
    setLetterOutput("");
    const systemPrompt = `Tu es l'assistant administratif de l'École ÉLITE 1 (Kinshasa, RDC). Rédige une lettre ou un rapport administratif professionnel en français, prêt à être imprimé, sur la base de la demande du secrétariat. Inclus un objet, une formule d'appel et une formule de politesse adaptées au contexte scolaire congolais. Reste concis et formel.`;
    const reply = await askAI(systemPrompt, [{ role: "user", content: letterSubject }]);
    setLetterOutput(reply);
    setLetterLoading(false);
  }

  function printLetter() {
    window.print();
  }

  return (
    <div className="screen">
      <PageHeader pageName="Espace Secrétariat" roleLabel="Secrétaire" onBack={onLogout} />
      <div className="dash-content">
        <div className="action-row">
          <button className={`action-btn ${tab !== "apercu" ? "outline" : ""}`} onClick={() => setTab("apercu")}>Aperçu</button>
          <button className={`action-btn ${tab !== "eleves" ? "outline" : ""}`} onClick={() => setTab("eleves")}>Élèves</button>
          <button className={`action-btn ${tab !== "rapports" ? "outline" : ""}`} onClick={() => setTab("rapports")}>Rapports & IA</button>
        </div>

        {tab === "apercu" && (
          <div>
            <div className="stat-row">
              <MiniStat k="Total élèves" v={total} />
              <MiniStat k="Filles" v={filles} />
              <MiniStat k="Garçons" v={garcons} />
            </div>
            <div className="stat-row">
              <MiniStat k="Abandons" v={abandons} />
              <MiniStat k="Décès" v={deces} />
              <MiniStat k="Sections" v={SECTIONS.length} />
            </div>
            <button className="btn-primary" onClick={() => setFormOpen(true)}>+ Nouvel élève</button>
          </div>
        )}

        {tab === "eleves" && (
          <div>
            <div className="dash-header">
              <h2>Élèves</h2>
              <span>{students.length} enregistré(s)</span>
            </div>
            <button className="btn-primary" style={{ marginBottom: 14 }} onClick={() => setFormOpen(true)}>+ Nouvel élève</button>
            {students.length === 0 && <div className="empty-state">Aucun élève enregistré pour le moment.</div>}
            {students.map((s) => (
              <div className="list-row" key={s.id}>
                <div className="avatar-circ">
                  {s.photo ? <img src={s.photo} alt={s.name} /> : s.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="info">
                  <div className="n">{s.name}</div>
                  <div className="s">{s.section} · {s.genre} · {s.age} ans</div>
                  {s.status === "actif" && <span className="ok-badge">Actif</span>}
                  {s.status === "abandon" && <span className="debt-badge">Abandon</span>}
                  {s.status === "décès" && <span className="grey-badge">Décès</span>}
                </div>
                {s.status === "actif" && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn-secondary" style={{ padding: "6px 8px", fontSize: 10 }} onClick={() => setStatus(s.id, "abandon")}>Abandon</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "rapports" && (
          <div>
            <div className="dash-header"><h2>Rapports</h2></div>
            <div className="field">
              <label>Période</label>
              <select value={reportPeriod} onChange={(e) => setReportPeriod(e.target.value)}>
                <option value="journalier">Journalier</option>
                <option value="hebdomadaire">Hebdomadaire</option>
                <option value="mensuel">Mensuel</option>
              </select>
            </div>
            <div className="output-card">
              <h4>Nouvelles inscriptions ({reportPeriod})</h4>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 24, color: "var(--navy-950)" }}>{reportCount()}</p>
            </div>

            <div className="block-label" style={{ padding: 0, marginTop: 20 }}>Rédaction assistée par IA</div>
            <div className="field">
              <label>Décrivez la lettre ou le rapport à rédiger</label>
              <textarea rows={3} placeholder="Ex. Lettre à un parent pour retard répété de paiement…" value={letterSubject} onChange={(e) => setLetterSubject(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={generateLetter} disabled={letterLoading}>{letterLoading ? "Rédaction…" : "Générer avec l'IA"}</button>

            {letterOutput && (
              <div className="output-card" id="printable">
                <h4>Document généré</h4>
                <textarea value={letterOutput} onChange={(e) => setLetterOutput(e.target.value)} />
                <button className="btn-secondary" style={{ marginTop: 10 }} onClick={printLetter}>Imprimer / Enregistrer en PDF</button>
              </div>
            )}
          </div>
        )}
      </div>

      {formOpen && (
        <div className="modal-overlay" onClick={() => setFormOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle"></div>
            <div className="modal-top">
              <div className="n">Nouvel élève</div>
              <button className="modal-close" onClick={() => setFormOpen(false)}>✕</button>
            </div>
            <form onSubmit={submitStudent}>
              <div className="field">
                <label>Nom complet</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex. Kalonji Mpoyi Trésor" />
              </div>
              <div className="row2">
                <div className="field">
                  <label>Section</label>
                  <select value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}>
                    {SECTIONS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Genre</label>
                  <select value={form.genre} onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}>
                    <option>Fille</option>
                    <option>Garçon</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Âge</label>
                <input type="number" value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} placeholder="Ex. 12" />
              </div>
              <div className="field">
                <label>Photo passeport</label>
                <input type="file" accept="image/*" onChange={handlePhoto} />
              </div>
              <button className="confirm-btn" type="submit">Enregistrer l'élève</button>
            </form>
          </div>
        </div>
      )}
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
