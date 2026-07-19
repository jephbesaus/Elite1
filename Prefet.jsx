import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader.jsx";
import { getItem } from "../../lib/storage.js";
import { isSameDay } from "../../lib/academic.js";

export default function Prefet({ session, onLogout }) {
  const [students, setStudents] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    setStudents(getItem("students", []));
    setTransactions(getItem("transactions", []));
    setUsers(getItem("users", []));
    setAttendance(getItem("attendance", []));
  }, []);

  const actifs = students.filter((s) => s.status === "actif");
  const soldeJour = transactions.filter((t) => isSameDay(t.date)).reduce((s, t) => s + t.amount, 0);
  const today = new Date().toDateString();
  const todaysAttendance = attendance.find((a) => a.date === today);
  const presentsToday = todaysAttendance ? Object.values(todaysAttendance.records).filter(Boolean).length : null;

  const roleCounts = users.reduce((acc, u) => {
    acc[u.roleCode] = (acc[u.roleCode] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="screen">
      <PageHeader pageName="Espace Préfet" roleLabel="Supervision" onBack={onLogout} />
      <div className="dash-content">
        <div className="dash-header">
          <h2>Vue d'ensemble</h2>
          <span>{new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
        </div>

        <div className="stat-row">
          <MiniStat k="Élèves actifs" v={actifs.length} />
          <MiniStat k="Encaissé auj." v={`$${soldeJour}`} />
        </div>
        <div className="stat-row">
          <MiniStat k="Présents auj." v={presentsToday ?? "—"} />
          <MiniStat k="Comptes actifs" v={users.filter((u) => u.active !== false).length} />
        </div>

        <div className="block-label" style={{ padding: 0 }}>Comptes par fonction</div>
        <div style={{ marginTop: 8, marginBottom: 16 }}>
          {Object.keys(roleCounts).length === 0 && <div className="empty-state">Aucun compte enregistré.</div>}
          {Object.entries(roleCounts).map(([role, count]) => (
            <div className="list-row" key={role}>
              <div className="info">
                <div className="n" style={{ textTransform: "capitalize" }}>{role}</div>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--navy-950)" }}>{count}</div>
            </div>
          ))}
        </div>

        <div className="block-label" style={{ padding: 0 }}>Dernières transactions</div>
        <div style={{ marginTop: 8 }}>
          {transactions.length === 0 && <div className="empty-state">Aucune transaction.</div>}
          {transactions.slice(0, 8).map((t) => (
            <div className="tx-item" key={t.id}>
              <div className="avatar-circ">{t.studentName.slice(0, 2).toUpperCase()}</div>
              <div className="tx-info">
                <div className="n">{t.studentName}</div>
                <div className="m">{t.motif}</div>
              </div>
              <div className="tx-amount">${t.amount}</div>
            </div>
          ))}
        </div>
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
