import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader.jsx";
import { getItem } from "../../lib/storage.js";
import { askAI } from "../../lib/ai.js";

export default function Professeur({ session, onLogout }) {
  const [tab, setTab] = useState("cours");
  const [scheduleImg, setScheduleImg] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [classe, setClasse] = useState("");
  const [matiere, setMatiere] = useState("");
  const [sujet, setSujet] = useState("");
  const [loading, setLoading] = useState(false);
  const [lesson, setLesson] = useState("");

  const [chatLog, setChatLog] = useState([
    { role: "ai", text: "Bonjour ! Je suis l'assistant intelligent d'ÉLITE 1. Posez-moi n'importe quelle question — sur une matière, un cours à préparer, ou tout autre sujet." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    setScheduleImg(getItem("schedule_image", null));
  }, []);

  async function prepareLesson(e) {
    e.preventDefault();
    if (!classe.trim() || !matiere.trim() || !sujet.trim()) return;
    setLoading(true);
    setLesson("");
    const systemPrompt = `Tu es un assistant pédagogique pour les enseignants de l'École ÉLITE 1 (RDC). Prépare un plan de cours structuré et clair en français pour la classe et le sujet donnés, adapté au niveau des élèves. Structure ta réponse avec ces sections : 1) Objectifs du cours, 2) Explications adaptées au niveau, 3) Exemples pratiques, 4) Exercices, 5) Questions d'évaluation. Reste concret et directement utilisable en classe.`;
    const reply = await askAI(systemPrompt, [
      { role: "user", content: `Classe : ${classe}\nMatière : ${matiere}\nSujet du cours : ${sujet}` },
    ]);
    setLesson(reply);
    setLoading(false);
  }

  function downloadLesson() {
    const blob = new Blob([lesson], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cours-${matiere.replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function sendChat(text) {
    const msg = (text ?? chatInput).trim();
    if (!msg) return;
    const nextLog = [...chatLog, { role: "user", text: msg }];
    setChatLog(nextLog);
    setChatInput("");
    setChatLoading(true);

    const systemPrompt = `Tu es l'assistant intelligent de l'École ÉLITE 1 (Kinshasa), utilisé ici par un professeur. Tu es un assistant général capable et cultivé, comme Claude : réponds en français à n'importe quelle question — une notion de cours, une matière scolaire, une explication pédagogique, ou tout autre sujet — de façon claire, précise et adaptée à un contexte scolaire.`;

    const history = nextLog
      .filter((m) => m.role === "user" || m.role === "ai")
      .map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text }));

    const reply = await askAI(systemPrompt, history);
    setChatLog((log) => [...log, { role: "ai", text: reply }]);
    setChatLoading(false);
  }

  return (
    <div className="screen">
      <PageHeader pageName="Espace Professeur" roleLabel="Enseignant" onBack={onLogout} />
      <div className="dash-content">
        <div className="action-row">
          <button className={`action-btn ${tab !== "cours" ? "outline" : ""}`} onClick={() => setTab("cours")}>Cours</button>
          <button className={`action-btn ${tab !== "assistant" ? "outline" : ""}`} onClick={() => setTab("assistant")}>Assistant IA</button>
        </div>

        {tab === "cours" && (
          <div>
            <div className="dash-header">
              <h2>Bienvenue, {session.fullName.split(" ")[0]}</h2>
            </div>

            <div className="block-label" style={{ padding: 0 }}>Horaire du jour</div>
            <div className="schedule-frame">
              {scheduleImg ? (
                <img src={scheduleImg} alt="Horaire des cours" />
              ) : (
                <div className="schedule-empty">Aucun horaire publié pour le moment. Il sera ajouté par l'administration.</div>
              )}
            </div>

            <button className="btn-primary" onClick={() => setFormOpen(true)}>Préparation du cours (IA)</button>

            {lesson && (
              <div className="output-card">
                <h4>Plan de cours généré — {matiere} ({classe})</h4>
                <textarea value={lesson} onChange={(e) => setLesson(e.target.value)} />
                <button className="btn-secondary" style={{ marginTop: 10 }} onClick={downloadLesson}>Télécharger (.txt)</button>
              </div>
            )}
          </div>
        )}

        {tab === "assistant" && (
          <div className="ai-wrap" style={{ height: "calc(100vh - 220px)" }}>
            <div className="ai-intro">
              <div className="tag">Assistant IA</div>
              <p>Posez n'importe quelle question — une notion à expliquer, une matière, un cours entier.</p>
            </div>
            <div className="chat-log">
              {chatLog.map((m, i) => (
                <div className={`msg ${m.role === "ai" ? "ai" : "user"}`} key={i}>{m.text}</div>
              ))}
              {chatLoading && <div className="msg ai loading">L'assistant réfléchit…</div>}
            </div>
            <div className="suggest-row">
              <button className="suggest-chip" onClick={() => sendChat("Explique-moi la photosynthèse simplement")}>Explique un concept</button>
              <button className="suggest-chip" onClick={() => sendChat("Donne-moi 3 exercices sur les fractions")}>Générer des exercices</button>
              <button className="suggest-chip" onClick={() => sendChat("Résume l'histoire de la RDC en 5 points")}>Résumer un sujet</button>
            </div>
            <div className="chat-input-row">
              <input placeholder="Écrire à l'assistant…" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} />
              <button className="chat-send" onClick={() => sendChat()} aria-label="Envoyer">➤</button>
            </div>
          </div>
        )}
      </div>

      {formOpen && (
        <div className="modal-overlay" onClick={() => setFormOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle"></div>
            <div className="modal-top">
              <div className="n">Préparation du cours</div>
              <button className="modal-close" onClick={() => setFormOpen(false)}>✕</button>
            </div>
            <form
              onSubmit={(e) => {
                prepareLesson(e);
                setFormOpen(false);
              }}
            >
              <div className="field">
                <label>Classe</label>
                <input value={classe} onChange={(e) => setClasse(e.target.value)} placeholder="Ex. 8ème année" />
              </div>
              <div className="field">
                <label>Matière</label>
                <input value={matiere} onChange={(e) => setMatiere(e.target.value)} placeholder="Ex. Sciences naturelles" />
              </div>
              <div className="field">
                <label>Sujet du cours</label>
                <input value={sujet} onChange={(e) => setSujet(e.target.value)} placeholder="Ex. Le cycle de l'eau" />
              </div>
              <button className="confirm-btn" type="submit" disabled={loading}>
                {loading ? "Génération…" : "Générer le plan de cours"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
