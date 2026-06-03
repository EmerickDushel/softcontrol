import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl     = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey     = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey    = Deno.env.get("RESEND_API_KEY")!;
    const fromEmail       = Deno.env.get("FROM_EMAIL") ?? "SoftControl <onboarding@resend.dev>";

    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    const j3 = new Date(today);
    j3.setDate(j3.getDate() + 3);
    const j3Str = j3.toISOString().split("T")[0];

    // Produits expirant dans <= 3 jours (alerte non encore envoyée)
    const { data: expiringProducts } = await supabase
      .from("produits")
      .select("*")
      .lte("dlc", j3Str)
      .eq("alerte_j3_envoyee", false);

    // Contrôles en retard (non réalisés à la date prévue)
    const { data: lateControls } = await supabase
      .from("controles")
      .select("*")
      .eq("status", "Non fait")
      .lt("planned_date", todayStr);

    // Admins et Superviseurs à notifier
    const { data: admins } = await supabase
      .from("profils")
      .select("email, nom, prenom")
      .in("role", ["Administrateur", "Superviseur"]);

    if (!admins || admins.length === 0) {
      return new Response(
        JSON.stringify({ message: "Aucun administrateur trouvé." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const hasAlerts =
      (expiringProducts && expiringProducts.length > 0) ||
      (lateControls && lateControls.length > 0);

    if (!hasAlerts) {
      return new Response(
        JSON.stringify({ message: "Aucune alerte à envoyer." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const dateLabel = new Date().toLocaleDateString("fr-FR", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    // Construction du HTML de l'email
    let html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;">
        <div style="background:#0F2D52;padding:24px 28px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">🛡️ SoftControl — Alertes HACCP</h1>
          <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:13px;">${dateLabel}</p>
        </div>
        <div style="background:#ffffff;padding:28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
    `;

    if (expiringProducts && expiringProducts.length > 0) {
      html += `
        <h2 style="color:#D97706;font-size:16px;margin:0 0 14px;display:flex;align-items:center;gap:8px;">
          ⚠️ Produits expirant bientôt (${expiringProducts.length})
        </h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:28px;font-size:13px;">
          <thead>
            <tr style="background:#FEF3C7;">
              <th style="padding:10px 12px;text-align:left;color:#92400E;font-size:11px;text-transform:uppercase;letter-spacing:.5px;">Produit</th>
              <th style="padding:10px 12px;text-align:left;color:#92400E;font-size:11px;text-transform:uppercase;letter-spacing:.5px;">Catégorie</th>
              <th style="padding:10px 12px;text-align:left;color:#92400E;font-size:11px;text-transform:uppercase;letter-spacing:.5px;">DLC</th>
              <th style="padding:10px 12px;text-align:left;color:#92400E;font-size:11px;text-transform:uppercase;letter-spacing:.5px;">Statut</th>
            </tr>
          </thead>
          <tbody>
      `;
      for (const p of expiringProducts) {
        const [y, m, d] = p.dlc.split("-").map(Number);
        const dlcDate  = new Date(y, m - 1, d);
        const diffDays = Math.ceil((dlcDate.getTime() - today.getTime()) / 86400000);
        const statut   = diffDays < 0
          ? `Expiré (${Math.abs(diffDays)}j)`
          : diffDays === 0 ? "Expire aujourd'hui !" : `J-${diffDays}`;
        const rowBg    = diffDays <= 0 ? "#FEE2E2" : "#FFFBEB";

        html += `
          <tr style="background:${rowBg};border-bottom:1px solid #e2e8f0;">
            <td style="padding:10px 12px;font-weight:600;">${p.nom}</td>
            <td style="padding:10px 12px;color:#64748B;">${p.categorie || "—"}</td>
            <td style="padding:10px 12px;">${dlcDate.toLocaleDateString("fr-FR")}</td>
            <td style="padding:10px 12px;font-weight:700;color:${diffDays <= 0 ? "#DC2626" : "#D97706"};">${statut}</td>
          </tr>
        `;
      }
      html += `</tbody></table>`;
    }

    if (lateControls && lateControls.length > 0) {
      html += `
        <h2 style="color:#DC2626;font-size:16px;margin:0 0 14px;">
          🔴 Contrôles en retard (${lateControls.length})
        </h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:28px;font-size:13px;">
          <thead>
            <tr style="background:#FEE2E2;">
              <th style="padding:10px 12px;text-align:left;color:#991B1B;font-size:11px;text-transform:uppercase;letter-spacing:.5px;">Contrôle</th>
              <th style="padding:10px 12px;text-align:left;color:#991B1B;font-size:11px;text-transform:uppercase;letter-spacing:.5px;">Catégorie</th>
              <th style="padding:10px 12px;text-align:left;color:#991B1B;font-size:11px;text-transform:uppercase;letter-spacing:.5px;">Date prévue</th>
              <th style="padding:10px 12px;text-align:left;color:#991B1B;font-size:11px;text-transform:uppercase;letter-spacing:.5px;">Criticité</th>
            </tr>
          </thead>
          <tbody>
      `;
      for (const c of lateControls) {
        html += `
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:10px 12px;font-weight:600;">${c.name}</td>
            <td style="padding:10px 12px;color:#64748B;">${c.category_name}</td>
            <td style="padding:10px 12px;color:#DC2626;font-weight:600;">${new Date(c.planned_date + "T00:00:00").toLocaleDateString("fr-FR")}</td>
            <td style="padding:10px 12px;">${c.criticality}</td>
          </tr>
        `;
      }
      html += `</tbody></table>`;
    }

    html += `
          <p style="font-size:12px;color:#94a3b8;margin:24px 0 0;text-align:center;border-top:1px solid #e2e8f0;padding-top:16px;">
            Cet email a été envoyé automatiquement par <strong>SoftControl HACCP Manager</strong>.<br/>
            Connectez-vous à l'application pour traiter ces alertes.
          </p>
        </div>
      </div>
    `;

    const nbProduits   = expiringProducts?.length ?? 0;
    const nbControles  = lateControls?.length ?? 0;
    const subject      = `⚠️ SoftControl — ${nbProduits} produit(s) à vérifier · ${nbControles} contrôle(s) en retard`;

    // Envoi à tous les admins/superviseurs
    await Promise.all(
      admins.map((admin) =>
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [admin.email],
            subject,
            html,
          }),
        })
      )
    );

    // Marquer les produits comme alertés
    if (expiringProducts && expiringProducts.length > 0) {
      await supabase
        .from("produits")
        .update({ alerte_j3_envoyee: true })
        .in("id", expiringProducts.map((p) => p.id));
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent: admins.length,
        productsAlerted: nbProduits,
        lateControls: nbControles,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
