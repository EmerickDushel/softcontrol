import { useState, useEffect, useRef, useCallback } from "react";

const COLORS = {
  primary: "#1B4F8A",
  primaryLight: "#2563EB",
  primaryDark: "#0F2D52",
  accent: "#10B981",
  accentLight: "#D1FAE5",
  warning: "#F59E0B",
  danger: "#EF4444",
  dangerLight: "#FEE2E2",
  gray50: "#F8FAFC",
  gray100: "#F1F5F9",
  gray200: "#E2E8F0",
  gray300: "#CBD5E1",
  gray500: "#64748B",
  gray700: "#334155",
  gray900: "#0F172A",
  white: "#FFFFFF",
};

const STATUS_CONFIG = {
  "Non fait": { color: "#EF4444", bg: "#FEE2E2", icon: "ti-x" },
  "En cours": { color: "#F59E0B", bg: "#FEF3C7", icon: "ti-clock" },
  "Terminé": { color: "#10B981", bg: "#D1FAE5", icon: "ti-check" },
  "Non conforme": { color: "#6B7280", bg: "#F3F4F6", icon: "ti-alert-triangle" },
};

const ROLES = ["Administrateur", "Contrôleur", "Superviseur"];

const HACCP_CATEGORIES = [
  {
    id: 1, name: "Réception des marchandises", icon: "ti-truck-delivery", color: "#1B4F8A",
    controls: [
      { id: 101, name: "Température des produits", description: "Vérifier la température à réception selon les exigences réglementaires (≤4°C pour le réfrigéré, ≤-18°C pour le surgelé)", criticality: "Critique" },
      { id: 102, name: "Intégrité des emballages", description: "Contrôler l'état des emballages, absence de déchirures, gonflements ou détériorations visibles", criticality: "Majeur" },
      { id: 103, name: "Vérification DLC/DDM", description: "Contrôle des dates limites de consommation et dates de durabilité minimale", criticality: "Critique" },
      { id: 104, name: "Enregistrement des lots", description: "Saisie des numéros de lots pour assurer la traçabilité complète", criticality: "Majeur" },
      { id: 105, name: "Contrôle visuel et olfactif", description: "Inspection sensorielle des produits à réception (couleur, odeur, texture)", criticality: "Mineur" },
    ]
  },
  {
    id: 2, name: "Stockage et chambres froides", icon: "ti-snowflake", color: "#2563EB",
    controls: [
      { id: 201, name: "Température des chambres froides", description: "Relevé des températures des chambres de conservation selon la fréquence définie", criticality: "Critique" },
      { id: 202, name: "Application FIFO", description: "Respect de la méthode premier entré/premier sorti pour la rotation des stocks", criticality: "Majeur" },
      { id: 203, name: "Séparation produits crus/cuits", description: "Vérification de la séparation physique entre produits crus et produits cuits", criticality: "Critique" },
      { id: 204, name: "Produits hors sol", description: "Contrôle que les produits sont bien stockés sur palettes ou rayonnages", criticality: "Mineur" },
      { id: 205, name: "Étiquetage des produits ouverts", description: "Vérification de l'étiquetage avec date d'ouverture et DLC secondaire", criticality: "Majeur" },
    ]
  },
  {
    id: 3, name: "Préparation et production", icon: "ti-chef-hat", color: "#10B981",
    controls: [
      { id: 301, name: "Lavage des mains", description: "Contrôle du respect des procédures de lavage des mains aux moments critiques", criticality: "Critique" },
      { id: 302, name: "Tenue du personnel", description: "Vérification de la conformité des tenues de travail (charlotte, tablier, chaussures)", criticality: "Majeur" },
      { id: 303, name: "Séparation des postes", description: "Respect de la marche en avant et séparation des zones propres/souillées", criticality: "Critique" },
      { id: 304, name: "Respect chaîne du froid", description: "Contrôle du maintien de la chaîne du froid lors des opérations de préparation", criticality: "Critique" },
      { id: 305, name: "Température de cuisson", description: "Vérification des températures à cœur lors des cuissons (≥63°C ou protocole spécifique)", criticality: "Critique" },
      { id: 306, name: "Refroidissement rapide", description: "Contrôle du refroidissement rapide (de +63°C à +10°C en moins de 2h)", criticality: "Critique" },
      { id: 307, name: "Gestion des allergènes", description: "Vérification des procédures de gestion des 14 allergènes majeurs", criticality: "Critique" },
    ]
  },
  {
    id: 4, name: "Remise en température et service", icon: "ti-flame", color: "#F59E0B",
    controls: [
      { id: 401, name: "Température de remise en température", description: "Contrôle de la remise en température (≥63°C en moins de 1h)", criticality: "Critique" },
      { id: 402, name: "Maintien au chaud", description: "Vérification du maintien en température chaude (≥63°C) pendant le service", criticality: "Critique" },
      { id: 403, name: "Maintien au froid", description: "Contrôle du maintien en température froide (≤10°C) pour les entrées et desserts", criticality: "Majeur" },
      { id: 404, name: "Double remise en température interdite", description: "Contrôle de l'absence de double remise en température des produits", criticality: "Critique" },
      { id: 405, name: "Documentation des températures", description: "Enregistrement des températures relevées lors du service", criticality: "Majeur" },
    ]
  },
  {
    id: 5, name: "Nettoyage et désinfection", icon: "ti-spray", color: "#8B5CF6",
    controls: [
      { id: 501, name: "Nettoyage des plans de travail", description: "Contrôle du nettoyage et désinfection des surfaces de travail", criticality: "Majeur" },
      { id: 502, name: "Désinfection des équipements", description: "Vérification du nettoyage et désinfection des équipements et ustensiles", criticality: "Majeur" },
      { id: 503, name: "Respect du protocole TACT", description: "Vérification du respect Temps-Action-Concentration-Température des produits", criticality: "Majeur" },
      { id: 504, name: "Utilisation des produits conformes", description: "Contrôle de l'utilisation de produits désinfectants agréés alimentaire", criticality: "Critique" },
      { id: 505, name: "Suivi des fréquences de nettoyage", description: "Vérification du respect du plan de nettoyage et des fréquences définies", criticality: "Mineur" },
    ]
  },
  {
    id: 6, name: "Traçabilité et documentation", icon: "ti-file-description", color: "#EC4899",
    controls: [
      { id: 601, name: "Registre des réceptions", description: "Vérification de la complétude du registre des réceptions journalières", criticality: "Majeur" },
      { id: 602, name: "Suivi des températures", description: "Contrôle de la tenue du relevé des températures (fréquences et signatures)", criticality: "Majeur" },
      { id: 603, name: "Suivi DLC secondaires", description: "Vérification de l'enregistrement des DLC secondaires sur les produits ouverts", criticality: "Critique" },
      { id: 604, name: "Registre nettoyage", description: "Contrôle de la complétude et signature du plan de nettoyage", criticality: "Mineur" },
      { id: 605, name: "Fiches non-conformité", description: "Vérification de la rédaction et du suivi des fiches de non-conformité", criticality: "Majeur" },
      { id: 606, name: "Formation du personnel", description: "Contrôle des attestations de formation hygiène alimentaire du personnel", criticality: "Majeur" },
    ]
  },
];

