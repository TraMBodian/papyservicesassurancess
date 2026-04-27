import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users, Shield, FileText, Banknote, Stethoscope, Pill,
  ClipboardList, Activity, Clock, Loader2, RefreshCw, ServerOff,
  TrendingUp, AlertTriangle, Plus, CheckCircle, XCircle, Eye,
  Bell, UserPlus, AlertCircle,
} from '@/components/ui/Icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/context/AuthContext';

interface SessionEntry {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  role: string;
  loginTime: string;
  lastActivity: string;
  active: boolean;
}
import { apiClient } from '@/services/apiClient';
import { DataService } from '@/services/dataService';
import { usePusherChannel } from '@/hooks/usePusherChannel';
import { CH, EV, type StatsPayload, type ActivityPayload } from '@/services/pusherService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalAssures: number;
  totalPolices: number;
  totalSinistres: number;
  totalPrestataires: number;
  totalConsultations: number;
  totalPrescriptions: number;
  sinistresEnAttente: number;
  sinistresApprouves: number;
  sinistresPaies: number;
  montantRembourse: number;
  recentActivity: Array<{
    id: number;
    action: string;
    detail: string;
    type: string;
    date: string | null;
    time?: string;
  }>;
  chartData: Array<{ mois: string; sinistres: number; remboursements: number }>;
}

const EMPTY: DashboardStats = {
  totalAssures: 0, totalPolices: 0, totalSinistres: 0,
  totalPrestataires: 0, totalConsultations: 0, totalPrescriptions: 0,
  sinistresEnAttente: 0, sinistresApprouves: 0, sinistresPaies: 0,
  montantRembourse: 0, recentActivity: [], chartData: [],
};

const PIE_COLORS = ['#F59E0B', '#8B5CF6', '#10B981'];

const STATUS_STYLE: Record<string, { badge: string; dot: string; label: string }> = {
  en_attente:  { badge: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-400', label: 'En attente' },
  en_cours:    { badge: 'bg-blue-100 text-blue-700 border-blue-200',       dot: 'bg-blue-400',   label: 'En cours' },
  approuve:    { badge: 'bg-green-100 text-green-700 border-green-200',    dot: 'bg-green-400',  label: 'Approuvé' },
  paye:        { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Payé' },
  rejete:      { badge: 'bg-red-100 text-red-700 border-red-200',          dot: 'bg-red-400',    label: 'Rejeté' },
  default:     { badge: 'bg-gray-100 text-gray-600 border-gray-200',       dot: 'bg-gray-400',   label: 'Inconnu' },
};

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  en_attente: <Clock size={14} />,
  en_cours:   <Activity size={14} />,
  approuve:   <CheckCircle size={14} />,
  paye:       <Banknote size={14} />,
  rejete:     <XCircle size={14} />,
  default:    <Activity size={14} />,
};

function formatMontant(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000)     return `${(val / 1_000).toFixed(0)}k`;
  return String(val);
}

const PROFILE_KEY = (id: string) => `user_profile_${id}`;

function getDisplayName(user: any): string {
  if (!user) return 'Utilisateur';
  try {
    const saved = user.id ? localStorage.getItem(PROFILE_KEY(user.id)) : null;
    if (saved) {
      const p = JSON.parse(saved);
      const name = `${p.prenom ?? ''} ${p.nom ?? ''}`.trim();
      if (name) return name;
    }
  } catch {}
  return user.full_name || user.fullName || user.email || 'Utilisateur';
}

