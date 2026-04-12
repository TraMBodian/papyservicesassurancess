import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, Shield, FileText, Banknote,
  Stethoscope, ClipboardList, Loader2, RefreshCw,
  UserCheck, AlertTriangle, WifiOff,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { MOCK_DASHBOARD, MOCK_SINISTRES, MOCK_PRESTATAIRES, MOCK_CONSULTATIONS, MOCK_USERS } from "@/services/mockData";

// ─── Couleurs ────────────────────────────────────────────────────────────────

const PIE_COLORS   = ["#F59E0B", "#3B82F6", "#10B981", "#EF4444", "#8B5CF6"];
const AREA_COLORS  = { sinistres: "#3B82F6", remboursements: "#8B5CF6", enAttente: "#F59E0B" };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtFcfa(val: number) {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M FCFA`;
  if (val >= 1_000)     return `${(val / 1_000).toFixed(0)}k FCFA`;
  return `${val} FCFA`;
}

function variation(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round((curr - prev) / prev * 100);
}

// ─── Composant card KPI ──────────────────────────────────────────────────────

function KpiCard({
  title, value, sub, icon, color, trend, delay,
}: {
  title: string; value: string; sub?: string;
  icon: React.ReactNode; color: string;
  trend?: { value: number; label: string };
  delay?: number;
}) {
  const up = (trend?.value ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay ?? 0 }}
      className="bg-card rounded-xl border border-border p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`p-2.5 rounded-lg ${color} flex-shrink-0`}>{icon}</div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
            up ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
          }`}>
            {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <p className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900 mt-3 leading-none truncate">{value}</p>
      <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">{title}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5 opacity-70">{sub}</p>}
      {trend !== undefined && (
        <p className="text-xs text-muted-foreground mt-1 opacity-60">{trend.label}</p>
      )}
    </motion.div>
  );
}

// ─── Données mock pour mode démo ─────────────────────────────────────────────

