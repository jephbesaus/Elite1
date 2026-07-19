import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader.jsx";
import RingProgress from "../../components/RingProgress.jsx";
import { getItem, setItem, uid } from "../../lib/storage.js";
import { MONTHS, getCurrentMonthIndex, isSameDay, isSameWeek, isSameMonth } from "../../lib/academic.js";
import { askAI } from "../../lib/ai.js";

const CURRENT_MONTH_INDEX = getCurrentMonthIndex();
const SECTIONS_ALL = "Toutes";

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function studentPaidCount(s) {
  return MONTHS.slice(0, CURRENT_MONTH_INDEX + 1).filter((m) => s.paid?.[m]).length;
}
function studentHasDebt(s) {
  return MONTHS.slice(0, CURRENT_MONTH_INDEX + 1).some((m) => !s.paid?.[m]);
}

export default function Caissier({ session, onLogout }) {
  const [tab, setTab] = useState("solde");
  const [students, setStudents] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState(SECTIONS_ALL);
  const [openStudentId, setOpenStudentId] = useState(null);
  const [payMonth, setPayMonth] = useState("");
  const [payMotif, setPayMotif] = useState("Minerval");
  const [payAmount, setPayAmount] = useState("");
  const [confirmFlash, setConfirmFlash] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expWho, setExpWho] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [chatLog, setChatLog] = useState([
    { role: "ai", text: "Bonjour ! Je suis l'assistant intelligent d'ÉLITE 1. Je connais les données de la caisse (paiements, dettes, solde) mais je peux aussi répondre à toute autre question, comme un assistant IA classique." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    setStudents(getItem("students", []));
    setExpenses(getItem("expenses", []));
    setTransactions(getItem("transactions", []));
  }, []);

  function persistStudents(next) {
    setStudents(next);
    setItem("students", next);
  }
  function persistExpenses(next) {
    setExpenses(next);
    setItem("expenses", next);
  }
  function persistTransactions(next) {
    setTransactions(next);
    setItem("transactions", next);
  }

  const activeStudents = students.filter((s) => s.status !== "abandon" && s.status !== "décès");

  const encaisseAuj = transactions.filter((t) => isSameDay(t.date)).reduce((s, t) => s + t.amount, 0);
  const encaisseSemaine = transactions.filter((t) => isSameWeek(t.date)).reduce((s, t) => s + t.amount, 0);
  const encaisseMois = transactions.filter((t) => isSameMonth(t.date)).reduce((s, t) => s + t.amount, 0);
  const depensesAuj = expenses.filter((e) => isSameDay(e.date)).reduce((s, e) => s + e.amount, 0);
  const depensesSemaine = expenses.filter((e) => isSameWeek(e.date)).reduce((s, e) => s + e.amount, 0);
  const depensesMois = expenses.filter((e) => isSameMonth(e.date)).reduce((s, e) => s + e.amount, 0);
  const soldeJour = encaisseAuj - depensesAuj;
  const soldeSemaine = encaisseSemaine - depensesSemaine;
  const soldeMois = encaisseMois - depensesMois;

  const sections = [SECTIONS_ALL, ...Array.from(new Set(activeStudents.map((s) => s.section)))];
  const filteredStudents = activeStudents.filter(
    (s) =>
      (sectionFilter === SECTIONS_ALL || s.section === sectionFilter) &&
      s.name.toLowerCase().includes(search.toLowerCase())
  );

  const openStudent = students.find((s) => s.id === openStudentId);

  function handleOpenStudent(id) {
    setOpenStudentId(id);
    setConfirmFlash(false);
    const s = students.find((x) => x.id === id);
    const nextUnpaid = MONTHS.slice(0, CURRENT_MONTH_INDEX + 1).find((m) => !s.paid?.[m]);
    setPayMonth(nextUnpaid || "");
    setPayAmount("");
  }

  function confirmPayment() {
    if (!openStudent || !payMonth || !payAmount || Number(payAmount) <= 0) return;
    const next = students.map((s) => {
      if (s.id !== openStudent.id) return s;
      return {
        ...s,
        paid: { ...s.paid, [payMonth]: true },
        amounts: { ...s.amounts, [payMonth]: Number(payAmount) },
      };
    });
    persistStudents(next);
    persistTransactions([
      {
        id: uid(),
        studentId: openStudent.id,
        studentName: openStudent.name,
        motif: `${payMotif} — ${payMonth}`,
        amount: Number(payAmount),
        date: new Date().toISOString(),
      },
      ...transactions,
    ]);
    setConfirmFlash(true);
    const remaining = MONTHS.slice(0, CURRENT_MONTH_INDEX + 1).filter((m) => m !== payMonth && !openStudent.paid?.[m]);
    setPayMonth(remaining[0] || "");
    setPayAmount("");
  }

  function addExpense() {
    if (!expWho.trim() || !expAmount || Number(expAmount) <= 0) return;
    persistExpenses([{ id: uid(), who: expWho.trim(), amount: Number(expAmount), date: new Date().toISOString() }, ...expenses]);
    setExpWho("");
    setExpAmount("");
    setExpenseModalOpen(false);
  }

  async function sendChat(text) {
    const msg = (text ?? chatInput).trim();
    if (!msg) return;
    const nextLog = [...chatLog, { role: "user", text: msg }];
    setChatLog(nextLog);
    setChatInput("");
    setChatLoading(true);

    const dataSummary = activeStudents
      .map((s) => {
        const unpaid = MONTHS.slice(0, CURRENT_MONTH_INDEX + 1).filter((m) => !s.paid?.[m]);
        return `${s.name} (${s.section}) — mois impayés: ${unpaid.length ? unpaid.join(", ") : "aucun"}`;
      })
      .join("\n");
    const expSummary = expenses
      .slice(0, 15)
      .map((e) => `${e.who}: $${e.amount} (${new Date(e.date).toLocaleDateString("fr-FR")})`)
      .join("\n");

    const systemPrompt = `Tu es l'assistant intelligent de l'École ÉLITE 1 (Kinshasa), utilisé ici par le Caissier. Tu es un assistant général capable et cultivé, comme Claude : tu peux répondre à n'importe quelle question (finances de l'école, mais aussi culture générale, calcul, actualité, n'importe quel sujet) de façon claire et utile, en français.

Quand la question porte sur la caisse, les élèves ou les paiements, base-toi en priorité sur les données réelles ci-dessous plutôt que de deviner. Pour toute autre question, réponds normalement avec tes connaissances générales.

Données actuelles de la caisse ÉLITE 1 :
Élèves et paiements (mois impayés depuis septembre jusqu'au mois courant) :
${dataSummary || "Aucun élève enregistré."}

Solde du jour : $${soldeJour} (encaissé $${encaisseAuj}, dépenses $${depensesAuj})
Dépenses récentes :
${expSummary || "Aucune dépense enregistrée."}`;

    const history = nextLog
      .filter((m) => m.role === "user" || m.role === "ai")
      .map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text }));

    const reply = await askAI(systemPrompt, history);
    setChatLog((log) => [...log, { role: "ai", text: reply }]);
    setChatLoading(false);
  }

  return (
    <div className="screen">
      <PageHeader pageName="Espace Caissier" roleLabel="Caisse" onBack={onLogout} />
      <div className="dash-content">
        {tab === "solde" && (
          <div>
            <div className="dash-header">
              <h2>Solde</h2>
              <span>{new Date().toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</span>
            </div>
            <div className="balance-hero">
              <div className="label">Solde du jour</div>
              <div className="amount">${soldeJour}</div>
              <div className="sub">Calculé automatiquement sur les opérations du jour</div>
            </div>
            <div className="stat-row">
              <StatMini k="Semaine" v={`$${soldeSemaine}`} />
              <StatMini k="Mois" v={`$${soldeMois}`} />
              <StatMini k="Encaissé auj." v={`$${encaisseAuj}`} />
            </div>
            <div className="block-label" style={{ padding: 0 }}>Dernières transactions</div>
            <div style={{ marginTop: 8 }}>
              {transactions.length === 0 && <div className="empty-state">Aucune transaction enregistrée.</div>}
              {transactions.slice(0, 10).map((t) => (
                <div className="tx-item" key={t.id}>
                  <div className="avatar-circ">{initials(t.studentName)}</div>
                  <div className="tx-info">
                    <div className="n">{t.studentName}</div>
                    <div className="m">{t.motif}</div>
                  </div>
                  <div className="tx-amount">✅ ${t.amount}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "eleves" && (
          <div>
            <div className="dash-header">
              <h2>Élèves</h2>
              <span>{filteredStudents.length} élève(s)</span>
            </div>
            <div className="search-row">
              <input placeholder="Rechercher un élève…" value={search} onChange={(e) => setSearch(e.target.value)} />
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
            {filteredStudents.length === 0 && (
              <div className="empty-state">Aucun élève. Les inscriptions faites par le Secrétariat apparaîtront ici automatiquement.</div>
            )}
            {filteredStudents.map((s) => {
              const pct = Math.round((studentPaidCount(s) / (CURRENT_MONTH_INDEX + 1)) * 100);
              const debt = studentHasDebt(s);
              return (
                <div className="list-row" key={s.id} onClick={() => handleOpenStudent(s.id)}>
                  <RingProgress percent={pct} />
                  <div className="info">
                    <div className="n">{s.name}</div>
                    <div className="s">{s.section}</div>
                    {debt ? <span className="debt-badge">Dette en cours</span> : <span className="ok-badge">À jour</span>}
                  </div>
                  <span className="chevron">›</span>
                </div>
              );
            })}
          </div>
        )}

        {tab === "depenses" && (
          <div>
            <div className="dash-header">
              <h2>Dépenses</h2>
              <span>−${expenses.reduce((s, e) => s + e.amount, 0)}</span>
            </div>
            {expenses.length === 0 && <div className="empty-state">Aucune dépense enregistrée.</div>}
            {expenses.map((e) => (
              <div className="exp-item" key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: "11px 12px", marginBottom: 9 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--red-bg)", color: "var(--red)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>−</div>
                <div>
                  <div className="n" style={{ fontSize: 12.5, fontWeight: 600 }}>{e.who}</div>
                  <div className="m" style={{ fontSize: 10.5, color: "var(--slate)" }}>{new Date(e.date).toLocaleDateString("fr-FR")}</div>
                </div>
                <div style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--red)", fontSize: 13 }}>${e.amount}</div>
              </div>
            ))}
            <button className="add-btn-dashed" onClick={() => setExpenseModalOpen(true)}>+ Ajouter une dépense</button>
          </div>
        )}

        {tab === "ia" && (
          <div className="ai-wrap" style={{ height: "calc(100vh - 220px)" }}>
            <div className="ai-intro">
              <div className="tag">Assistant IA</div>
              <p>Posez une question sur la caisse — ou sur n'importe quel autre sujet.</p>
            </div>
            <div className="chat-log">
              {chatLog.map((m, i) => (
                <div className={`msg ${m.role === "ai" ? "ai" : "user"}`} key={i}>{m.text}</div>
              ))}
              {chatLoading && <div className="msg ai loading">L'assistant consulte les données de la caisse…</div>}
            </div>
            <div className="suggest-row">
              <button className="suggest-chip" onClick={() => sendChat("Qu'ai-je oublié aujourd'hui ?")}>Qu'ai-je oublié aujourd'hui ?</button>
              <button className="suggest-chip" onClick={() => sendChat("Quels élèves ont une dette ?")}>Élèves en dette ?</button>
              <button className="suggest-chip" onClick={() => sendChat("Résume le solde du mois")}>Résumé du mois</button>
            </div>
            <div className="chat-input-row">
              <input placeholder="Écrire à l'assistant…" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} />
              <button className="chat-send" onClick={() => sendChat()} aria-label="Envoyer">➤</button>
            </div>
          </div>
        )}

        {tab === "profil" && (
          <div>
            <div className="profile-card">
              <div className="av">{initials(session.fullName)}</div>
              <div className="n">{session.fullName}</div>
              <div className="r">Caissier</div>
            </div>
            <button className="btn-danger" onClick={onLogout}>Se déconnecter</button>
          </div>
        )}
      </div>

      <div className="tabbar">
        <TabBtn id="solde" tab={tab} setTab={setTab} icon="◎" label="Solde" />
        <TabBtn id="eleves" tab={tab} setTab={setTab} icon="☰" label="Élèves" />
        <TabBtn id="depenses" tab={tab} setTab={setTab} icon="−" label="Dépenses" />
        <TabBtn id="ia" tab={tab} setTab={setTab} icon="✦" label="Assistant" />
        <TabBtn id="profil" tab={tab} setTab={setTab} icon="●" label="Profil" />
      </div>

      {openStudent && (
        <div className="modal-overlay" onClick={() => setOpenStudentId(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle"></div>
            <div className="modal-top">
              <div className="ph">{initials(openStudent.name)}</div>
              <div>
                <div className="n">{openStudent.name}</div>
                <div className="s">{openStudent.section}</div>
              </div>
              <button className="modal-close" onClick={() => setOpenStudentId(null)}>✕</button>
            </div>
            <div className="block-label" style={{ padding: 0 }}>Année scolaire — Septembre à Juillet</div>
            <div className="month-grid" style={{ marginTop: 10 }}>
              {MONTHS.map((m, i) => {
                const cls = i > CURRENT_MONTH_INDEX ? "future" : openStudent.paid?.[m] ? "paid" : "due";
                const icon = i > CURRENT_MONTH_INDEX ? "·" : openStudent.paid?.[m] ? "✅" : "⚠";
                return (
                  <div className={`month-cell ${cls}`} key={m}>
                    <div className="mo">{m}</div>
                    <div className="st">{icon}</div>
                  </div>
                );
              })}
            </div>

            <h4 style={{ fontFamily: "var(--font-display)", fontSize: 13.5, color: "var(--navy-950)", margin: "0 0 10px" }}>Enregistrer un paiement</h4>
            <div className="row2">
              <div className="field">
                <label>Mois</label>
                <select value={payMonth} onChange={(e) => setPayMonth(e.target.value)}>
                  <option value="">—</option>
                  {MONTHS.slice(0, CURRENT_MONTH_INDEX + 1)
                    .filter((m) => !openStudent.paid?.[m])
                    .map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                </select>
              </div>
              <div className="field">
                <label>Motif</label>
                <select value={payMotif} onChange={(e) => setPayMotif(e.target.value)}>
                  <option>Minerval</option>
                  <option>Prime</option>
                  <option>Frais divers</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>Montant payé ($)</label>
              <input type="number" placeholder="Ex. 25" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            </div>
            <button className="confirm-btn" onClick={confirmPayment}>✅ Confirmer la réception</button>
            {confirmFlash && <div className="confirm-flash">✅ Paiement enregistré et confirmé</div>}
          </div>
        </div>
      )}

      {expenseModalOpen && (
        <div className="modal-overlay" onClick={() => setExpenseModalOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle"></div>
            <div className="modal-top">
              <div className="n">Nouvelle dépense</div>
              <button className="modal-close" onClick={() => setExpenseModalOpen(false)}>✕</button>
            </div>
            <div className="field">
              <label>Bénéficiaire / motif</label>
              <input placeholder="Ex. Professeur Jack — avance" value={expWho} onChange={(e) => setExpWho(e.target.value)} />
            </div>
            <div className="field">
              <label>Montant ($)</label>
              <input type="number" placeholder="Ex. 10" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} />
            </div>
            <button className="confirm-btn" style={{ background: "var(--red)" }} onClick={addExpense}>Enregistrer la dépense</button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatMini({ k, v }) {
  return (
    <div className="stat-card">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  );
}

function TabBtn({ id, tab, setTab, icon, label }) {
  return (
    <button className={`tab-btn ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
      <span className="ico">{icon}</span>
      {label}
    </button>
  );
}