function generateSampleData() {
  const statuses = ["Non fait", "En cours", "Terminé", "Non conforme"];
  const agents = [
    { nom: "Martin", prenom: "Sophie" },
    { nom: "Dubois", prenom: "Thomas" },
    { nom: "Bernard", prenom: "Marie" },
    { nom: "Leroy", prenom: "Pierre" },
  ];
  const records = [];
  let id = 1;
  const today = new Date();

  HACCP_CATEGORIES.forEach(cat => {
    cat.controls.forEach(ctrl => {
      const daysOffset = Math.floor(Math.random() * 14) - 7;
      const planned = new Date(today);
      planned.setDate(planned.getDate() + daysOffset);
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const agent = agents[Math.floor(Math.random() * agents.length)];
      const realized = status !== "Non fait" ? new Date(planned.getTime() - Math.random() * 86400000) : null;

      records.push({
        id: id++,
        controlId: ctrl.id,
        categoryId: cat.id,
        categoryName: cat.name,
        name: ctrl.name,
        description: ctrl.description,
        criticality: ctrl.criticality,
        status,
        plannedDate: planned.toISOString().split("T")[0],
        realizedDate: realized ? realized.toISOString().split("T")[0] : null,
        agentNom: status !== "Non fait" ? agent.nom : "",
        agentPrenom: status !== "Non fait" ? agent.prenom : "",
        comment: status === "Non conforme" ? "Action corrective requise. Écart constaté lors du relevé." : "",
        photos: [],
        time: realized ? `${String(Math.floor(Math.random() * 8) + 8).padStart(2, "0")}:${Math.floor(Math.random() * 60) < 30 ? "00" : "30"}` : "",
      });
    });
  });
  return records;
}

function generateChartData(records) {
  const last7 = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayRecords = records.filter(r => r.realizedDate === dateStr);
    last7.push({
      date: d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
      total: dayRecords.length,
      conformes: dayRecords.filter(r => r.status === "Terminé").length,
      nonConformes: dayRecords.filter(r => r.status === "Non conforme").length,
    });
  }
  return last7;
}

// ─── COMPONENTS ─────────────────────────────────────────────────────────────