function buildMockStats() {
  const sinMois = MOCK_DASHBOARD.chartData.map(c => ({
    mois: c.mois,
    sinistres: c.sinistres,
    enAttente: Math.round(c.sinistres * 0.3),
  }));
  const statuts = [
    { name: "En attente", value: MOCK_SINISTRES.filter(s => s.statut === "EN_ATTENTE").length },
    { name: "En cours",   value: MOCK_SINISTRES.filter(s => s.statut === "EN_COURS").length },
    { name: "Approuvé",   value: MOCK_SINISTRES.filter(s => s.statut === "APPROUVE").length },
    { name: "Payé",       value: MOCK_SINISTRES.filter(s => s.statut === "PAYE").length },
    { name: "Rejeté",     value: MOCK_SINISTRES.filter(s => s.statut === "REJETE").length },
  ].filter(s => s.value > 0);

  // Top prestataires : compter les consultations
  const countMap: Record<string, number> = {};
  MOCK_CONSULTATIONS.forEach(c => {
    const n = c.prestataire.nom;
    countMap[n] = (countMap[n] || 0) + 1;
  });
  const topPrest = Object.entries(countMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nom, consultations]) => ({ nom: nom.replace(/^(Hôpital|Clinique|Cabinet|Pharmacie|Laboratoire|Polyclinique)\s*/i, "").slice(0, 20), consultations }));

  const totalPaye    = MOCK_DASHBOARD.montantRembourse;
  const totalReclame = MOCK_SINISTRES.reduce((s, sin) => s + sin.montantReclamation, 0);
  const totalAccorde = MOCK_SINISTRES.filter(s => s.montantAccorde).reduce((s, sin) => s + (sin.montantAccorde || 0), 0);

  const adminCount = MOCK_USERS.filter(u => u.role === "ADMIN").length;
  const prestCount = MOCK_USERS.filter(u => u.role === "PRESTATAIRE").length;
  const clientCount = MOCK_USERS.filter(u => u.role === "CLIENT").length;
  const pendingCount = MOCK_USERS.filter(u => u.statut === "PENDING").length;

  return {
    totalAssures:    MOCK_DASHBOARD.totalAssures,
    totalPolices:    MOCK_DASHBOARD.totalPolices,
    totalSinistres:  MOCK_DASHBOARD.totalSinistres,
    tendances: {
      sinistresThisMonth:     MOCK_DASHBOARD.chartData.at(-1)?.sinistres ?? 0,
      sinistresLastMonth:     MOCK_DASHBOARD.chartData.at(-2)?.sinistres ?? 0,
      consultationsThisMonth: 2,
      consultationsLastMonth: 3,
    },
    financier: {
      totalReclame,
      totalAccorde,
      totalPaye,
      tauxApprobation: totalReclame > 0 ? Math.round(totalAccorde / totalReclame * 100) : 0,
    },
    userStats: {
      total:        MOCK_USERS.length,
      admins:       adminCount,
      prestataires: prestCount,
      clients:      clientCount,
      pending:      pendingCount,
      actifs:       MOCK_USERS.filter(u => u.statut === "ACTIVE").length,
    },
    sinistresParMois:  sinMois,
    sinistresByStatut: statuts,
    topPrestataires:   topPrest,
  };
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function StatistiquesPage() {
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo,  setIsDemo]  = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    setIsDemo(false);
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 8_000);

    fetch(
      `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api"}/stats`,
      { signal: ctrl.signal }
    )
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(json => setData(json?.data ?? json))
      .catch(() => {
        // Backend indisponible → mode démo avec données mock
        setData(buildMockStats());
        setIsDemo(true);
      })
      .finally(() => { clearTimeout(tid); setLoading(false); });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AppLayout title="Statistiques">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <p className="text-sm text-muted-foreground">Calcul des statistiques…</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Computed ─────────────────────────────────────────────────────────────
  const t   = data.tendances    ?? {};
  const fin = data.financier    ?? {};
  const us  = data.userStats    ?? {};
  const sinMois   = data.sinistresParMois  ?? [];
  const sinStatut = data.sinistresByStatut ?? [];
  const topPrest  = data.topPrestataires  ?? [];

  const varSin  = variation(t.sinistresThisMonth    ?? 0, t.sinistresLastMonth    ?? 0);
  const varCon  = variation(t.consultationsThisMonth ?? 0, t.consultationsLastMonth ?? 0);
  const tauxRem = fin.totalReclame > 0
    ? Math.round(Number(fin.totalPaye) / Number(fin.totalReclame) * 100)
    : 0;

  return (
    <AppLayout title="Statistiques & Analyses">
      <div className="space-y-6">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 truncate">Tableau analytique</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {isDemo ? "Données de démonstration (backend indisponible)" : "Données en temps réel depuis la base de données"}
            </p>
          </div>
          <button
            onClick={fetchData}
            title="Actualiser"
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* ── Bannière mode démo ─────────────────────────────────────────── */}
        {isDemo && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            <WifiOff size={16} className="shrink-0 text-amber-600" />
            <span>
              <strong>Mode démonstration</strong> — Le serveur est temporairement indisponible.
              Les données affichées sont des exemples.
            </span>
            <button onClick={fetchData} className="ml-auto shrink-0 text-xs underline hover:no-underline">
              Réessayer
            </button>
          </div>
        )}

        {/* ── KPI principaux ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard
            title="Assurés"
            value={String(data.totalAssures ?? 0)}
            icon={<Users size={20} className="text-blue-600" />}
            color="bg-blue-50"
            delay={0}
          />
          <KpiCard
            title="Polices actives"
            value={String(data.totalPolices ?? 0)}
            icon={<Shield size={20} className="text-purple-600" />}
            color="bg-purple-50"
            delay={0.06}
          />
          <KpiCard
            title="Sinistres ce mois"
            value={String(t.sinistresThisMonth ?? 0)}
            icon={<FileText size={20} className="text-orange-500" />}
            color="bg-orange-50"
            trend={{ value: varSin, label: "vs mois dernier" }}
            delay={0.12}
          />
          <KpiCard
            title="Consultations ce mois"
            value={String(t.consultationsThisMonth ?? 0)}
            icon={<ClipboardList size={20} className="text-teal-600" />}
            color="bg-teal-50"
            trend={{ value: varCon, label: "vs mois dernier" }}
            delay={0.18}
          />
        </div>

        {/* ── Indicateurs financiers ────────────────────────────────────── */}
        <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 sm:gap-4">
          <KpiCard
            title="Montant total réclamé"
            value={fmtFcfa(Number(fin.totalReclame ?? 0))}
            icon={<AlertTriangle size={20} className="text-red-500" />}
            color="bg-red-50"
            delay={0.22}
          />
          <KpiCard
            title="Montant accordé"
            value={fmtFcfa(Number(fin.totalAccorde ?? 0))}
            icon={<UserCheck size={20} className="text-emerald-600" />}
            color="bg-emerald-50"
            delay={0.26}
          />
          <KpiCard
            title="Montant remboursé (payé)"
            value={fmtFcfa(Number(fin.totalPaye ?? 0))}
            sub={`Taux : ${tauxRem}% des réclamations`}
            icon={<Banknote size={20} className="text-green-600" />}
            color="bg-green-50"
            delay={0.30}
          />
        </div>

        {/* ── Graphiques ligne 1 ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

          {/* Sinistres par mois */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}
            className="lg:col-span-2 bg-card rounded-xl border border-border p-4 sm:p-5 shadow-sm"
          >
            <div className="mb-4">
              <h3 className="font-semibold text-sm sm:text-base text-gray-900">Évolution des sinistres</h3>
              <p className="text-xs text-muted-foreground mt-0.5">6 derniers mois — sinistres, remboursements et dossiers en attente</p>
            </div>
            {sinMois.length > 0 ? (
              <div className="h-52 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sinMois} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gSin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={AREA_COLORS.sinistres}      stopOpacity={0.15} />
                        <stop offset="95%" stopColor={AREA_COLORS.sinistres}      stopOpacity={0}    />
                      </linearGradient>
                      <linearGradient id="gAtt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={AREA_COLORS.enAttente}     stopOpacity={0.15} />
                        <stop offset="95%" stopColor={AREA_COLORS.enAttente}     stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="mois" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                      cursor={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Area type="monotone" dataKey="sinistres"  name="Sinistres"    stroke={AREA_COLORS.sinistres}  fill="url(#gSin)" strokeWidth={2} dot={{ r: 3 }} />
                    <Area type="monotone" dataKey="enAttente"  name="En attente"   stroke={AREA_COLORS.enAttente}  fill="url(#gAtt)" strokeWidth={2} dot={{ r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
                Aucune donnée disponible
              </div>
            )}
          </motion.div>

          {/* Répartition statuts */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.40 }}
            className="bg-card rounded-xl border border-border p-4 sm:p-5 shadow-sm"
          >
            <div className="mb-4">
              <h3 className="font-semibold text-sm sm:text-base text-gray-900">Statuts des sinistres</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Répartition actuelle</p>
            </div>
            {sinStatut.length > 0 ? (
              <>
                <div className="h-44 sm:h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sinStatut}
                        cx="50%" cy="50%"
                        innerRadius="38%" outerRadius="68%"
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {sinStatut.map((_: any, i: number) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid #e5e7eb" }}
                        formatter={(v: number, n: string) => [`${v} dossier${v > 1 ? "s" : ""}`, n]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 mt-2">
                  {sinStatut.map((s: any, i: number) => (
                    <div key={s.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-gray-600">{s.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{s.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">
                Aucun sinistre
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Graphiques ligne 2 ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">

          {/* Top prestataires */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }}
            className="bg-card rounded-xl border border-border p-4 sm:p-5 shadow-sm"
          >
            <div className="mb-4">
              <h3 className="font-semibold text-sm sm:text-base text-gray-900">Top prestataires</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Classés par nombre de consultations</p>
            </div>
            {topPrest.length > 0 ? (
              <div className="h-52 sm:h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topPrest}
                    layout="vertical"
                    margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="nom"
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid #e5e7eb" }}
                      formatter={(v: number) => [`${v} consultation${v > 1 ? "s" : ""}`, ""]}
                    />
                    <Bar dataKey="consultations" fill="#6366F1" radius={[0, 4, 4, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-52 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Stethoscope size={32} className="opacity-30" />
                <p className="text-sm">Aucune consultation enregistrée</p>
              </div>
            )}
          </motion.div>

          {/* Utilisateurs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.50 }}
            className="bg-card rounded-xl border border-border p-4 sm:p-5 shadow-sm"
          >
            <div className="mb-5">
              <h3 className="font-semibold text-sm sm:text-base text-gray-900">Utilisateurs de la plateforme</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{us.total ?? 0} compte{(us.total ?? 0) > 1 ? "s" : ""} enregistrés</p>
            </div>

            <div className="space-y-3">
              {[
                { label: "Clients",       value: us.clients      ?? 0, total: us.total ?? 1, color: "bg-emerald-500" },
                { label: "Prestataires",  value: us.prestataires ?? 0, total: us.total ?? 1, color: "bg-purple-500"  },
                { label: "Administrateurs", value: us.admins     ?? 0, total: us.total ?? 1, color: "bg-blue-500"    },
                { label: "En attente",    value: us.pending      ?? 0, total: us.total ?? 1, color: "bg-orange-400"  },
              ].map(row => {
                const pct = us.total > 0 ? Math.round(row.value / us.total * 100) : 0;
                return (
                  <div key={row.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-600 font-medium">{row.label}</span>
                      <span className="text-gray-900 font-semibold">{row.value} <span className="font-normal text-muted-foreground">({pct}%)</span></span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${row.color} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{us.actifs ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Comptes actifs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-500">{us.pending ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">En attente d'activation</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Taux d'approbation ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.54 }}
          className="bg-card rounded-xl border border-border p-4 sm:p-5 shadow-sm"
        >
          <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-4">Indicateurs financiers des sinistres</h3>
          <div className="grid grid-cols-1 xs:grid-cols-3 gap-4 sm:gap-6">
            {[
              { label: "Taux d'approbation",  value: fin.tauxApprobation ?? 0, color: "bg-blue-500",   desc: "Sinistres approuvés ou payés" },
              { label: "Taux de remboursement", value: tauxRem,                 color: "bg-green-500",  desc: "Montant payé / réclamé"       },
              { label: "Dossiers résolus",
                value: data.totalSinistres > 0
                  ? Math.round((sinStatut.filter((s: any) => s.name === "Payé" || s.name === "Approuvé")
                      .reduce((acc: number, s: any) => acc + s.value, 0) / data.totalSinistres) * 100)
                  : 0,
                color: "bg-purple-500",
                desc: "Approuvés + payés / total",
              },
            ].map(ind => (
              <div key={ind.label}>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-medium text-gray-700">{ind.label}</span>
                  <span className="text-2xl font-bold text-gray-900">{ind.value}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${ind.color} transition-all duration-1000`}
                    style={{ width: `${Math.min(ind.value, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">{ind.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </AppLayout>
  );
}
