import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search, Download, QrCode, Loader2, ServerCrash, Users,
} from "@/components/ui/Icons";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { DataService } from "@/services/dataService";
import { useAuth } from "@/context/AuthContext";

// ─── QR ──────────────────────────────────────────────────────────────────────
const qrUrl = (data: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(data)}&bgcolor=ffffff&color=1B5299&margin=4`;

// ─── Puce bancaire SVG ────────────────────────────────────────────────────────
function ChipSVG() {
  return (
    <svg width="44" height="34" viewBox="0 0 50 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect x="1" y="1" width="48" height="36" rx="5" fill="#D4A017" stroke="#B8860B" strokeWidth="1.5"/>
      <rect x="16" y="1" width="18" height="36" fill="#C49A10"/>
      <rect x="1" y="12" width="48" height="14" fill="#C49A10"/>
      <rect x="16" y="12" width="18" height="14" fill="#B8860B"/>
      <rect x="18" y="14" width="14" height="10" rx="1" fill="#D4A017" stroke="#B8860B" strokeWidth="0.8"/>
      <line x1="1" y1="12" x2="16" y2="12" stroke="#B8860B" strokeWidth="0.8"/>
      <line x1="34" y1="12" x2="49" y2="12" stroke="#B8860B" strokeWidth="0.8"/>
      <line x1="1" y1="26" x2="16" y2="26" stroke="#B8860B" strokeWidth="0.8"/>
      <line x1="34" y1="26" x2="49" y2="26" stroke="#B8860B" strokeWidth="0.8"/>
    </svg>
  );
}

// ─── Carte visuelle ───────────────────────────────────────────────────────────
function InsuranceCard({ assure }: { assure: any }) {
  const isFamille = String(assure.type ?? "").toUpperCase() === "FAMILLE";
  const isGroupe  = String(assure.type ?? "").toUpperCase() === "GROUPE";
  const bens: string[] = Array.isArray(assure.beneficiaires) ? assure.beneficiaires : [];

  const fmt = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString("fr-FR") : "—";

  const typeLabel = isGroupe ? "GROUPE" : isFamille ? "FAMILLE" : "INDIVIDUEL";

  const fields = isGroupe
    ? [
        { label: "Entreprise", value: assure.nom ?? "—" },
        { label: "Secteur",    value: assure.secteur ?? "—" },
        { label: "Employés",   value: String(assure.employes ?? "—") },
        { label: "Assurés",    value: String(assure.assures ?? bens.length || "—") },
      ]
    : [
        { label: "Sexe",       value: assure.sexe ?? "—" },
        { label: "Né(e) le",   value: fmt(assure.dateNaissance) },
        { label: "Téléphone",  value: assure.telephone ?? "—" },
        { label: "Garantie",   value: assure.garantie ?? "Standard" },
      ];

  return (
    /* padding-bottom trick = 540/856 ≈ 63.08 % — fonctionne dans tous les navigateurs */
    <div className="relative w-full rounded-2xl overflow-hidden select-none"
      style={{ paddingBottom: "63%", boxShadow: "0 16px 48px rgba(27,82,153,0.30)" }}>

      {/* Couche absolue qui remplit le parent */}
      <div className="absolute inset-0 bg-white flex flex-col">

        {/* ── Filigrane ──────────────────────────────────────────── */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
          style={{ opacity: 0.035 }}>
          <span className="font-black text-[#1B5299] leading-none" style={{ fontSize: "14vw" }}>PSA</span>
        </div>

        {/* ── Bande haute bleue ──────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 py-2 shrink-0" style={{ background: "#1B5299" }}>
          <img src="/logo1.png" alt="PSA" className="h-10 object-contain drop-shadow shrink-0"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <div className="flex-1 min-w-0">
            <p className="font-black text-white leading-tight text-xs sm:text-sm truncate">
              PAPY SERVICES ASSURANCES
            </p>
            <p className="text-white/80 text-[10px] sm:text-xs font-medium">
              CARTE D'ASSURANCE SANTÉ
            </p>
          </div>
          <span className="text-[10px] font-bold text-white bg-white/20 rounded px-2 py-0.5 shrink-0">
            {typeLabel}
          </span>
        </div>

        {/* ── Bande or (numéro) ──────────────────────────────────── */}
        <div className="px-4 py-1.5 shrink-0 flex items-center"
          style={{ background: "linear-gradient(90deg,#C49A10,#F0C430,#C49A10)" }}>
          <span className="font-black text-white tracking-widest text-xs sm:text-sm drop-shadow">
            {assure.numero ?? "PSA-0000-0000-0000"}
          </span>
        </div>

        {/* ── Corps principal ────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 gap-3 px-4 py-2">

          {/* Colonne gauche */}
          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            {/* Puce + nom */}
            <div className="flex items-center gap-2">
              <ChipSVG />
              <div className="min-w-0">
                <p className="text-[9px] text-gray-400 uppercase font-medium">Titulaire</p>
                <p className="font-black text-gray-900 uppercase text-xs sm:text-sm leading-tight truncate">
                  {assure.nom ?? "—"}
                </p>
                <p className="font-semibold text-gray-700 text-[10px] sm:text-xs truncate">
                  {assure.prenom ?? ""}
                </p>
              </div>
            </div>

            {/* Champs en grille */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1">
              {fields.map(f => (
                <div key={f.label}>
                  <p className="text-[8px] text-gray-400 uppercase font-medium leading-tight">{f.label}</p>
                  <p className="text-[10px] sm:text-xs font-semibold text-gray-800 truncate">{f.value}</p>
                </div>
              ))}
              <div>
                <p className="text-[8px] text-gray-400 uppercase font-medium leading-tight">Statut</p>
                <p className="text-[10px] sm:text-xs font-semibold text-green-600 truncate">{assure.statut ?? "—"}</p>
              </div>
              <div>
                <p className="text-[8px] text-gray-400 uppercase font-medium leading-tight">Valide jusqu'au</p>
                <p className="text-[10px] sm:text-xs font-semibold text-gray-800">
                  {assure.dateFin ? fmt(assure.dateFin) : "31/12/2026"}
                </p>
              </div>
            </div>

            {/* Bénéficiaires */}
            {isFamille && bens.length > 0 && (
              <div className="mt-1 pt-1 border-t border-gray-100">
                <p className="text-[8px] text-gray-400 uppercase font-medium mb-0.5">Bénéficiaires</p>
                <div className="flex flex-wrap gap-1">
                  {bens.slice(0, 4).map((b, i) => (
                    <span key={i} className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                      style={{ background: "#1B529915", color: "#1B5299" }}>
                      {String(b)}
                    </span>
                  ))}
                  {bens.length > 4 && (
                    <span className="text-[9px] text-gray-400">+{bens.length - 4}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Colonne droite : photo + QR */}
          <div className="flex flex-col gap-2 shrink-0 w-[18%] min-w-[60px] max-w-[100px]">
            {/* Photo */}
            <div className="rounded-lg overflow-hidden border-2 flex items-center justify-center bg-gray-100 shrink-0"
              style={{ borderColor: "#1B529940", aspectRatio: "3/4" }}>
              {assure.photo
                ? <img src={assure.photo} alt="photo" className="w-full h-full object-cover" />
                : (
                  <svg viewBox="0 0 24 24" fill="#CBD5E1" className="w-8 h-8">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                  </svg>
                )
              }
            </div>
            {/* QR code */}
            <div className="rounded border border-gray-200 bg-white p-0.5 shrink-0">
              <img src={qrUrl(assure.numero ?? "PSA")} alt="QR" className="w-full" crossOrigin="anonymous" />
            </div>
          </div>
        </div>

        {/* ── Pied de carte ──────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-1 shrink-0 border-t"
          style={{ background: "#1B52990A", borderColor: "#1B529920" }}>
          <span className="text-[8px] text-gray-400">
            Délivrée le {new Date().toLocaleDateString("fr-FR")}
          </span>
          <span className="text-[8px] font-semibold" style={{ color: "#1B5299" }}>
            papyservicesassurances.sn
          </span>
          <span className="text-[8px] text-gray-400 italic">Le Directeur Général</span>
        </div>

      </div>
    </div>
  );
}

// ─── Téléchargement canvas ────────────────────────────────────────────────────
async function downloadCard(assure: any) {
  const W = 1000, H = 630;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const BRAND = "#1B5299";
  const GOLD  = "#D4A017";
  const bens: string[] = Array.isArray(assure.beneficiaires) ? assure.beneficiaires : [];

  const loadImg = (src: string): Promise<HTMLImageElement | null> =>
    new Promise(resolve => {
      const img = new Image(); img.crossOrigin = "anonymous";
      img.onload  = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });

  const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  // Fond blanc
  ctx.fillStyle = "white"; roundRect(0, 0, W, H, 28); ctx.fill();

  // Filigrane
  ctx.save(); ctx.globalAlpha = 0.04;
  ctx.fillStyle = BRAND; ctx.font = "bold 260px Arial"; ctx.textAlign = "center";
  ctx.fillText("PSA", W / 2, H / 2 + 90);
  ctx.restore();

  // Bande bleue haute
  ctx.fillStyle = BRAND;
  ctx.fillRect(0, 0, W, 160);
  ctx.fillRect(0, 128, W, 32); // raccord arrondi bas

  // Logo
  const logo = await loadImg("/logo1.png");
  if (logo) ctx.drawImage(logo, 28, 14, 110, 110);

  ctx.fillStyle = "white"; ctx.textAlign = "left";
  ctx.font = "bold 26px Arial"; ctx.fillText("PAPY SERVICES ASSURANCES", 152, 68);
  ctx.font = "16px Arial"; ctx.globalAlpha = 0.85;
  ctx.fillText("CARTE D'ASSURANCE SANTÉ", 152, 92); ctx.globalAlpha = 1;

  const typeLabel = String(assure.type ?? "").toUpperCase() === "GROUPE" ? "GROUPE"
    : String(assure.type ?? "").toUpperCase() === "FAMILLE" ? "FAMILLE" : "INDIVIDUEL";
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  roundRect(W - 130, 24, 116, 28, 6); ctx.fill();
  ctx.fillStyle = "white"; ctx.font = "bold 13px Arial"; ctx.textAlign = "center";
  ctx.fillText(typeLabel, W - 72, 43); ctx.textAlign = "left";

  // Bande or
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, "#B8860B"); grad.addColorStop(0.5, "#F0C430"); grad.addColorStop(1, "#B8860B");
  ctx.fillStyle = grad; ctx.fillRect(0, 160, W, 60);
  ctx.fillStyle = "white"; ctx.font = "bold 28px monospace";
  ctx.fillText(assure.numero ?? "PSA-0000-0000-0000", 38, 200);

  // Puce
  const px = 38, py = 250;
  ctx.fillStyle = GOLD; roundRect(px, py, 60, 44, 5); ctx.fill();
  ctx.fillStyle = "#C49A10";
  ctx.fillRect(px + 16, py, 18, 44);
  ctx.fillRect(px, py + 14, 60, 16);
  ctx.fillStyle = GOLD; roundRect(px + 18, py + 16, 16, 10, 2); ctx.fill();

  // Photo
  const photoX = W - 175, photoY = 240, photoW = 140, photoH = 187;
  ctx.fillStyle = "#E5E7EB"; roundRect(photoX, photoY, photoW, photoH, 6); ctx.fill();
  if (assure.photo) {
    const photoImg = await loadImg(assure.photo);
    if (photoImg) {
      ctx.save(); roundRect(photoX, photoY, photoW, photoH, 6); ctx.clip();
      ctx.drawImage(photoImg, photoX, photoY, photoW, photoH); ctx.restore();
    }
  }
  ctx.strokeStyle = `${BRAND}55`; ctx.lineWidth = 2;
  roundRect(photoX, photoY, photoW, photoH, 6); ctx.stroke();

  // Champs texte
  const isGroupe = String(assure.type ?? "").toUpperCase() === "GROUPE";
  const fmt = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString("fr-FR") : "—";

  const col1 = isGroupe
    ? [["Entreprise", assure.nom], ["Secteur", assure.secteur ?? "—"]]
    : [["Nom", assure.nom ?? "—"], ["Prénoms", assure.prenom ?? "—"]];
  const col2 = isGroupe
    ? [["Employés", String(assure.employes ?? "—")], ["Assurés", String(assure.assures ?? bens.length || "—")]]
    : [["Sexe", assure.sexe ?? "—"], ["Né(e) le", fmt(assure.dateNaissance)]];
  const col3 = [
    ["Téléphone", assure.telephone ?? "—"],
    ["Garantie",  assure.garantie ?? "Standard"],
    ["Statut",    assure.statut ?? "—"],
    ["Valide",    assure.dateFin ? fmt(assure.dateFin) : "31/12/2026"],
  ];

  let y = 268;
  [[...col1, ...col2], col3].forEach((rows, colIdx) => {
    const x = colIdx === 0 ? px + 72 : 360;
    let ry = y;
    rows.forEach(([label, value]) => {
      ctx.fillStyle = "#9CA3AF"; ctx.font = "10px Arial"; ctx.textAlign = "left";
      ctx.fillText(String(label).toUpperCase(), x, ry);
      ctx.fillStyle = label === "Statut" ? "#059669" : "#111827";
      ctx.font = "bold 14px Arial";
      ctx.fillText(String(value ?? "—").substring(0, 24), x, ry + 17);
      ry += 40;
    });
  });

  // Bénéficiaires famille
  if (bens.length > 0) {
    ctx.fillStyle = "#9CA3AF"; ctx.font = "10px Arial";
    ctx.fillText("BÉNÉFICIAIRES", px + 72, 460);
    ctx.fillStyle = BRAND; ctx.font = "bold 12px Arial";
    ctx.fillText(bens.slice(0, 5).join("  ·  ").substring(0, 55), px + 72, 478);
  }

  // QR
  const qr = await loadImg(qrUrl(assure.numero ?? "PSA"));
  if (qr) {
    const qrX = photoX, qrY = photoY + photoH + 10, qrS = photoW;
    ctx.fillStyle = "white"; roundRect(qrX, qrY, qrS, qrS, 6); ctx.fill();
    ctx.strokeStyle = "#E5E7EB"; ctx.lineWidth = 1; roundRect(qrX, qrY, qrS, qrS, 6); ctx.stroke();
    ctx.drawImage(qr, qrX + 4, qrY + 4, qrS - 8, qrS - 8);
  }

  // Pied de carte
  ctx.fillStyle = "#1B52990D"; ctx.fillRect(0, H - 40, W, 40);
  ctx.strokeStyle = "#1B529922"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, H - 40); ctx.lineTo(W, H - 40); ctx.stroke();
  ctx.fillStyle = "#9CA3AF"; ctx.font = "10px Arial"; ctx.textAlign = "left";
  ctx.fillText(`Délivrée le ${new Date().toLocaleDateString("fr-FR")}`, 28, H - 13);
  ctx.fillStyle = BRAND; ctx.font = "bold 10px Arial"; ctx.textAlign = "center";
  ctx.fillText("www.papyservicesassurances.sn", W / 2, H - 13);
  ctx.fillStyle = "#9CA3AF"; ctx.font = "italic 10px Arial"; ctx.textAlign = "right";
  ctx.fillText("Le Directeur Général", W - 28, H - 13);

  // Clip arrondi final
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = "black"; roundRect(0, 0, W, H, 28); ctx.fill();

  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `carte-psa-${assure.numero ?? "assurance"}.png`; a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function CartesPage() {
  const { user } = useAuth();
  const isClient = user?.role === "client";

  const [search, setSearch]   = useState("");
  const [assures, setAssures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    DataService.getAssures()
      .then(list => {
        const all = list ?? [];
        setAssures(isClient ? all.filter((a: any) => a.email === user?.email) : all);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [isClient, user?.email]);

  const filtered = assures.filter(a =>
    (a.nom    ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (a.prenom ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (a.numero ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const pageTitle = isClient ? "Ma Carte d'assurance" : "Cartes d'assurance";

  if (loading) return (
    <AppLayout title={pageTitle}>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1B5299" }} />
        <span className="ml-3 text-sm text-muted-foreground">Chargement des cartes…</span>
      </div>
    </AppLayout>
  );

  if (error) return (
    <AppLayout title={pageTitle}>
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-4">
        <ServerCrash className="w-10 h-10 text-muted-foreground opacity-40" />
        <p className="font-semibold">Impossible de joindre le serveur</p>
        <p className="text-sm text-muted-foreground">Service temporairement indisponible</p>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout title={pageTitle}>
      <div className="space-y-5">

        {!isClient && (
          <div className="flex items-center gap-2 w-full max-w-sm">
            <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg border border-input bg-card text-sm">
              <Search size={15} className="text-muted-foreground shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un assuré…"
                className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-0"
              />
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              className="w-10 h-10 text-muted-foreground opacity-30">
              <rect x="2" y="5" width="20" height="14" rx="2"/>
              <path d="M2 10h20"/>
            </svg>
            <p className="font-semibold">
              {search ? "Aucun assuré trouvé"
                : isClient ? "Aucune carte pour votre compte"
                : "Aucun assuré enregistré"}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filtered.map((assure, i) => (
            <motion.div
              key={assure.id ?? i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="space-y-3"
            >
              <InsuranceCard assure={assure} />

              <div className="flex items-center gap-2 px-1">
                {Array.isArray(assure.beneficiaires) && assure.beneficiaires.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users size={13} />
                    <span>
                      {assure.beneficiaires.length} bénéficiaire
                      {assure.beneficiaires.length > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button size="sm" onClick={() => downloadCard(assure)} className="h-8 text-xs gap-1.5">
                    <Download size={13} /> Télécharger
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0"
                    onClick={() => window.open(qrUrl(assure.numero ?? "PSA"), "_blank")}>
                    <QrCode size={13} />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </AppLayout>
  );
}
