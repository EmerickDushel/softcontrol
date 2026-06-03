import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";

// ─── CONSTANTES ──────────────────────────────────────────────────────────────

const COLORS = {
  primary: "#1B4F8A", primaryLight: "#2563EB", primaryDark: "#0F2D52",
  accent: "#10B981", accentLight: "#D1FAE5",
  warning: "#F59E0B", danger: "#EF4444", dangerLight: "#FEE2E2",
  gray50: "#F8FAFC", gray100: "#F1F5F9", gray200: "#E2E8F0",
  gray300: "#CBD5E1", gray500: "#64748B", gray700: "#334155",
  gray900: "#0F172A", white: "#FFFFFF",
};

const STATUS_CONFIG = {
  "Non fait":     { color: "#EF4444", bg: "#FEE2E2", icon: "ti-x" },
  "En cours":     { color: "#F59E0B", bg: "#FEF3C7", icon: "ti-clock" },
  "Terminé":      { color: "#10B981", bg: "#D1FAE5", icon: "ti-check" },
  "Non conforme": { color: "#6B7280", bg: "#F3F4F6", icon: "ti-alert-triangle" },
};

const ROLES = ["Administrateur", "Contrôleur", "Superviseur"];

const HACCP_CATEGORIES = [
  {
    id: 1, name: "Réception des marchandises", icon: "ti-truck-delivery", color: "#1B4F8A",
    controls: [
      { id: 101, name: "Température des produits", description: "Vérifier la température à réception selon les exigences réglementaires (≤4°C réfrigéré, ≤-18°C surgelé)", criticality: "Critique" },
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

const CATEGORIES_PRODUITS = [
  "Viandes & charcuteries", "Poissons & fruits de mer", "Produits laitiers & œufs",
  "Fruits & légumes", "Surgelés", "Épicerie sèche", "Boissons", "Autre",
];
const UNITES = ["kg", "g", "L", "mL", "pièce(s)", "carton(s)", "boîte(s)", "portion(s)"];

function getDlcStatus(dlc) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dlc.split("-").map(Number);
  const dlcDate = new Date(y, m - 1, d);
  const diffDays = Math.ceil((dlcDate - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0)  return { label: `Expiré (${Math.abs(diffDays)}j)`, color: COLORS.danger,  bg: COLORS.dangerLight, days: diffDays, icon: "ti-alert-circle"  };
  if (diffDays === 0) return { label: "Expire aujourd'hui !",            color: COLORS.danger,  bg: COLORS.dangerLight, days: diffDays, icon: "ti-alarm"         };
  if (diffDays <= 3) return { label: `J-${diffDays}`,                   color: "#D97706",      bg: "#FEF3C7",          days: diffDays, icon: "ti-bell-ringing"  };
  if (diffDays <= 7) return { label: `J-${diffDays}`,                   color: "#F59E0B",      bg: "#FFFBEB",          days: diffDays, icon: "ti-clock"         };
  return               { label: `J-${diffDays}`,                        color: COLORS.accent,  bg: COLORS.accentLight, days: diffDays, icon: "ti-circle-check"  };
}

// ─── STYLES PARTAGÉS ─────────────────────────────────────────────────────────

const labelStyle = {
  display: "block", fontSize: 12, fontWeight: 600, color: COLORS.gray700,
  marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5,
};
const inputStyle = {
  width: "100%", padding: "10px 12px", border: `1px solid ${COLORS.gray200}`,
  borderRadius: 8, fontSize: 14, color: COLORS.gray900, background: COLORS.gray50,
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};
const primaryBtnStyle = {
  display: "flex", alignItems: "center", gap: 6, padding: "9px 18px",
  background: COLORS.primary, color: "#fff", border: "none", borderRadius: 8,
  fontSize: 14, fontWeight: 600, cursor: "pointer",
};
const secondaryBtnStyle = {
  display: "flex", alignItems: "center", gap: 6, padding: "9px 18px",
  background: "transparent", color: COLORS.gray700, border: `1px solid ${COLORS.gray300}`,
  borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer",
};

// ─── COMPOSANTS UI ───────────────────────────────────────────────────────────

function Spinner({ size = 20, color = COLORS.primary }) {
  return (
    <div style={{
      width: size, height: size, border: `2px solid ${color}30`,
      borderTop: `2px solid ${color}`, borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
    }} />
  );
}

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
      <div style={{ position: "absolute", top: -10, right: -10, width: 60, height: 60, borderRadius: "50%", background: color + "15" }} />
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

function MiniChart({ records }) {
  const last7 = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayRecs = records.filter(r => r.realized_date === dateStr);
    last7.push({
      date: d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
      total: dayRecs.length,
      conformes: dayRecs.filter(r => r.status === "Terminé").length,
      nonConformes: dayRecs.filter(r => r.status === "Non conforme").length,
    });
  }
  const max = Math.max(...last7.map(d => d.total), 1);
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
        {last7.map((d, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: 80, gap: 2 }}>
              {d.nonConformes > 0 && <div style={{ width: "70%", height: `${(d.nonConformes / max) * 70}px`, minHeight: 4, background: COLORS.danger, borderRadius: "3px 3px 0 0", opacity: 0.7 }} />}
              {d.conformes > 0 && <div style={{ width: "70%", height: `${(d.conformes / max) * 70}px`, minHeight: 4, background: COLORS.accent, borderRadius: d.nonConformes > 0 ? 0 : "3px 3px 0 0" }} />}
            </div>
            <span style={{ fontSize: 10, color: COLORS.gray500, textAlign: "center" }}>{d.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

function Sidebar({ active, setActive, user, onLogout, lateCount, expiringCount }) {
  const [collapsed, setCollapsed] = useState(false);
  const navItems = [
    { id: "dashboard",  icon: "ti-layout-dashboard", label: "Tableau de bord" },
    { id: "controls",   icon: "ti-clipboard-check",  label: "Contrôles HACCP" },
    { id: "produits",   icon: "ti-package",           label: "Produits & DLC"  },
    { id: "categories", icon: "ti-category",          label: "Catégories"      },
    { id: "history",    icon: "ti-history",            label: "Historique"      },
    { id: "users",      icon: "ti-users",              label: "Utilisateurs"    },
  ];
  return (
    <div style={{
      width: collapsed ? 64 : 240, minHeight: "100vh", background: COLORS.primaryDark,
      display: "flex", flexDirection: "column", transition: "width 0.25s ease",
      position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 100,
    }}>
      <div style={{ padding: collapsed ? "20px 0" : "20px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between" }}>
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
        {collapsed && <div style={{ width: 32, height: 32, background: COLORS.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}><i className="ti ti-shield-check" style={{ fontSize: 18, color: "#fff" }} /></div>}
        <button onClick={() => setCollapsed(!collapsed)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", cursor: "pointer", width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", ...(collapsed ? { position: "absolute", right: -14, top: 22, background: COLORS.primaryDark, border: "1px solid rgba(255,255,255,0.15)" } : {}) }}>
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
            {!collapsed && item.id === "controls" && lateCount > 0 && (
              <span style={{ marginLeft: "auto", background: COLORS.danger, color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>{lateCount}</span>
            )}
            {!collapsed && item.id === "produits" && expiringCount > 0 && (
              <span style={{ marginLeft: "auto", background: "#D97706", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>{expiringCount}</span>
            )}
          </button>
        ))}
      </nav>
      <div style={{ padding: collapsed ? "12px 0" : "12px 16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        {!collapsed && user && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#fff", flexShrink: 0 }}>
              {(user.prenom?.[0] || "?")}{ (user.nom?.[0] || "")}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{user.prenom} {user.nom}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{user.role}</div>
            </div>
          </div>
        )}
        <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 8, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
          <i className="ti ti-logout" style={{ fontSize: 16 }} />
          {!collapsed && "Déconnexion"}
        </button>
      </div>
    </div>
  );
}

// ─── MODALE CONTRÔLE ─────────────────────────────────────────────────────────

function ControlModal({ record, onClose, onSave }) {
  const catInfo = HACCP_CATEGORIES.find(c => c.id === record.category_id);
  const ctrl = catInfo?.controls.find(c => c.id === record.control_id);
  const [form, setForm] = useState({
    agent_nom: record.agent_nom || "",
    agent_prenom: record.agent_prenom || "",
    realized_date: record.realized_date || new Date().toISOString().split("T")[0],
    time_realized: record.time_realized || "",
    status: record.status || "Non fait",
    comment: record.comment || "",
  });
  const [photos, setPhotos] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(true);

  useEffect(() => {
    if (record.id) {
      supabase.from("photos").select("*").eq("controle_id", record.id)
        .then(({ data }) => {
          if (data) setExistingPhotos(data);
          setLoadingPhotos(false);
        });
    } else {
      setLoadingPhotos(false);
    }
  }, [record.id]);

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setPhotos(p => [...p, { file, preview: ev.target.result, name: file.name }]);
      reader.readAsDataURL(file);
    });
  };

  const uploadPhotos = async (controleId) => {
    for (const photo of photos) {
      const ext = photo.file.name.split(".").pop();
      const path = `${controleId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("photos-haccp").upload(path, photo.file);
      if (!upErr) {
        await supabase.from("photos").insert({ controle_id: controleId, storage_path: path, nom_fichier: photo.name });
      }
    }
  };

  const deleteExistingPhoto = async (photo) => {
    await supabase.storage.from("photos-haccp").remove([photo.storage_path]);
    await supabase.from("photos").delete().eq("id", photo.id);
    setExistingPhotos(p => p.filter(x => x.id !== photo.id));
  };

  const handleSave = async (extraStatus) => {
    setSaving(true);
    const payload = { ...form, status: extraStatus || form.status, updated_by: (await supabase.auth.getUser()).data.user?.id };
    const { data, error } = record.id
      ? await supabase.from("controles").update(payload).eq("id", record.id).select().single()
      : await supabase.from("controles").insert({ ...record, ...payload }).select().single();
    if (!error && data) {
      await uploadPhotos(data.id);
      onSave(data);
      onClose();
    }
    setSaving(false);
  };

  const getPhotoUrl = (path) => supabase.storage.from("photos-haccp").getPublicUrl(path).data.publicUrl;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: COLORS.white, borderRadius: 16, width: "100%", maxWidth: 680, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ background: `linear-gradient(135deg, ${COLORS.primaryDark}, ${COLORS.primary})`, padding: "20px 24px", borderRadius: "16px 16px 0 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                {catInfo && <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", borderRadius: 6, padding: "2px 10px", fontSize: 11 }}>{catInfo.name}</span>}
                <span style={{ background: record.criticality === "Critique" ? "rgba(239,68,68,0.3)" : record.criticality === "Majeur" ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)", color: "#fff", borderRadius: 6, padding: "2px 10px", fontSize: 11 }}>{ctrl?.criticality || record.criticality}</span>
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
            <div><label style={labelStyle}>Nom de l'agent *</label><input style={inputStyle} value={form.agent_nom} onChange={e => setForm({ ...form, agent_nom: e.target.value })} placeholder="Nom" /></div>
            <div><label style={labelStyle}>Prénom de l'agent *</label><input style={inputStyle} value={form.agent_prenom} onChange={e => setForm({ ...form, agent_prenom: e.target.value })} placeholder="Prénom" /></div>
            <div><label style={labelStyle}>Date de réalisation</label><input style={inputStyle} type="date" value={form.realized_date} onChange={e => setForm({ ...form, realized_date: e.target.value })} /></div>
            <div><label style={labelStyle}>Heure</label><input style={inputStyle} type="time" value={form.time_realized} onChange={e => setForm({ ...form, time_realized: e.target.value })} /></div>
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
            <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", border: `2px dashed ${COLORS.gray300}`, borderRadius: 10, cursor: "pointer", color: COLORS.gray500, fontSize: 14 }}>
              <i className="ti ti-photo-plus" style={{ fontSize: 20 }} />
              Ajouter des photos (plusieurs autorisées)
              <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handlePhotoUpload} />
            </label>
            {(existingPhotos.length > 0 || photos.length > 0) && (
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                {existingPhotos.map(p => (
                  <div key={p.id} style={{ position: "relative" }}>
                    <img src={getPhotoUrl(p.storage_path)} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: `1px solid ${COLORS.gray200}` }} />
                    <button onClick={() => deleteExistingPhoto(p)} style={{ position: "absolute", top: -6, right: -6, background: COLORS.danger, border: "none", color: "#fff", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <i className="ti ti-x" style={{ fontSize: 10 }} />
                    </button>
                  </div>
                ))}
                {photos.map((p, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img src={p.preview} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: `2px solid ${COLORS.accent}` }} />
                    <button onClick={() => setPhotos(ph => ph.filter((_, j) => j !== i))} style={{ position: "absolute", top: -6, right: -6, background: COLORS.danger, border: "none", color: "#fff", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <i className="ti ti-x" style={{ fontSize: 10 }} />
                    </button>
                    <span style={{ position: "absolute", bottom: -18, left: 0, fontSize: 9, color: COLORS.accent }}>Nouveau</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${COLORS.gray200}`, paddingTop: 16 }}>
            <button onClick={onClose} style={secondaryBtnStyle}>Annuler</button>
            <button onClick={() => handleSave()} disabled={saving} style={{ ...primaryBtnStyle, opacity: saving ? 0.7 : 1 }}>
              {saving ? <Spinner size={15} color="#fff" /> : <i className="ti ti-device-floppy" style={{ fontSize: 15 }} />}
              Enregistrer
            </button>
            <button onClick={() => handleSave("Terminé")} disabled={saving} style={{ ...primaryBtnStyle, background: COLORS.accent, opacity: saving ? 0.7 : 1 }}>
              <i className="ti ti-check" style={{ fontSize: 15 }} /> Valider
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE DASHBOARD ──────────────────────────────────────────────────────────

function Dashboard({ records, products, onOpenControl }) {
  const total = records.length;
  const done = records.filter(r => r.status === "Terminé").length;
  const pending = records.filter(r => r.status === "Non fait" || r.status === "En cours").length;
  const nonConform = records.filter(r => r.status === "Non conforme").length;
  const todayStr = new Date().toISOString().split("T")[0];
  const late = records.filter(r => r.status === "Non fait" && r.planned_date < todayStr);
  const recent = [...records].filter(r => r.realized_date).sort((a, b) => b.realized_date.localeCompare(a.realized_date)).slice(0, 5);

  const expiredProducts  = (products || []).filter(p => getDlcStatus(p.dlc).days < 0);
  const criticalProducts = (products || []).filter(p => { const s = getDlcStatus(p.dlc); return s.days >= 0 && s.days <= 3; });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {expiredProducts.length > 0 && (
        <div style={{ background: COLORS.dangerLight, border: `1px solid ${COLORS.danger}50`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <i className="ti ti-alert-circle" style={{ fontSize: 20, color: COLORS.danger }} />
          <span style={{ fontSize: 14, color: "#991B1B", fontWeight: 500 }}>
            <strong>{expiredProducts.length} produit(s) expiré(s)</strong> — {expiredProducts.map(p => p.nom).join(", ")} — À retirer immédiatement.
          </span>
        </div>
      )}
      {criticalProducts.length > 0 && (
        <div style={{ background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <i className="ti ti-package" style={{ fontSize: 20, color: "#D97706" }} />
          <span style={{ fontSize: 14, color: "#92400E", fontWeight: 500 }}>
            <strong>{criticalProducts.length} produit(s) expirent dans ≤ 3 jours</strong> — {criticalProducts.map(p => `${p.nom} (${getDlcStatus(p.dlc).label})`).join(", ")}.
          </span>
        </div>
      )}
      {late.length > 0 && (
        <div style={{ background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <i className="ti ti-bell-ringing" style={{ fontSize: 20, color: "#D97706" }} />
          <span style={{ fontSize: 14, color: "#92400E", fontWeight: 500 }}>
            <strong>{late.length} contrôle(s) en retard</strong> — Des contrôles n'ont pas été réalisés à la date prévue.
          </span>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        <StatCard icon="ti-clipboard-list" label="Total contrôles" value={total} color={COLORS.primary} sub="Tous statuts" />
        <StatCard icon="ti-circle-check" label="Réalisés" value={done} color={COLORS.accent} sub={total ? `${Math.round((done / total) * 100)}% du total` : "—"} />
        <StatCard icon="ti-clock" label="En attente" value={pending} color={COLORS.warning} sub="À réaliser" />
        <StatCard icon="ti-alert-triangle" label="Non conformes" value={nonConform} color={COLORS.danger} sub="Nécessitent action" />
      </div>
      <MiniChart records={records} />
      <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.gray200}`, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.gray200}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: COLORS.gray900 }}>Derniers contrôles effectués</h3>
          <span style={{ fontSize: 12, color: COLORS.gray500 }}>5 plus récents</span>
        </div>
        {recent.length === 0
          ? <div style={{ padding: 32, textAlign: "center", color: COLORS.gray500, fontSize: 14 }}>Aucun contrôle réalisé pour le moment.</div>
          : recent.map(r => (
            <div key={r.id} onClick={() => onOpenControl(r)} style={{ display: "flex", alignItems: "center", padding: "12px 20px", borderBottom: `1px solid ${COLORS.gray100}`, cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = COLORS.gray50}
              onMouseLeave={e => e.currentTarget.style.background = ""}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.gray900 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: COLORS.gray500 }}>{r.category_name} — {r.agent_prenom} {r.agent_nom}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, color: COLORS.gray500 }}>{r.realized_date}</span>
                <Badge status={r.status} />
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ─── PAGE CONTRÔLES ──────────────────────────────────────────────────────────

function ControlsList({ records, onOpenControl }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tous");
  const [filterCat, setFilterCat] = useState("Toutes");
  const [filterDate, setFilterDate] = useState("");

  const filtered = records.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.category_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "Tous" || r.status === filterStatus;
    const matchCat = filterCat === "Toutes" || r.category_name === filterCat;
    const matchDate = !filterDate || r.planned_date === filterDate;
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
          {HACCP_CATEGORIES.map(c => <option key={c.id}>{c.name}</option>)}
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
              <tr key={r.id} style={{ borderBottom: `1px solid ${COLORS.gray100}` }}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.gray50}
                onMouseLeave={e => e.currentTarget.style.background = ""}>
                <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 500, color: COLORS.gray900 }}>{r.name}</td>
                <td style={{ padding: "12px 14px", fontSize: 12, color: COLORS.gray500 }}>{r.category_name}</td>
                <td style={{ padding: "12px 14px" }}>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, fontWeight: 600, background: r.criticality === "Critique" ? "#FEE2E2" : r.criticality === "Majeur" ? "#FEF3C7" : "#D1FAE5", color: r.criticality === "Critique" ? "#DC2626" : r.criticality === "Majeur" ? "#D97706" : "#059669" }}>{r.criticality}</span>
                </td>
                <td style={{ padding: "12px 14px" }}><Badge status={r.status} /></td>
                <td style={{ padding: "12px 14px", fontSize: 12, color: COLORS.gray500 }}>{r.planned_date || "—"}</td>
                <td style={{ padding: "12px 14px", fontSize: 12, color: COLORS.gray500 }}>{r.realized_date || "—"}</td>
                <td style={{ padding: "12px 14px", fontSize: 12, color: COLORS.gray700 }}>{r.agent_prenom ? `${r.agent_prenom} ${r.agent_nom}` : "—"}</td>
                <td style={{ padding: "12px 14px" }}>
                  <button onClick={() => onOpenControl(r)} style={{ background: COLORS.primary + "15", border: `1px solid ${COLORS.primary}30`, color: COLORS.primary, borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
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

// ─── PAGE CATÉGORIES ─────────────────────────────────────────────────────────

function CategoriesPage({ records, onOpenControl }) {
  const [selected, setSelected] = useState(null);
  return (
    <div style={{ display: "flex", gap: 20 }}>
      <div style={{ width: 260, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {HACCP_CATEGORIES.map(cat => {
          const catRecs = records.filter(r => r.category_id === cat.id);
          const done = catRecs.filter(r => r.status === "Terminé").length;
          const pct = catRecs.length ? Math.round((done / catRecs.length) * 100) : 0;
          return (
            <button key={cat.id} onClick={() => setSelected(selected?.id === cat.id ? null : cat)} style={{ background: selected?.id === cat.id ? cat.color + "15" : COLORS.white, border: `1.5px solid ${selected?.id === cat.id ? cat.color : COLORS.gray200}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: cat.color + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className={`ti ${cat.icon}`} style={{ fontSize: 18, color: cat.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.gray900 }}>{cat.name}</div>
                  <div style={{ fontSize: 11, color: COLORS.gray500 }}>{catRecs.length} contrôle(s)</div>
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
            {selected.controls.map(ctrl => {
              const rec = records.find(r => r.control_id === ctrl.id);
              if (!rec) return null;
              return (
                <div key={ctrl.id} onClick={() => onOpenControl(rec)} style={{ display: "flex", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${COLORS.gray100}`, cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = COLORS.gray50}
                  onMouseLeave={e => e.currentTarget.style.background = ""}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.gray900 }}>{ctrl.name}</div>
                    <div style={{ fontSize: 12, color: COLORS.gray500, marginTop: 2 }}>{ctrl.description}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, fontWeight: 600, background: ctrl.criticality === "Critique" ? "#FEE2E2" : ctrl.criticality === "Majeur" ? "#FEF3C7" : "#D1FAE5", color: ctrl.criticality === "Critique" ? "#DC2626" : ctrl.criticality === "Majeur" ? "#D97706" : "#059669" }}>{ctrl.criticality}</span>
                    <Badge status={rec.status} />
                    <i className="ti ti-chevron-right" style={{ fontSize: 16, color: COLORS.gray300 }} />
                  </div>
                </div>
              );
            })}
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

// ─── PAGE HISTORIQUE ─────────────────────────────────────────────────────────

function HistoryPage({ records }) {
  const done = records.filter(r => r.realized_date).sort((a, b) => b.realized_date.localeCompare(a.realized_date));
  const byMonth = {};
  done.forEach(r => {
    const m = r.realized_date.substring(0, 7);
    if (!byMonth[m]) byMonth[m] = [];
    byMonth[m].push(r);
  });
  if (done.length === 0) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, color: COLORS.gray500 }}>
      <i className="ti ti-history" style={{ fontSize: 48, marginBottom: 12, color: COLORS.gray300 }} />
      <p style={{ fontSize: 14 }}>Aucun contrôle réalisé pour le moment</p>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {Object.entries(byMonth).map(([month, recs]) => (
        <div key={month} style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.gray200}`, overflow: "hidden" }}>
          <div style={{ padding: "12px 20px", background: COLORS.gray50, borderBottom: `1px solid ${COLORS.gray200}`, display: "flex", justifyContent: "space-between" }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: COLORS.gray700 }}>{new Date(month + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</h3>
            <span style={{ fontSize: 12, color: COLORS.gray500 }}>{recs.length} contrôle(s)</span>
          </div>
          {recs.map(r => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", padding: "11px 20px", borderBottom: `1px solid ${COLORS.gray100}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.gray900 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: COLORS.gray500 }}>{r.category_name} — {r.agent_prenom} {r.agent_nom} {r.time_realized && `à ${r.time_realized}`}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: COLORS.gray500 }}>{r.realized_date}</span>
                <Badge status={r.status} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── PAGE UTILISATEURS ───────────────────────────────────────────────────────

function UsersPage({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ nom: "", prenom: "", email: "", password: "", role: "Contrôleur" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("profils").select("*").order("created_at").then(({ data }) => {
      if (data) setUsers(data);
      setLoading(false);
    });
  }, []);

  const handleAdd = async () => {
    if (!form.nom || !form.email || !form.password) return setError("Champs obligatoires manquants.");
    setSaving(true); setError("");
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { nom: form.nom, prenom: form.prenom, role: form.role } }
    });
    if (signUpError) { setError(signUpError.message); setSaving(false); return; }
    const newUser = { id: data.user.id, nom: form.nom, prenom: form.prenom, email: form.email, role: form.role };
    await supabase.from("profils").upsert(newUser);
    setUsers(u => [...u, newUser]);
    setShowAdd(false); setForm({ nom: "", prenom: "", email: "", password: "", role: "Contrôleur" });
    setSaving(false);
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {currentUser.role === "Administrateur" && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => setShowAdd(!showAdd)} style={primaryBtnStyle}>
            <i className="ti ti-user-plus" style={{ fontSize: 15 }} /> Ajouter un utilisateur
          </button>
        </div>
      )}
      {showAdd && (
        <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.gray200}`, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>Nouvel utilisateur</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={labelStyle}>Nom *</label><input style={inputStyle} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} /></div>
            <div><label style={labelStyle}>Prénom</label><input style={inputStyle} value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} /></div>
            <div><label style={labelStyle}>Email *</label><input style={inputStyle} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><label style={labelStyle}>Mot de passe *</label><input style={inputStyle} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
            <div><label style={labelStyle}>Rôle</label><select style={inputStyle} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>{ROLES.map(r => <option key={r}>{r}</option>)}</select></div>
          </div>
          {error && <div style={{ background: COLORS.dangerLight, border: `1px solid ${COLORS.danger}30`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: COLORS.danger, marginTop: 12 }}>{error}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
            <button onClick={() => setShowAdd(false)} style={secondaryBtnStyle}>Annuler</button>
            <button onClick={handleAdd} disabled={saving} style={{ ...primaryBtnStyle, opacity: saving ? 0.7 : 1 }}>
              {saving ? <Spinner size={14} color="#fff" /> : null} Créer le compte
            </button>
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
              <tr key={u.id} style={{ borderBottom: `1px solid ${COLORS.gray100}` }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: COLORS.primary + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: COLORS.primary }}>
                      {u.prenom?.[0]}{u.nom?.[0]}
                    </div>
                    <div><div style={{ fontSize: 13, fontWeight: 500 }}>{u.prenom} {u.nom}</div></div>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: COLORS.gray500 }}>{u.email}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 10, fontWeight: 600, background: u.role === "Administrateur" ? "#EDE9FE" : u.role === "Superviseur" ? "#E0F2FE" : "#D1FAE5", color: u.role === "Administrateur" ? "#7C3AED" : u.role === "Superviseur" ? "#0369A1" : "#065F46" }}>{u.role}</span>
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

// ─── PAGE PRODUITS & DLC ─────────────────────────────────────────────────────

const EMPTY_PRODUCT_FORM = { nom: "", categorie: "", fournisseur: "", numero_lot: "", dlc: "", quantite: "", unite: "kg" };

function ProductsPage({ currentUser }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Toutes");
  const [filterStatus, setFilterStatus] = useState("Tous");
  const [form, setForm] = useState(EMPTY_PRODUCT_FORM);
  const [editForm, setEditForm] = useState(EMPTY_PRODUCT_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    supabase.from("produits").select("*").order("dlc", { ascending: true })
      .then(({ data }) => { if (data) setProducts(data); setLoading(false); });
  }, []);

  const filtered = products.filter(p => {
    const matchSearch = p.nom.toLowerCase().includes(search.toLowerCase()) ||
      (p.fournisseur || "").toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "Toutes" || p.categorie === filterCat;
    const s = getDlcStatus(p.dlc);
    const matchStatus =
      filterStatus === "Tous" ||
      (filterStatus === "Expiré"   && s.days < 0) ||
      (filterStatus === "Critique" && s.days >= 0 && s.days <= 3) ||
      (filterStatus === "Attention" && s.days >= 4 && s.days <= 7) ||
      (filterStatus === "OK"       && s.days > 7);
    return matchSearch && matchCat && matchStatus;
  });

  const stats = {
    total:    products.length,
    expired:  products.filter(p => getDlcStatus(p.dlc).days < 0).length,
    critical: products.filter(p => { const s = getDlcStatus(p.dlc); return s.days >= 0 && s.days <= 3; }).length,
    ok:       products.filter(p => getDlcStatus(p.dlc).days > 7).length,
  };

  const handleAdd = async () => {
    if (!form.nom || !form.dlc) return;
    setSaving(true);
    const { data, error } = await supabase.from("produits")
      .insert({ ...form, created_by: (await supabase.auth.getUser()).data.user?.id })
      .select().single();
    if (!error && data) {
      setProducts(prev => [...prev, data].sort((a, b) => a.dlc.localeCompare(b.dlc)));
      setShowAdd(false);
      setForm(EMPTY_PRODUCT_FORM);
    }
    setSaving(false);
  };

  const openEdit = (product) => {
    setEditing(product);
    setEditForm({
      nom: product.nom || "",
      categorie: product.categorie || "",
      fournisseur: product.fournisseur || "",
      numero_lot: product.numero_lot || "",
      dlc: product.dlc || "",
      quantite: product.quantite || "",
      unite: product.unite || "kg",
    });
    setShowAdd(false);
  };

  const handleUpdate = async () => {
    if (!editForm.nom || !editForm.dlc) return;
    setSaving(true);
    const { data, error } = await supabase.from("produits")
      .update({ ...editForm, alerte_j3_envoyee: false, updated_by: (await supabase.auth.getUser()).data.user?.id })
      .eq("id", editing.id)
      .select().single();
    if (!error && data) {
      setProducts(prev => prev.map(p => p.id === data.id ? data : p).sort((a, b) => a.dlc.localeCompare(b.dlc)));
      setEditing(null);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    await supabase.from("produits").delete().eq("id", id);
    setProducts(prev => prev.filter(p => p.id !== id));
    if (editing?.id === id) setEditing(null);
    setDeleting(null);
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
        <StatCard icon="ti-package"       label="Total produits"  value={stats.total}    color={COLORS.primary} />
        <StatCard icon="ti-alert-circle"  label="Expirés"         value={stats.expired}  color={COLORS.danger}  sub="À retirer" />
        <StatCard icon="ti-bell-ringing"  label="Critiques (≤3j)" value={stats.critical} color="#D97706"         sub="Alertes actives" />
        <StatCard icon="ti-circle-check"  label="Conformes"       value={stats.ok}       color={COLORS.accent}  sub="DLC > 7 jours" />
      </div>

      {stats.expired > 0 && (
        <div style={{ background: COLORS.dangerLight, border: `1px solid ${COLORS.danger}50`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <i className="ti ti-alert-circle" style={{ fontSize: 20, color: COLORS.danger }} />
          <span style={{ fontSize: 14, color: "#991B1B", fontWeight: 500 }}>
            <strong>{stats.expired} produit(s) expiré(s)</strong> — Ces produits doivent être retirés immédiatement de la zone de stockage.
          </span>
        </div>
      )}
      {stats.critical > 0 && (
        <div style={{ background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <i className="ti ti-bell-ringing" style={{ fontSize: 20, color: "#D97706" }} />
          <span style={{ fontSize: 14, color: "#92400E", fontWeight: 500 }}>
            <strong>{stats.critical} produit(s)</strong> expirent dans moins de 3 jours — Vérifiez et consommez en priorité.
          </span>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <i className="ti ti-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: COLORS.gray500, fontSize: 16 }} />
          <input style={{ ...inputStyle, paddingLeft: 36 }} placeholder="Rechercher un produit ou fournisseur..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select style={{ ...inputStyle, flex: "0 0 190px" }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option>Toutes</option>
          {CATEGORIES_PRODUITS.map(c => <option key={c}>{c}</option>)}
        </select>
        <select style={{ ...inputStyle, flex: "0 0 140px" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option>Tous</option>
          <option>Expiré</option>
          <option>Critique</option>
          <option>Attention</option>
          <option>OK</option>
        </select>
        <button onClick={() => setShowAdd(!showAdd)} style={primaryBtnStyle}>
          <i className="ti ti-plus" style={{ fontSize: 15 }} /> Ajouter un produit
        </button>
      </div>

      {showAdd && (
        <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.gray200}`, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600, color: COLORS.gray900 }}>Nouveau produit</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <div><label style={labelStyle}>Nom du produit *</label><input style={inputStyle} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Ex : Poulet rôti" /></div>
            <div><label style={labelStyle}>Catégorie</label><select style={inputStyle} value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })}><option value="">Sélectionner...</option>{CATEGORIES_PRODUITS.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label style={labelStyle}>DLC *</label><input style={inputStyle} type="date" value={form.dlc} onChange={e => setForm({ ...form, dlc: e.target.value })} /></div>
            <div><label style={labelStyle}>Fournisseur</label><input style={inputStyle} value={form.fournisseur} onChange={e => setForm({ ...form, fournisseur: e.target.value })} placeholder="Ex : Metro" /></div>
            <div><label style={labelStyle}>N° de lot</label><input style={inputStyle} value={form.numero_lot} onChange={e => setForm({ ...form, numero_lot: e.target.value })} placeholder="Ex : LOT-2024-001" /></div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}><label style={labelStyle}>Quantité</label><input style={inputStyle} value={form.quantite} onChange={e => setForm({ ...form, quantite: e.target.value })} placeholder="Ex : 2.5" /></div>
              <div style={{ width: 110 }}><label style={labelStyle}>Unité</label><select style={inputStyle} value={form.unite} onChange={e => setForm({ ...form, unite: e.target.value })}>{UNITES.map(u => <option key={u}>{u}</option>)}</select></div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
            <button onClick={() => { setShowAdd(false); setForm(EMPTY_PRODUCT_FORM); }} style={secondaryBtnStyle}>Annuler</button>
            <button onClick={handleAdd} disabled={saving || !form.nom || !form.dlc} style={{ ...primaryBtnStyle, opacity: (saving || !form.nom || !form.dlc) ? 0.6 : 1 }}>
              {saving ? <Spinner size={14} color="#fff" /> : <i className="ti ti-device-floppy" style={{ fontSize: 14 }} />}
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {editing && (
        <div style={{ background: COLORS.white, borderRadius: 14, border: `2px solid ${COLORS.primaryLight}`, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: COLORS.primaryLight + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="ti ti-pencil" style={{ fontSize: 15, color: COLORS.primaryLight }} />
            </div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: COLORS.gray900 }}>Modifier — {editing.nom}</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <div><label style={labelStyle}>Nom du produit *</label><input style={inputStyle} value={editForm.nom} onChange={e => setEditForm({ ...editForm, nom: e.target.value })} /></div>
            <div><label style={labelStyle}>Catégorie</label><select style={inputStyle} value={editForm.categorie} onChange={e => setEditForm({ ...editForm, categorie: e.target.value })}><option value="">Sélectionner...</option>{CATEGORIES_PRODUITS.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label style={labelStyle}>DLC *</label><input style={inputStyle} type="date" value={editForm.dlc} onChange={e => setEditForm({ ...editForm, dlc: e.target.value })} /></div>
            <div><label style={labelStyle}>Fournisseur</label><input style={inputStyle} value={editForm.fournisseur} onChange={e => setEditForm({ ...editForm, fournisseur: e.target.value })} /></div>
            <div><label style={labelStyle}>N° de lot</label><input style={inputStyle} value={editForm.numero_lot} onChange={e => setEditForm({ ...editForm, numero_lot: e.target.value })} /></div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}><label style={labelStyle}>Quantité</label><input style={inputStyle} value={editForm.quantite} onChange={e => setEditForm({ ...editForm, quantite: e.target.value })} /></div>
              <div style={{ width: 110 }}><label style={labelStyle}>Unité</label><select style={inputStyle} value={editForm.unite} onChange={e => setEditForm({ ...editForm, unite: e.target.value })}>{UNITES.map(u => <option key={u}>{u}</option>)}</select></div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
            <button onClick={() => setEditing(null)} style={secondaryBtnStyle}>Annuler</button>
            <button onClick={handleUpdate} disabled={saving || !editForm.nom || !editForm.dlc} style={{ ...primaryBtnStyle, opacity: (saving || !editForm.nom || !editForm.dlc) ? 0.6 : 1 }}>
              {saving ? <Spinner size={14} color="#fff" /> : <i className="ti ti-pencil-check" style={{ fontSize: 14 }} />}
              Mettre à jour
            </button>
          </div>
        </div>
      )}

      <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.gray200}`, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
          <thead>
            <tr style={{ background: COLORS.gray50, borderBottom: `2px solid ${COLORS.gray200}` }}>
              {["Produit", "Catégorie", "Fournisseur", "N° Lot", "DLC", "Statut", "Quantité", ""].map(h => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: COLORS.gray500, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const s = getDlcStatus(p.dlc);
              return (
                <tr key={p.id}
                  style={{ borderBottom: `1px solid ${COLORS.gray100}`, background: s.days < 0 ? "#FFF5F5" : "transparent" }}
                  onMouseEnter={e => e.currentTarget.style.background = COLORS.gray50}
                  onMouseLeave={e => e.currentTarget.style.background = s.days < 0 ? "#FFF5F5" : ""}>
                  <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: COLORS.gray900 }}>{p.nom}</td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: COLORS.gray500 }}>{p.categorie || "—"}</td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: COLORS.gray500 }}>{p.fournisseur || "—"}</td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: COLORS.gray500, fontFamily: "monospace" }}>{p.numero_lot || "—"}</td>
                  <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 500, color: COLORS.gray700 }}>
                    {new Date(p.dlc + "T00:00:00").toLocaleDateString("fr-FR")}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, color: s.color, background: s.bg, border: `1px solid ${s.color}30`, whiteSpace: "nowrap" }}>
                      <i className={`ti ${s.icon}`} style={{ fontSize: 11 }} />
                      {s.label}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: COLORS.gray700 }}>
                    {p.quantite ? `${p.quantite} ${p.unite}` : "—"}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openEdit(p)}
                        style={{ background: COLORS.primary + "15", border: `1px solid ${COLORS.primary}30`, color: COLORS.primary, borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                        <i className="ti ti-pencil" style={{ fontSize: 13 }} /> Modifier
                      </button>
                      {(currentUser.role === "Administrateur" || currentUser.role === "Superviseur") && (
                        <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                          style={{ background: COLORS.dangerLight, border: `1px solid ${COLORS.danger}30`, color: COLORS.danger, borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, opacity: deleting === p.id ? 0.6 : 1 }}>
                          {deleting === p.id ? <Spinner size={12} color={COLORS.danger} /> : <i className="ti ti-trash" style={{ fontSize: 13 }} />}
                          Supprimer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: COLORS.gray500 }}>
            <i className="ti ti-package-off" style={{ fontSize: 32, display: "block", marginBottom: 8 }} />
            {products.length === 0
              ? "Aucun produit enregistré. Cliquez sur « Ajouter un produit » pour commencer."
              : "Aucun produit ne correspond aux filtres sélectionnés."}
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, color: COLORS.gray500 }}>{filtered.length} produit(s) affiché(s)</div>
    </div>
  );
}

// ─── PAGE AUTHENTIFICATION ───────────────────────────────────────────────────

function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ nom: "", prenom: "", email: "", password: "", confirm: "", role: "Contrôleur" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    if (mode === "login") {
      if (!form.email || !form.password) return setError("Veuillez remplir tous les champs.");
      setLoading(true);
      const { data, error: e } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (e) { setError("Email ou mot de passe incorrect."); setLoading(false); return; }
      const { data: profil } = await supabase.from("profils").select("*").eq("id", data.user.id).single();
      onAuth(profil || { id: data.user.id, email: data.user.email, nom: "Utilisateur", prenom: "", role: "Contrôleur" });
    } else {
      if (!form.nom || !form.prenom || !form.email || !form.password) return setError("Veuillez remplir tous les champs.");
      if (form.password !== form.confirm) return setError("Les mots de passe ne correspondent pas.");
      if (form.password.length < 6) return setError("Mot de passe minimum 6 caractères.");
      setLoading(true);
      const { data, error: e } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { nom: form.nom, prenom: form.prenom, role: form.role } }
      });
      if (e) { setError(e.message); setLoading(false); return; }
      setSuccess("Compte créé ! Vérifiez votre email pour confirmer votre inscription.");
      setLoading(false);
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
              <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }} style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13, transition: "all 0.2s", background: mode === m ? COLORS.white : "transparent", color: mode === m ? COLORS.primary : COLORS.gray500, boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,0.08)" : "none" }}>
                {m === "login" ? "Connexion" : "Inscription"}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "register" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={labelStyle}>Nom *</label><input style={inputStyle} placeholder="Dupont" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} /></div>
                <div><label style={labelStyle}>Prénom *</label><input style={inputStyle} placeholder="Jean" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} /></div>
              </div>
            )}
            <div><label style={labelStyle}>Email *</label><input style={inputStyle} type="email" placeholder="jean.dupont@example.fr" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div>
              <label style={labelStyle}>Mot de passe *</label>
              <div style={{ position: "relative" }}>
                <input style={{ ...inputStyle, paddingRight: 40 }} type={showPass ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: COLORS.gray500 }}>
                  <i className={`ti ${showPass ? "ti-eye-off" : "ti-eye"}`} style={{ fontSize: 16 }} />
                </button>
              </div>
            </div>
            {mode === "register" && (
              <>
                <div><label style={labelStyle}>Confirmer le mot de passe *</label><input style={inputStyle} type="password" placeholder="••••••••" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} /></div>
                <div><label style={labelStyle}>Rôle</label><select style={inputStyle} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>{ROLES.map(r => <option key={r}>{r}</option>)}</select></div>
              </>
            )}
          </div>
          {error && <div style={{ background: COLORS.dangerLight, border: `1px solid ${COLORS.danger}30`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: COLORS.danger, marginTop: 14, display: "flex", alignItems: "center", gap: 8 }}><i className="ti ti-alert-circle" style={{ fontSize: 15 }} /> {error}</div>}
          {success && <div style={{ background: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#065F46", marginTop: 14, display: "flex", alignItems: "center", gap: 8 }}><i className="ti ti-circle-check" style={{ fontSize: 15 }} /> {success}</div>}
          <button onClick={handleSubmit} disabled={loading} style={{ ...primaryBtnStyle, width: "100%", justifyContent: "center", marginTop: 20, padding: "13px 0", fontSize: 15, borderRadius: 10, background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`, opacity: loading ? 0.8 : 1 }}>
            {loading ? <Spinner size={18} color="#fff" /> : <i className={`ti ${mode === "login" ? "ti-login" : "ti-user-check"}`} style={{ fontSize: 17 }} />}
            {mode === "login" ? "Se connecter" : "Créer mon compte"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [products, setProducts] = useState([]);
  const [active, setActive] = useState("dashboard");
  const [selectedControl, setSelectedControl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Vérifier session existante au démarrage
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: profil } = await supabase.from("profils").select("*").eq("id", session.user.id).single();
        setUser(profil || { id: session.user.id, email: session.user.email, nom: "Utilisateur", prenom: "", role: "Contrôleur" });
      }
      setInitializing(false);
    });
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") { setUser(null); setRecords([]); }
    });
  }, []);

  // Charger les contrôles HACCP depuis Supabase
  const loadRecords = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("controles").select("*").order("planned_date", { ascending: true });
    if (!error && data) setRecords(data);
    setLoading(false);
  }, []);

  // Initialiser les contrôles si la base est vide
  const initializeControls = useCallback(async () => {
    const { count } = await supabase.from("controles").select("*", { count: "exact", head: true });
    if (count === 0) {
      const today = new Date();
      const rows = [];
      HACCP_CATEGORIES.forEach(cat => {
        cat.controls.forEach(ctrl => {
          const planned = new Date(today);
          planned.setDate(planned.getDate() + Math.floor(Math.random() * 14) - 3);
          rows.push({
            control_id: ctrl.id, category_id: cat.id, category_name: cat.name,
            name: ctrl.name, description: ctrl.description, criticality: ctrl.criticality,
            status: "Non fait", planned_date: planned.toISOString().split("T")[0],
          });
        });
      });
      await supabase.from("controles").insert(rows);
    }
    loadRecords();
  }, [loadRecords]);

  const loadProducts = useCallback(async () => {
    const { data } = await supabase.from("produits").select("*").order("dlc", { ascending: true });
    if (data) setProducts(data);
  }, []);

  useEffect(() => {
    if (user) { initializeControls(); loadProducts(); }
  }, [user, initializeControls, loadProducts]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null); setRecords([]); setProducts([]);
  };

  const handleSaveControl = (updated) => {
    setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const lateCount = records.filter(r => r.status === "Non fait" && r.planned_date < todayStr).length;
  const expiringCount = products.filter(p => getDlcStatus(p.dlc).days <= 3).length;
  const pageTitle = { dashboard: "Tableau de bord", controls: "Contrôles HACCP", produits: "Produits & DLC", categories: "Catégories", history: "Historique", users: "Utilisateurs" };

  if (initializing) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.gray50 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, background: COLORS.accent, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <i className="ti ti-shield-check" style={{ fontSize: 24, color: "#fff" }} />
          </div>
          <Spinner size={28} color={COLORS.primary} />
          <p style={{ marginTop: 12, color: COLORS.gray500, fontSize: 14 }}>Chargement de SoftControl…</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage onAuth={setUser} />;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: COLORS.gray50 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Sidebar active={active} setActive={setActive} user={user} onLogout={handleLogout} lateCount={lateCount} expiringCount={expiringCount} />
      <div style={{ marginLeft: 240, flex: 1, padding: "24px 28px", minWidth: 0 }}>
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: COLORS.gray900 }}>{pageTitle[active]}</h1>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: COLORS.gray500 }}>{new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative" }}>
              <button style={{ background: COLORS.white, border: `1px solid ${COLORS.gray200}`, borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: COLORS.gray700 }}>
                <i className="ti ti-bell" style={{ fontSize: 18 }} />
              </button>
              {lateCount > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: COLORS.danger, color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{lateCount}</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: COLORS.white, border: `1px solid ${COLORS.gray200}`, borderRadius: 10, padding: "6px 12px" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>{user.prenom?.[0]}{user.nom?.[0]}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.gray900 }}>{user.prenom} {user.nom}</div>
                <div style={{ fontSize: 11, color: COLORS.gray500 }}>{user.role}</div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}><Spinner size={32} /></div>
        ) : (
          <>
            {active === "dashboard"  && <Dashboard records={records} products={products} onOpenControl={setSelectedControl} />}
            {active === "controls"   && <ControlsList records={records} onOpenControl={setSelectedControl} />}
            {active === "categories" && <CategoriesPage records={records} onOpenControl={setSelectedControl} />}
            {active === "history"    && <HistoryPage records={records} />}
            {active === "produits"   && <ProductsPage currentUser={user} />}
            {active === "users"      && <UsersPage currentUser={user} />}
          </>
        )}
      </div>
      {selectedControl && (
        <ControlModal record={selectedControl} onClose={() => setSelectedControl(null)} onSave={handleSaveControl} />
      )}
    </div>
  );
}