function Badge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["Non fait"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30`,
      whiteSpace: "nowrap",
    }}>
      <i className={`ti ${cfg.icon}`} style={{ fontSize: 11 }} />
      {status}
    </span>
  );
}

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div style={{
      background: COLORS.white, borderRadius: 14, padding: "18px 20px",
      border: `1px solid ${COLORS.gray200}`, position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: -10, right: -10, width: 60, height: 60,
        borderRadius: "50%", background: color + "15",
      }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: COLORS.gray500, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</p>
          <p style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 700, color: COLORS.gray900 }}>{value}</p>
          {sub && <p style={{ margin: "3px 0 0", fontSize: 12, color: COLORS.gray500 }}>{sub}</p>}
        </div>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: color + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <i className={`ti ${icon}`} style={{ fontSize: 20, color }} />
        </div>
      </div>
    </div>
  );
}

function MiniChart({ data }) {
  const max = Math.max(...data.map(d => d.total), 1);
  return (
    <div style={{ background: COLORS.white, borderRadius: 14, padding: "20px 24px", border: `1px solid ${COLORS.gray200}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: COLORS.gray900 }}>Activité des 7 derniers jours</h3>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: COLORS.gray500 }}>Contrôles réalisés quotidiennement</p>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: COLORS.accent }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS.accent, display: "inline-block" }} /> Conformes
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: COLORS.danger }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS.danger, display: "inline-block" }} /> Non conformes
          </span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: 80, gap: 2 }}>
              {d.nonConformes > 0 && (
                <div style={{ width: "70%", height: `${(d.nonConformes / max) * 70}px`, minHeight: 4, background: COLORS.danger, borderRadius: "3px 3px 0 0", opacity: 0.7 }} />
              )}
              {d.conformes > 0 && (
                <div style={{ width: "70%", height: `${(d.conformes / max) * 70}px`, minHeight: 4, background: COLORS.accent, borderRadius: d.nonConformes > 0 ? 0 : "3px 3px 0 0" }} />
              )}
            </div>
            <span style={{ fontSize: 10, color: COLORS.gray500, textAlign: "center" }}>{d.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Sidebar({ active, setActive, user, onLogout, notifications }) {
  const [collapsed, setCollapsed] = useState(false);
  const navItems = [
    { id: "dashboard", icon: "ti-layout-dashboard", label: "Tableau de bord" },
    { id: "controls", icon: "ti-clipboard-check", label: "Contrôles HACCP" },
    { id: "categories", icon: "ti-category", label: "Catégories" },
    { id: "history", icon: "ti-history", label: "Historique" },
    { id: "users", icon: "ti-users", label: "Utilisateurs" },
  ];

  return (
    <div style={{
      width: collapsed ? 64 : 240, minHeight: "100vh", background: COLORS.primaryDark,
      display: "flex", flexDirection: "column", transition: "width 0.25s ease",
      position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 100, flexShrink: 0,
    }}>
      <div style={{ padding: collapsed ? "20px 0" : "20px 20px", borderBottom: `1px solid rgba(255,255,255,0.1)`, display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between" }}>
        {!collapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: COLORS.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="ti ti-shield-check" style={{ fontSize: 18, color: "#fff" }} />
            </div>
            <div>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: "#fff", letterSpacing: 0.5 }}>SoftControl</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: 1 }}>HACCP MANAGER</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{ width: 32, height: 32, background: COLORS.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="ti ti-shield-check" style={{ fontSize: 18, color: "#fff" }} />
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} style={{
          background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", cursor: "pointer",
          width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
          ...(collapsed ? { position: "absolute", right: -14, top: 22, background: COLORS.primaryDark, border: `1px solid rgba(255,255,255,0.15)` } : {})
        }}>
          <i className={`ti ${collapsed ? "ti-chevron-right" : "ti-chevron-left"}`} style={{ fontSize: 14 }} />
        </button>
      </div>

      <nav style={{ flex: 1, padding: "12px 0" }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setActive(item.id)} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12,
            padding: collapsed ? "11px 0" : "11px 20px", justifyContent: collapsed ? "center" : "flex-start",
            background: active === item.id ? "rgba(255,255,255,0.12)" : "transparent",
            border: "none", cursor: "pointer", color: active === item.id ? "#fff" : "rgba(255,255,255,0.6)",
            fontSize: 14, fontWeight: active === item.id ? 600 : 400, transition: "all 0.15s",
            borderLeft: active === item.id ? `3px solid ${COLORS.accent}` : "3px solid transparent",
          }}>
            <i className={`ti ${item.icon}`} style={{ fontSize: 18, flexShrink: 0 }} />
            {!collapsed && <span>{item.label}</span>}
            {!collapsed && item.id === "controls" && notifications > 0 && (
              <span style={{ marginLeft: "auto", background: COLORS.danger, color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>{notifications}</span>
            )}
          </button>
        ))}
      </nav>

      <div style={{ padding: collapsed ? "12px 0" : "12px 16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        {!collapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#fff", flexShrink: 0 }}>
              {user.prenom[0]}{user.nom[0]}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{user.prenom} {user.nom}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{user.role}</div>
            </div>
          </div>
        )}
        <button onClick={onLogout} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start",
          gap: 8, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
          color: "#FCA5A5", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 13, fontWeight: 500,
        }}>
          <i className="ti ti-logout" style={{ fontSize: 16 }} />
          {!collapsed && "Déconnexion"}
        </button>
      </div>
    </div>
  );
}