function formatRelative(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return 'À l\'instant';
  if (diff < 3600)  return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// ─── Dashboard Header ─────────────────────────────────────────────────────────

function DashboardHeader({ user, onRefresh, liveFlash }: { user: any; onRefresh: () => void; liveFlash: boolean }) {
  const now = useMemo(() => new Date(), []);
  const dateLabel = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeLabel = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const roleLabel = user?.role === "admin" ? "Administrateur" : user?.role === "prestataire" ? "Prestataire" : "Client";
  const displayName = getDisplayName(user);

  return (
    <div className="flex items-center justify-between gap-4 pb-4 border-b border-border/60">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{displayName}</h1>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-brand/10 text-brand border border-brand/20">
            {roleLabel}
          </span>
          {liveFlash && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full animate-pulse">
              ⚡ Live
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
          <Activity size={11} className="text-green-500" />
          <span>Papy Services Assurances</span>
          <span className="text-border">·</span>
          <span className="capitalize">{dateLabel}</span>
          <span className="text-border">·</span>
          <Clock size={11} />
          <span>{timeLabel}</span>
        </p>
      </div>
      <button
        onClick={onRefresh}
        title="Actualiser les données"
        className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
      >
        <RefreshCw size={15} />
      </button>
    </div>
  );
}

// ─── Quick Actions (admin only) ───────────────────────────────────────────────

function QuickActions({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const actions = [
    { label: 'Ajouter assuré',      icon: <UserPlus size={15} />,    color: 'bg-blue-600 hover:bg-blue-700',     route: '/admin/assures/new' },
    { label: 'Créer contrat',       icon: <FileText size={15} />,    color: 'bg-purple-600 hover:bg-purple-700', route: '/admin/polices/new' },
    { label: 'Déclarer sinistre',   icon: <AlertCircle size={15} />, color: 'bg-orange-500 hover:bg-orange-600', route: '/sinistres' },
    { label: 'Nouveau prestataire', icon: <Plus size={15} />,        color: 'bg-teal-600 hover:bg-teal-700',     route: '/admin/prestataires/new' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(a => (
        <button
          key={a.label}
          onClick={() => navigate(a.route)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 ${a.color}`}
        >
          {a.icon}
          {a.label}
        </button>
      ))}
    </div>
  );
}

// ─── Admin Alerts ─────────────────────────────────────────────────────────────

function AdminAlerts({ stats }: { stats: DashboardStats }) {
  const alerts = [];

  if (stats.sinistresEnAttente > 0) {
    alerts.push({
      key: 'sinistres',
      color: 'bg-orange-50 border-orange-200 text-orange-800',
      icon: <Bell size={15} className="text-orange-500 shrink-0 mt-0.5" />,
      msg: `${stats.sinistresEnAttente} sinistre${stats.sinistresEnAttente > 1 ? 's' : ''} en attente de traitement.`,
    });
  }
  if (stats.totalPolices === 0 && stats.totalAssures > 0) {
    alerts.push({
      key: 'polices',
      color: 'bg-red-50 border-red-200 text-red-800',
      icon: <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />,
      msg: 'Aucun contrat actif détecté. Vérifiez l\'état des polices.',
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map(a => (
        <motion.div
          key={a.key}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className={`flex items-start gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium ${a.color}`}
        >
          {a.icon}
          {a.msg}
        </motion.div>
      ))}
    </div>
  );
}

// ─── KPI Card with trend ───────────────────────────────────────────────────────

interface KpiCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bg: string;
  trend?: { value: string; up: boolean };
}

function KpiCard({ card, delay }: { card: KpiCard; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card rounded-xl p-4 sm:p-5 shadow-sm border border-border hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`p-2 rounded-lg ${card.bg} flex-shrink-0`}>
          <span className={`bg-gradient-to-br ${card.color} bg-clip-text text-transparent`}>
            {card.icon}
          </span>
        </div>
        {card.trend && (
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
            card.trend.up ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {card.trend.up ? '↑' : '↓'} {card.trend.value}
          </span>
        )}
      </div>
      <p className="text-xl xs:text-2xl sm:text-3xl font-bold mt-3 text-gray-900 leading-none truncate">{card.value}</p>
      <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">{card.title}</p>
    </motion.div>
  );
}

// ─── Operational Table : derniers sinistres ───────────────────────────────────

function OperationalTable({ activities, navigate }: { activities: DashboardStats['recentActivity']; navigate: ReturnType<typeof useNavigate> }) {
  const rows = activities.slice(0, 8);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
    >
      <div className="px-4 sm:px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm sm:text-base text-gray-900">Activité récente</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Dernières demandes — actions rapides disponibles</p>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {activities.length} événement{activities.length > 1 ? 's' : ''}
        </span>
      </div>

      {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 sm:px-5 py-2.5 text-xs font-semibold text-muted-foreground">Action</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Détail</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Statut</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground hidden md:table-cell">Date</th>
                <th className="text-right px-4 sm:px-5 py-2.5 text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((item, idx) => {
                const key = item.type?.toLowerCase() || 'default';
                const s = STATUS_STYLE[key] || STATUS_STYLE.default;
                const canValidate = key === 'en_attente' || key === 'en_cours';
                const canReject   = key === 'en_attente';
                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.03 }}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 sm:px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${s.badge}`}>
                          {ACTIVITY_ICONS[key] || ACTIVITY_ICONS.default}
                        </div>
                        <span className="font-medium text-gray-900 truncate max-w-[140px]">{item.action}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell">
                      <span className="text-xs text-muted-foreground truncate max-w-[180px] block">{item.detail || '—'}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${s.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {item.time || (item.date ? new Date(item.date).toLocaleDateString('fr-FR') : '—')}
                      </span>
                    </td>
                    <td className="px-4 sm:px-5 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => navigate('/sinistres')}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                        >
                          <Eye size={11} /> Voir
                        </button>
                        {canValidate && (
                          <button
                            onClick={() => navigate('/sinistres')}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-green-100 hover:bg-green-200 text-green-700 transition-colors"
                          >
                            <CheckCircle size={11} /> Valider
                          </button>
                        )}
                        {canReject && (
                          <button
                            onClick={() => navigate('/sinistres')}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                          >
                            <XCircle size={11} /> Rejeter
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          Aucune activité récente
        </div>
      )}
    </motion.div>
  );
}

// ─── Connected Users (admin only) ────────────────────────────────────────────

function ConnectedUsers({ sessions }: { sessions: SessionEntry[] }) {
  const ROLE_LABEL: Record<string, string> = { admin: 'Admin', prestataire: 'Prestataire', client: 'Client' };
  const ROLE_COLOR: Record<string, string> = {
    admin:       'bg-brand/10 text-brand',
    prestataire: 'bg-purple-100 text-purple-700',
    client:      'bg-emerald-100 text-emerald-700',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
    >
      <div className="px-4 sm:px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h3 className="font-semibold text-sm sm:text-base text-gray-900">Utilisateurs connectés</h3>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {sessions.length} en ligne
        </span>
      </div>
      {sessions.length > 0 ? (
        <ul className="divide-y divide-border">
          {sessions.map((s, idx) => {
            const initials = (s.fullName || s.email || '').split(' ').map((w: string) => w[0] ?? '').join('').toUpperCase().slice(0, 2) || '??';
            return (
              <motion.li
                key={s.userId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + idx * 0.04 }}
                className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-muted/40 transition-colors"
              >
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold">
                    {initials}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900 truncate">{s.fullName || s.email}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLOR[s.role] || 'bg-gray-100 text-gray-600'}`}>
                      {ROLE_LABEL[s.role] || s.role}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                </div>
                <div className="shrink-0 text-right space-y-0.5">
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                    <Clock size={10} /> Connecté {formatRelative(s.loginTime)}
                  </p>
                  <p className="text-[10px] text-green-600 flex items-center gap-1 justify-end">
                    <Activity size={10} /> Actif {formatRelative(s.lastActivity)}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ul>
      ) : (
        <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
          Aucun utilisateur connecté
        </div>
      )}
    </motion.div>
  );
}

// ─── Client Stats ─────────────────────────────────────────────────────────────

interface ClientStats {
  policesActives: number;
  sinistresOuverts: number;
  sinistresEnAttente: number;
  montantRembourse: number;
  totalReclame: number;
  prescriptions: number;
  chartData: Array<{ mois: string; reclame: number; rembourse: number }>;
}

const MONTHS_FR = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

function buildClientStats(polices: any[], sinistres: any[], prescriptions: any[]): ClientStats {
  const now   = new Date();
  const chart = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { mois: MONTHS_FR[d.getMonth()], year: d.getFullYear(), month: d.getMonth(), reclame: 0, rembourse: 0 };
  });
  sinistres.forEach(s => {
    if (!s.dateSinistre) return;
    const d    = new Date(s.dateSinistre);
    const slot = chart.find(sl => sl.year === d.getFullYear() && sl.month === d.getMonth());
    if (slot) {
      slot.reclame   += Number(s.montantReclamation ?? 0);
      slot.rembourse += Number(s.montantAccorde ?? 0);
    }
  });
  return {
    policesActives:     polices.filter(p => (p.statut || 'ACTIVE') === 'ACTIVE').length,
    sinistresOuverts:   sinistres.filter(s => s.statut === 'EN_COURS' || s.statut === 'EN_ATTENTE').length,
    sinistresEnAttente: sinistres.filter(s => s.statut === 'EN_ATTENTE').length,
    montantRembourse:   sinistres.filter(s => s.statut === 'PAYE').reduce((a, s) => a + Number(s.montantAccorde ?? 0), 0),
    totalReclame:       sinistres.reduce((a, s) => a + Number(s.montantReclamation ?? 0), 0),
    prescriptions:      prescriptions.length,
    chartData:          chart.map(({ mois, reclame, rembourse }) => ({ mois, reclame, rembourse })),
  };
}

// ─── Dashboard Component ──────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const isAdmin   = user?.role === 'admin';
  const isClient  = user?.role === 'client';

  const [stats, setStats]             = useState<DashboardStats>(EMPTY);
  const [loading, setLoading]         = useState(true);
  const [apiError, setApiError]       = useState(false);
  const [clientStats, setClientStats] = useState<ClientStats | null>(null);
  const [clientLoading, setClientLoading] = useState(false);
  const [sessions, setSessions]       = useState<SessionEntry[]>([]);
  const [liveFlash, setLiveFlash]     = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const data = await apiClient.request<SessionEntry[]>('/admin/active-users');
      setSessions(Array.isArray(data) ? data : []);
    } catch {}
  }, [isAdmin]);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 30_000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  const fetchStats = useCallback(() => {
    setLoading(true);
    setApiError(false);
    apiClient.request<DashboardStats>('/dashboard/stats')
      .then(data => setStats({ ...EMPTY, ...data }))
      .catch(() => setApiError(true))
      .finally(() => setLoading(false));
  }, []);

  const fetchClientStats = useCallback(() => {
    if (!isClient) return;
    setClientLoading(true);
    Promise.all([
      DataService.getPolices().catch(() => []),
      DataService.getSinistres().catch(() => []),
      DataService.getPrescriptions().catch(() => []),
    ]).then(([polices, sinistres, prescriptions]) => {
      setClientStats(buildClientStats(polices ?? [], sinistres ?? [], prescriptions ?? []));
    }).finally(() => setClientLoading(false));
  }, [isClient]);

  useEffect(() => { fetchStats(); fetchClientStats(); }, [fetchStats, fetchClientStats]);

  const triggerFlash = useCallback(() => {
    setLiveFlash(true);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setLiveFlash(false), 1800);
  }, []);

  usePusherChannel(
    isAdmin ? CH.dashboard : null,
    {
      [EV.statsUpdate]: (data: unknown) => {
        setStats(prev => ({ ...prev, ...(data as StatsPayload) }));
        triggerFlash();
      },
      [EV.activityPush]: (data: unknown) => {
        const item = data as ActivityPayload;
        setStats(prev => ({
          ...prev,
          recentActivity: [item, ...prev.recentActivity].slice(0, 20),
        }));
      },
    },
    isAdmin && !loading,
  );

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AppLayout title="Tableau de bord">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <p className="text-muted-foreground text-sm">Chargement du tableau de bord…</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (apiError) {
    return (
      <AppLayout title="Tableau de bord">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <ServerOff size={48} className="text-muted-foreground opacity-40" />
          <div>
            <p className="font-semibold text-lg">Service temporairement indisponible</p>
            <p className="text-sm text-muted-foreground mt-1">
              Impossible de contacter le serveur. Veuillez réessayer dans quelques instants.
            </p>
          </div>
          <button
            onClick={fetchStats}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors"
          >
            <RefreshCw size={15} /> Réessayer
          </button>
        </div>
      </AppLayout>
    );
  }

  // ── KPI data ─────────────────────────────────────────────────────────────
  const mainKpis: KpiCard[] = [
    {
      title: 'Assurés',
      value: stats.totalAssures.toLocaleString('fr-FR'),
      icon: <Users size={20} />,
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      trend: { value: '+12%', up: true },
    },
    {
      title: 'Contrats actifs',
      value: stats.totalPolices.toLocaleString('fr-FR'),
      icon: <Shield size={20} />,
      color: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      trend: { value: '+5%', up: true },
    },
    {
      title: 'Sinistres en attente',
      value: stats.sinistresEnAttente.toLocaleString('fr-FR'),
      icon: <FileText size={20} />,
      color: 'from-orange-400 to-orange-500',
      bg: 'bg-orange-50',
      trend: stats.sinistresEnAttente > 0 ? { value: 'À traiter', up: false } : undefined,
    },
    {
      title: 'Montant remboursé',
      value: `${formatMontant(stats.montantRembourse)} FCFA`,
      icon: <Banknote size={20} />,
      color: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50',
      trend: { value: '+8%', up: true },
    },
  ];

  const secondaryCards = [
    { title: 'Prestataires',    value: stats.totalPrestataires,  icon: <Stethoscope size={18} />, color: 'text-teal-600',   bg: 'bg-teal-50'   },
    { title: 'Consultations',   value: stats.totalConsultations,  icon: <ClipboardList size={18} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Prescriptions',   value: stats.totalPrescriptions,  icon: <Pill size={18} />,        color: 'text-pink-600',   bg: 'bg-pink-50'   },
    { title: 'Total sinistres', value: stats.totalSinistres,      icon: <Activity size={18} />,    color: 'text-red-500',    bg: 'bg-red-50'    },
  ];

  const pieData = [
    { name: 'En attente', value: stats.sinistresEnAttente, color: PIE_COLORS[0] },
    { name: 'Approuvés',  value: stats.sinistresApprouves, color: PIE_COLORS[1] },
    { name: 'Payés',      value: stats.sinistresPaies,     color: PIE_COLORS[2] },
  ].filter(d => d.value > 0);

  const chartData = stats.chartData?.length > 0 ? stats.chartData : [];

  // Taux de remboursement global admin
  const tauxRembours = stats.totalSinistres > 0
    ? Math.round((stats.sinistresPaies / stats.totalSinistres) * 100)
    : 0;

  return (
    <AppLayout title="Tableau de bord">
      <div className="space-y-5 lg:space-y-6">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <DashboardHeader user={user} onRefresh={() => { fetchStats(); fetchClientStats(); }} liveFlash={liveFlash} />

        {/* ── Actions rapides (admin) ──────────────────────────────────── */}
        {isAdmin && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Actions rapides</p>
            <QuickActions navigate={navigate} />
          </motion.div>
        )}

        {/* ── Alertes admin ────────────────────────────────────────────── */}
        {isAdmin && <AdminAlerts stats={stats} />}

        {/* ════════════════════════════════════════════════════════════════
            SECTION ADMIN / PRESTATAIRE
        ════════════════════════════════════════════════════════════════ */}
        {!isClient && (
          <>
            {/* ── KPI Bandeau ─────────────────────────────────────────── */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Vue d'ensemble</p>
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {mainKpis.map((card, i) => (
                  <KpiCard key={card.title} card={card} delay={i * 0.07} />
                ))}
              </div>
            </div>

            {/* ── Compteurs secondaires ────────────────────────────────── */}
            {isAdmin && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {secondaryCards.map((card, i) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.28 + i * 0.05 }}
                    className="bg-card rounded-xl p-3 sm:p-4 border border-border flex items-center gap-2 sm:gap-3"
                  >
                    <div className={`p-1.5 sm:p-2 rounded-lg ${card.bg} flex-shrink-0`}>
                      <span className={card.color}>{card.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-base sm:text-xl font-bold text-gray-900 leading-none">{card.value}</p>
                      <p className="text-[10px] xs:text-xs text-muted-foreground mt-0.5 truncate">{card.title}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* ── Analyse ─────────────────────────────────────────────── */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Analyse</p>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">

                {/* Bar chart sinistres & remboursements */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="lg:col-span-3 bg-card rounded-xl p-4 sm:p-5 border border-border shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900">Sinistres & Remboursements</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Évolution sur 6 mois</p>
                    </div>
                  </div>
                  {chartData.length > 0 ? (
                    <div className="h-48 sm:h-56 lg:h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                          <XAxis dataKey="mois" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                          />
                          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                          <Bar dataKey="sinistres"      name="Sinistres"      fill="#3B82F6" radius={[4,4,0,0]} maxBarSize={40} />
                          <Bar dataKey="remboursements" name="Remboursements" fill="#8B5CF6" radius={[4,4,0,0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-48 sm:h-56 flex items-center justify-center text-muted-foreground text-sm">
                      Aucune donnée disponible
                    </div>
                  )}
                </motion.div>

                {/* Répartition + Taux */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.42 }}
                    className="bg-card rounded-xl p-4 sm:p-5 border border-border shadow-sm flex-1"
                  >
                    <div className="mb-3">
                      <h3 className="font-semibold text-sm text-gray-900">Répartition des sinistres</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Total : {stats.totalSinistres}</p>
                    </div>
                    {pieData.length > 0 ? (
                      <>
                        <div className="h-36">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={pieData} cx="50%" cy="50%" innerRadius="40%" outerRadius="70%" paddingAngle={3} dataKey="value">
                                {pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                              </Pie>
                              <Tooltip
                                contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e5e7eb' }}
                                formatter={(val: number, name: string) => [
                                  `${val} (${stats.totalSinistres > 0 ? Math.round(val / stats.totalSinistres * 100) : 0}%)`, name,
                                ]}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-1.5 mt-2">
                          {pieData.map(entry => (
                            <div key={entry.name} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                                <span className="text-gray-600">{entry.name}</span>
                              </div>
                              <span className="font-semibold text-gray-900">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-36 gap-2 text-muted-foreground">
                        <Activity size={28} className="opacity-30" />
                        <p className="text-xs">Aucun sinistre</p>
                      </div>
                    )}
                  </motion.div>

                  {/* Taux de remboursement global */}
                  {isAdmin && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.48 }}
                      className="bg-card rounded-xl p-4 border border-border shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-sm text-gray-900">Taux de remboursement</h3>
                          <p className="text-xs text-muted-foreground">Sinistres payés / total</p>
                        </div>
                        <span className="text-xl font-bold text-emerald-600">{tauxRembours}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${tauxRembours}%` }}
                          transition={{ duration: 0.8, delay: 0.5 }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                        <span>Payés : {stats.sinistresPaies}</span>
                        <span>Total : {stats.totalSinistres}</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Opérationnel ────────────────────────────────────────── */}
            {isAdmin && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Opérationnel</p>
                <OperationalTable activities={stats.recentActivity} navigate={navigate} />
              </div>
            )}

            {/* ── Utilisateurs connectés ──────────────────────────────── */}
            {isAdmin && sessions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">En ligne maintenant</p>
                <ConnectedUsers sessions={sessions} />
              </div>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════
            SECTION CLIENT
        ════════════════════════════════════════════════════════════════ */}
        {isClient && (
          <div className="space-y-4">
            {clientLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 size={16} className="animate-spin" />
                <span>Chargement de vos données…</span>
              </div>
            ) : clientStats && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { title: 'Mes polices actives',    value: clientStats.policesActives,    icon: <Shield size={20} />,       color: 'from-blue-500 to-blue-600',     bg: 'bg-blue-50'   },
                    { title: 'Sinistres en cours',     value: clientStats.sinistresOuverts,  icon: <AlertTriangle size={20} />, color: 'from-orange-400 to-orange-500', bg: 'bg-orange-50' },
                    { title: 'Remboursé (FCFA)',       value: clientStats.montantRembourse >= 1000 ? `${(clientStats.montantRembourse/1000).toFixed(0)}k` : clientStats.montantRembourse, icon: <TrendingUp size={20} />, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50' },
                    { title: 'Mes prescriptions',      value: clientStats.prescriptions,     icon: <Pill size={20} />,          color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50' },
                  ].map((card, i) => (
                    <motion.div
                      key={card.title}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="bg-card rounded-xl p-4 sm:p-5 shadow-sm border border-border hover:shadow-md transition-shadow"
                    >
                      <div className={`p-2 rounded-lg ${card.bg} w-fit`}>
                        <span className={`bg-gradient-to-br ${card.color} bg-clip-text text-transparent`}>
                          {card.icon}
                        </span>
                      </div>
                      <p className="text-xl sm:text-3xl font-bold mt-3 text-gray-900 leading-none truncate">{card.value}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">{card.title}</p>
                    </motion.div>
                  ))}
                </div>

                {clientStats.sinistresEnAttente > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3"
                  >
                    <Clock size={16} className="text-yellow-600 mt-0.5 shrink-0" />
                    <div className="flex-1 text-sm text-yellow-800">
                      <span className="font-semibold">{clientStats.sinistresEnAttente} sinistre{clientStats.sinistresEnAttente > 1 ? 's' : ''} en attente</span>
                      {' '}de traitement. Vous serez notifié dès la mise à jour.
                    </div>
                  </motion.div>
                )}

                {clientStats.chartData.some(d => d.reclame > 0 || d.rembourse > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-card rounded-xl p-4 sm:p-5 border border-border shadow-sm"
                  >
                    <div className="mb-4">
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900">Mes remboursements</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Réclamé vs remboursé — 6 derniers mois (FCFA)</p>
                    </div>
                    <div className="h-44 sm:h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={clientStats.chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                          <XAxis dataKey="mois" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
                            tickFormatter={v => Number(v) >= 1000 ? `${(Number(v)/1000).toFixed(0)}k` : String(v)} />
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                            formatter={(val: number) => [`${val.toLocaleString('fr-FR')} F`]}
                            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                          />
                          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                          <Bar dataKey="reclame"   name="Réclamé"   fill="#3B82F6" radius={[4,4,0,0]} maxBarSize={36} />
                          <Bar dataKey="rembourse" name="Remboursé" fill="#10B981" radius={[4,4,0,0]} maxBarSize={36} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                )}

                {clientStats.totalReclame > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="bg-card rounded-xl p-4 sm:p-5 border border-border shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-sm text-gray-900">Taux de remboursement</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Montant accordé vs réclamé</p>
                      </div>
                      <span className="text-lg font-bold text-emerald-600">
                        {Math.round(clientStats.montantRembourse / clientStats.totalReclame * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.round(clientStats.montantRembourse / clientStats.totalReclame * 100))}%` }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>Remboursé : {clientStats.montantRembourse.toLocaleString('fr-FR')} F</span>
                      <span>Réclamé : {clientStats.totalReclame.toLocaleString('fr-FR')} F</span>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </AppLayout>
  );
}