function ControlModal({ record, onClose, onSave, categories }) {
  const catInfo = categories.find(c => c.id === record.categoryId);
  const ctrl = catInfo?.controls.find(c => c.id === record.controlId);
  const [form, setForm] = useState({
    agentNom: record.agentNom || "",
    agentPrenom: record.agentPrenom || "",
    realizedDate: record.realizedDate || new Date().toISOString().split("T")[0],
    time: record.time || "",
    status: record.status || "Non fait",
    comment: record.comment || "",
    photos: record.photos || [],
  });
  const [photoNames, setPhotoNames] = useState(record.photos?.map((_, i) => `Photo ${i + 1}`) || []);

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setForm(f => ({ ...f, photos: [...f.photos, ev.target.result] }));
        setPhotoNames(n => [...n, file.name]);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: COLORS.white, borderRadius: 16, width: "100%", maxWidth: 680,
        maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <div style={{ background: `linear-gradient(135deg, ${COLORS.primaryDark}, ${COLORS.primary})`, padding: "20px 24px", borderRadius: "16px 16px 0 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                {catInfo && <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", borderRadius: 6, padding: "2px 10px", fontSize: 11 }}>{catInfo.name}</span>}
                <span style={{ background: record.criticality === "Critique" ? "rgba(239,68,68,0.3)" : record.criticality === "Majeur" ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)", color: "#fff", borderRadius: 6, padding: "2px 10px", fontSize: 11 }}>
                  {ctrl?.criticality || record.criticality}
                </span>
              </div>
              <h2 style={{ margin: 0, color: "#fff", fontSize: 18, fontWeight: 700 }}>{record.name}</h2>
              {ctrl?.description && <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{ctrl.description}</p>}
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", cursor: "pointer", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="ti ti-x" style={{ fontSize: 16 }} />
            </button>
          </div>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Nom de l'agent *</label>
              <input style={inputStyle} value={form.agentNom} onChange={e => setForm({ ...form, agentNom: e.target.value })} placeholder="Nom" />
            </div>
            <div>
              <label style={labelStyle}>Prénom de l'agent *</label>
              <input style={inputStyle} value={form.agentPrenom} onChange={e => setForm({ ...form, agentPrenom: e.target.value })} placeholder="Prénom" />
            </div>
            <div>
              <label style={labelStyle}>Date de réalisation</label>
              <input style={inputStyle} type="date" value={form.realizedDate} onChange={e => setForm({ ...form, realizedDate: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Heure</label>
              <input style={inputStyle} type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Statut *</label>
            <select style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {Object.keys(STATUS_CONFIG).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Commentaire</label>
            <textarea style={{ ...inputStyle, height: 90, resize: "vertical" }} value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} placeholder="Observations, actions correctives..." />
          </div>

          <div>
            <label style={labelStyle}>Photos de preuve</label>
            <label style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
              border: `2px dashed ${COLORS.gray300}`, borderRadius: 10, cursor: "pointer",
              color: COLORS.gray500, fontSize: 14, transition: "all 0.2s",
            }}>
              <i className="ti ti-photo-plus" style={{ fontSize: 20 }} />
              Ajouter des photos (plusieurs autorisées)
              <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handlePhotoUpload} />
            </label>
            {form.photos.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                {form.photos.map((p, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img src={p} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: `1px solid ${COLORS.gray200}` }} />
                    <button onClick={() => setForm(f => ({ ...f, photos: f.photos.filter((_, j) => j !== i) }))} style={{
                      position: "absolute", top: -6, right: -6, background: COLORS.danger, border: "none", color: "#fff",
                      borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                    }}>
                      <i className="ti ti-x" style={{ fontSize: 10 }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${COLORS.gray200}`, paddingTop: 16 }}>
            <button onClick={onClose} style={secondaryBtnStyle}>Annuler</button>
            <button onClick={() => { onSave({ ...record, ...form }); onClose(); }} style={primaryBtnStyle}>
              <i className="ti ti-device-floppy" style={{ fontSize: 15 }} /> Enregistrer
            </button>
            <button onClick={() => {
              const validated = { ...record, ...form, status: "Terminé" };
              onSave(validated);
              onClose();
            }} style={{ ...primaryBtnStyle, background: COLORS.accent }}>
              <i className="ti ti-check" style={{ fontSize: 15 }} /> Valider
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: COLORS.gray700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 };
const inputStyle = { width: "100%", padding: "10px 12px", border: `1px solid ${COLORS.gray200}`, borderRadius: 8, fontSize: 14, color: COLORS.gray900, background: COLORS.gray50, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
const primaryBtnStyle = { display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: COLORS.primary, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" };
const secondaryBtnStyle = { display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: "transparent", color: COLORS.gray700, border: `1px solid ${COLORS.gray300}`, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer" };

// ─── PAGES ──────────────────────────────────────────────────────────────────

function Dashboard({ records, onOpenControl, chartData }) {
  const total = records.length;
  const done = records.filter(r => r.status === "Terminé").length;
  const pending = records.filter(r => r.status === "Non fait" || r.status === "En cours").length;
  const nonConform = records.filter(r => r.status === "Non conforme").length;
  const late = records.filter(r => {
    const today = new Date().toISOString().split("T")[0];
    return r.status === "Non fait" && r.plannedDate < today;
  });

  const recent = [...records].filter(r => r.realizedDate).sort((a, b) => b.realizedDate.localeCompare(a.realizedDate)).slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {late.length > 0 && (
        <div style={{ background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <i className="ti ti-bell-ringing" style={{ fontSize: 20, color: "#D97706" }} />
          <span style={{ fontSize: 14, color: "#92400E", fontWeight: 500 }}>
            <strong>{late.length} contrôle(s) en retard</strong> — Des contrôles n'ont pas été réalisés à la date prévue.
          </span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        <StatCard icon="ti-clipboard-list" label="Total contrôles" value={total} color={COLORS.primary} sub="Cette période" />
        <StatCard icon="ti-circle-check" label="Réalisés" value={done} color={COLORS.accent} sub={`${Math.round((done / total) * 100)}% du total`} />
        <StatCard icon="ti-clock" label="En attente" value={pending} color={COLORS.warning} sub="À réaliser" />
        <StatCard icon="ti-alert-triangle" label="Non conformes" value={nonConform} color={COLORS.danger} sub="Nécessitent action" />
      </div>

      <MiniChart data={chartData} />

      <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.gray200}`, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.gray200}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: COLORS.gray900 }}>Derniers contrôles effectués</h3>
          <span style={{ fontSize: 12, color: COLORS.gray500 }}>5 plus récents</span>
        </div>
        <div>
          {recent.map(r => (
            <div key={r.id} onClick={() => onOpenControl(r)} style={{
              display: "flex", alignItems: "center", padding: "12px 20px", borderBottom: `1px solid ${COLORS.gray100}`,
              cursor: "pointer", transition: "background 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = COLORS.gray50}
              onMouseLeave={e => e.currentTarget.style.background = ""}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.gray900 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: COLORS.gray500 }}>{r.categoryName} — {r.agentPrenom} {r.agentNom}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, color: COLORS.gray500 }}>{r.realizedDate}</span>
                <Badge status={r.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ControlsList({ records, onOpenControl, categories }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tous");
  const [filterCat, setFilterCat] = useState("Toutes");
  const [filterDate, setFilterDate] = useState("");

  const filtered = records.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.categoryName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "Tous" || r.status === filterStatus;
    const matchCat = filterCat === "Toutes" || r.categoryName === filterCat;
    const matchDate = !filterDate || r.plannedDate === filterDate;
    return matchSearch && matchStatus && matchCat && matchDate;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <i className="ti ti-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: COLORS.gray500, fontSize: 16 }} />
          <input style={{ ...inputStyle, paddingLeft: 36 }} placeholder="Rechercher un contrôle..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select style={{ ...inputStyle, flex: "0 0 140px" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option>Tous</option>
          {Object.keys(STATUS_CONFIG).map(s => <option key={s}>{s}</option>)}
        </select>
        <select style={{ ...inputStyle, flex: "0 0 200px" }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option>Toutes</option>
          {categories.map(c => <option key={c.id}>{c.name}</option>)}
        </select>
        <input type="date" style={{ ...inputStyle, flex: "0 0 160px" }} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
      </div>

      <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.gray200}`, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
          <thead>
            <tr style={{ background: COLORS.gray50, borderBottom: `2px solid ${COLORS.gray200}` }}>
              {["Contrôle", "Catégorie", "Criticité", "Statut", "Date prévue", "Réalisé le", "Responsable", ""].map(h => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: COLORS.gray500, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} style={{ borderBottom: `1px solid ${COLORS.gray100}`, transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.gray50}
                onMouseLeave={e => e.currentTarget.style.background = ""}>
                <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 500, color: COLORS.gray900 }}>{r.name}</td>
                <td style={{ padding: "12px 14px", fontSize: 12, color: COLORS.gray500 }}>{r.categoryName}</td>
                <td style={{ padding: "12px 14px" }}>
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 10, fontWeight: 600,
                    background: r.criticality === "Critique" ? "#FEE2E2" : r.criticality === "Majeur" ? "#FEF3C7" : "#D1FAE5",
                    color: r.criticality === "Critique" ? "#DC2626" : r.criticality === "Majeur" ? "#D97706" : "#059669",
                  }}>{r.criticality}</span>
                </td>
                <td style={{ padding: "12px 14px" }}><Badge status={r.status} /></td>
                <td style={{ padding: "12px 14px", fontSize: 12, color: COLORS.gray500 }}>{r.plannedDate}</td>
                <td style={{ padding: "12px 14px", fontSize: 12, color: COLORS.gray500 }}>{r.realizedDate || "—"}</td>
                <td style={{ padding: "12px 14px", fontSize: 12, color: COLORS.gray700 }}>
                  {r.agentPrenom ? `${r.agentPrenom} ${r.agentNom}` : "—"}
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <button onClick={() => onOpenControl(r)} style={{
                    background: COLORS.primary + "15", border: `1px solid ${COLORS.primary}30`, color: COLORS.primary,
                    borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <i className="ti ti-eye" style={{ fontSize: 13 }} /> Détails
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: COLORS.gray500 }}>
            <i className="ti ti-search-off" style={{ fontSize: 32, display: "block", marginBottom: 8 }} />
            Aucun contrôle ne correspond aux filtres
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, color: COLORS.gray500 }}>{filtered.length} contrôle(s) affiché(s)</div>
    </div>
  );
}

function CategoriesPage({ categories, records, onOpenControl }) {
  const [selected, setSelected] = useState(null);

  return (
    <div style={{ display: "flex", gap: 20 }}>
      <div style={{ width: 260, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {categories.map(cat => {
          const catRecords = records.filter(r => r.categoryId === cat.id);
          const done = catRecords.filter(r => r.status === "Terminé").length;
          const pct = catRecords.length ? Math.round((done / catRecords.length) * 100) : 0;
          return (
            <button key={cat.id} onClick={() => setSelected(selected?.id === cat.id ? null : cat)} style={{
              background: selected?.id === cat.id ? cat.color + "15" : COLORS.white,
              border: `1.5px solid ${selected?.id === cat.id ? cat.color : COLORS.gray200}`,
              borderRadius: 12, padding: "14px 16px", cursor: "pointer", textAlign: "left",
              transition: "all 0.2s",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: cat.color + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className={`ti ${cat.icon}`} style={{ fontSize: 18, color: cat.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.gray900 }}>{cat.name}</div>
                  <div style={{ fontSize: 11, color: COLORS.gray500 }}>{catRecords.length} contrôles</div>
                </div>
              </div>
              <div style={{ background: COLORS.gray100, borderRadius: 4, height: 4 }}>
                <div style={{ width: `${pct}%`, height: "100%", background: cat.color, borderRadius: 4, transition: "width 0.4s" }} />
              </div>
              <div style={{ fontSize: 11, color: COLORS.gray500, marginTop: 4 }}>{pct}% terminés</div>
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1 }}>
        {selected ? (
          <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.gray200}`, overflow: "hidden" }}>
            <div style={{ background: selected.color, padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <i className={`ti ${selected.icon}`} style={{ fontSize: 24, color: "#fff" }} />
                <h2 style={{ margin: 0, color: "#fff", fontSize: 17, fontWeight: 700 }}>{selected.name}</h2>
              </div>
            </div>
            <div>
              {selected.controls.map(ctrl => {
                const record = records.find(r => r.controlId === ctrl.id);
                if (!record) return null;
                return (
                  <div key={ctrl.id} onClick={() => onOpenControl(record)} style={{
                    display: "flex", alignItems: "center", padding: "14px 20px",
                    borderBottom: `1px solid ${COLORS.gray100}`, cursor: "pointer", transition: "background 0.15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = COLORS.gray50}
                    onMouseLeave={e => e.currentTarget.style.background = ""}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.gray900 }}>{ctrl.name}</div>
                      <div style={{ fontSize: 12, color: COLORS.gray500, marginTop: 2 }}>{ctrl.description}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{
                        fontSize: 11, padding: "2px 8px", borderRadius: 10, fontWeight: 600,
                        background: ctrl.criticality === "Critique" ? "#FEE2E2" : ctrl.criticality === "Majeur" ? "#FEF3C7" : "#D1FAE5",
                        color: ctrl.criticality === "Critique" ? "#DC2626" : ctrl.criticality === "Majeur" ? "#D97706" : "#059669",
                      }}>{ctrl.criticality}</span>
                      <Badge status={record.status} />
                      <i className="ti ti-chevron-right" style={{ fontSize: 16, color: COLORS.gray300 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, color: COLORS.gray500 }}>
            <i className="ti ti-category" style={{ fontSize: 48, marginBottom: 12, color: COLORS.gray300 }} />
            <p style={{ fontSize: 14 }}>Sélectionnez une catégorie pour voir ses contrôles</p>
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryPage({ records }) {
  const done = records.filter(r => r.realizedDate).sort((a, b) => b.realizedDate.localeCompare(a.realizedDate));
  const byMonth = {};
  done.forEach(r => {
    const m = r.realizedDate.substring(0, 7);
    if (!byMonth[m]) byMonth[m] = [];
    byMonth[m].push(r);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {Object.entries(byMonth).slice(0, 3).map(([month, recs]) => (
        <div key={month} style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.gray200}`, overflow: "hidden" }}>
          <div style={{ padding: "12px 20px", background: COLORS.gray50, borderBottom: `1px solid ${COLORS.gray200}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: COLORS.gray700 }}>
              {new Date(month + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
            </h3>
            <span style={{ fontSize: 12, color: COLORS.gray500 }}>{recs.length} contrôle(s)</span>
          </div>
          {recs.map(r => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", padding: "11px 20px", borderBottom: `1px solid ${COLORS.gray100}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.gray900 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: COLORS.gray500 }}>{r.categoryName} — {r.agentPrenom} {r.agentNom} — {r.time}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: COLORS.gray500 }}>{r.realizedDate}</span>
                <Badge status={r.status} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function UsersPage({ users, onAddUser, currentUser }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ nom: "", prenom: "", email: "", role: "Contrôleur" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        {currentUser.role === "Administrateur" && (
          <button onClick={() => setShowAdd(!showAdd)} style={primaryBtnStyle}>
            <i className="ti ti-user-plus" style={{ fontSize: 15 }} /> Ajouter un utilisateur
          </button>
        )}
      </div>

      {showAdd && (
        <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.gray200}`, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>Nouvel utilisateur</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={labelStyle}>Nom</label><input style={inputStyle} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} /></div>
            <div><label style={labelStyle}>Prénom</label><input style={inputStyle} value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} /></div>
            <div><label style={labelStyle}>Email</label><input style={inputStyle} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><label style={labelStyle}>Rôle</label>
              <select style={inputStyle} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
            <button onClick={() => setShowAdd(false)} style={secondaryBtnStyle}>Annuler</button>
            <button onClick={() => { if (form.nom && form.email) { onAddUser(form); setShowAdd(false); setForm({ nom: "", prenom: "", email: "", role: "Contrôleur" }); } }} style={primaryBtnStyle}>Ajouter</button>
          </div>
        </div>
      )}

      <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.gray200}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: COLORS.gray50, borderBottom: `2px solid ${COLORS.gray200}` }}>
              {["Utilisateur", "Email", "Rôle", "Statut"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: COLORS.gray500, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.email} style={{ borderBottom: `1px solid ${COLORS.gray100}` }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: COLORS.primary + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: COLORS.primary }}>
                      {u.prenom[0]}{u.nom[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{u.prenom} {u.nom}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: COLORS.gray500 }}>{u.email}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 10, fontWeight: 600, background: u.role === "Administrateur" ? "#EDE9FE" : u.role === "Superviseur" ? "#E0F2FE" : "#D1FAE5", color: u.role === "Administrateur" ? "#7C3AED" : u.role === "Superviseur" ? "#0369A1" : "#065F46" }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 10, background: "#D1FAE5", color: "#065F46", fontWeight: 600 }}>Actif</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── AUTH PAGES ──────────────────────────────────────────────────────────────

function AuthPage({ onLogin, onRegister }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ nom: "", prenom: "", email: "", password: "", confirm: "", role: "Contrôleur" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");
    if (mode === "login") {
      if (!form.email || !form.password) return setError("Veuillez remplir tous les champs.");
      onLogin(form);
    } else {
      if (!form.nom || !form.prenom || !form.email || !form.password) return setError("Veuillez remplir tous les champs.");
      if (form.password !== form.confirm) return setError("Les mots de passe ne correspondent pas.");
      if (form.password.length < 6) return setError("Le mot de passe doit contenir au moins 6 caractères.");
      onRegister(form);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 60%, #1E6B8C 100%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 60, height: 60, background: COLORS.accent, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <i className="ti ti-shield-check" style={{ fontSize: 28, color: "#fff" }} />
          </div>
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>SoftControl</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4, letterSpacing: 2 }}>HACCP MANAGEMENT SYSTEM</div>
        </div>

        <div style={{ background: COLORS.white, borderRadius: 20, padding: 32, boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}>
          <div style={{ display: "flex", background: COLORS.gray100, borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
                flex: 1, padding: "9px 0", border: "none", borderRadius: 8, cursor: "pointer",
                fontWeight: 600, fontSize: 13, transition: "all 0.2s",
                background: mode === m ? COLORS.white : "transparent",
                color: mode === m ? COLORS.primary : COLORS.gray500,
                boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              }}>
                {m === "login" ? "Connexion" : "Inscription"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "register" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Nom</label>
                  <input style={inputStyle} placeholder="Dupont" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Prénom</label>
                  <input style={inputStyle} placeholder="Jean" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} />
                </div>
              </div>
            )}
            <div>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="email" placeholder="jean.dupont@example.fr" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Mot de passe</label>
              <div style={{ position: "relative" }}>
                <input style={{ ...inputStyle, paddingRight: 40 }} type={showPass ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: COLORS.gray500 }}>
                  <i className={`ti ${showPass ? "ti-eye-off" : "ti-eye"}`} style={{ fontSize: 16 }} />
                </button>
              </div>
            </div>
            {mode === "register" && (
              <>
                <div>
                  <label style={labelStyle}>Confirmer le mot de passe</label>
                  <input style={inputStyle} type="password" placeholder="••••••••" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Rôle</label>
                  <select style={inputStyle} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>

          {error && (
            <div style={{ background: COLORS.dangerLight, border: `1px solid ${COLORS.danger}30`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: COLORS.danger, marginTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <i className="ti ti-alert-circle" style={{ fontSize: 15 }} /> {error}
            </div>
          )}

          <button onClick={handleSubmit} style={{
            ...primaryBtnStyle, width: "100%", justifyContent: "center", marginTop: 20,
            padding: "13px 0", fontSize: 15, borderRadius: 10,
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
          }}>
            <i className={`ti ${mode === "login" ? "ti-login" : "ti-user-check"}`} style={{ fontSize: 17 }} />
            {mode === "login" ? "Se connecter" : "Créer mon compte"}
          </button>

          {mode === "login" && (
            <p style={{ textAlign: "center", fontSize: 12, color: COLORS.gray500, marginTop: 16 }}>
              Démo : entrez n'importe quel email/mot de passe pour accéder à l'application.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── APP ROOT ────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([
    { nom: "Admin", prenom: "Super", email: "admin@softcontrol.fr", role: "Administrateur" },
    { nom: "Martin", prenom: "Sophie", email: "s.martin@softcontrol.fr", role: "Contrôleur" },
    { nom: "Leroy", prenom: "Pierre", email: "p.leroy@softcontrol.fr", role: "Superviseur" },
  ]);
  const [records, setRecords] = useState(() => generateSampleData());
  const [active, setActive] = useState("dashboard");
  const [selectedControl, setSelectedControl] = useState(null);
  const chartData = generateChartData(records);

  const lateCount = records.filter(r => {
    const today = new Date().toISOString().split("T")[0];
    return r.status === "Non fait" && r.plannedDate < today;
  }).length;

  const handleLogin = (form) => {
    const found = users.find(u => u.email === form.email) || { nom: form.email.split("@")[0], prenom: "Utilisateur", email: form.email, role: "Contrôleur" };
    setUser(found);
  };

  const handleRegister = (form) => {
    const newUser = { nom: form.nom, prenom: form.prenom, email: form.email, role: form.role };
    setUsers(prev => [...prev, newUser]);
    setUser(newUser);
  };

  const handleSaveControl = (updated) => {
    setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const pageTitle = { dashboard: "Tableau de bord", controls: "Contrôles HACCP", categories: "Catégories", history: "Historique", users: "Utilisateurs" };

  if (!user) return <AuthPage onLogin={handleLogin} onRegister={handleRegister} />;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: COLORS.gray50, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" rel="stylesheet" />

      <Sidebar active={active} setActive={setActive} user={user} onLogout={() => setUser(null)} notifications={lateCount} />

      <div style={{ marginLeft: 240, flex: 1, padding: "24px 28px", minWidth: 0, transition: "margin 0.25s" }}>
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: COLORS.gray900 }}>{pageTitle[active]}</h1>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: COLORS.gray500 }}>
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative" }}>
              <button style={{ background: COLORS.white, border: `1px solid ${COLORS.gray200}`, borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: COLORS.gray700 }}>
                <i className="ti ti-bell" style={{ fontSize: 18 }} />
              </button>
              {lateCount > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, background: COLORS.danger, color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{lateCount}</span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: COLORS.white, border: `1px solid ${COLORS.gray200}`, borderRadius: 10, padding: "6px 12px" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                {user.prenom[0]}{user.nom[0]}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.gray900 }}>{user.prenom} {user.nom}</div>
                <div style={{ fontSize: 11, color: COLORS.gray500 }}>{user.role}</div>
              </div>
            </div>
          </div>
        </div>

        {active === "dashboard" && <Dashboard records={records} onOpenControl={setSelectedControl} chartData={chartData} />}
        {active === "controls" && <ControlsList records={records} onOpenControl={setSelectedControl} categories={HACCP_CATEGORIES} />}
        {active === "categories" && <CategoriesPage categories={HACCP_CATEGORIES} records={records} onOpenControl={setSelectedControl} />}
        {active === "history" && <HistoryPage records={records} />}
        {active === "users" && <UsersPage users={users} onAddUser={u => setUsers(prev => [...prev, u])} currentUser={user} />}
      </div>

      {selectedControl && (
        <ControlModal
          record={selectedControl}
          onClose={() => setSelectedControl(null)}
          onSave={handleSaveControl}
          categories={HACCP_CATEGORIES}
        />
      )}
    </div>
  );
}
