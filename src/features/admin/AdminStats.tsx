import { useState, useEffect } from 'react';
import {
  Users, TrendingUp, Crown, Zap, Flame,
  Globe, MapPin, RefreshCw, BarChart3, Target
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAdminTheme } from '../../store/useAdminTheme';
import { useTenant } from '../../store/useTenant';

// ─── Types ────────────────────────────────────────────────────────

interface UserData {
  xp: number;
  streakCount: number;
  longestStreak: number;
  isPremium: boolean;
  subscriptionPlan: string;
  isFrancophone: boolean;
  objectifPrincipal: string | null;
  paysOrigine: string | null;
  localisationActuelle: string | null;
  dateArrivee: string | null;
  hasCompletedOnboarding: boolean;
  lastActiveDay: string | null;
  acquisitionSource?: {
    utm_source: string | null;
    utm_campaign: string | null;
    utm_medium: string | null;
  };
  createdAt?: string;
}

interface StatsData {
  totalUsers: number;
  activeToday: number;
  activeThisWeek: number;
  activeThisMonth: number;
  premiumUsers: number;
  conversionRate: number;
  mrrEstime: number;
  onboardingComplete: number;
  streakMoyen: number;
  streakRecord: number;
  streakPlus7: number;
  streakPlus30: number;
  xpMoyen: number;
  niveauMoyen: number;
  pctFrancophones: number;
  paysTop: { pays: string; count: number }[];
  localisations: { quebec: number; canada: number; pasEncore: number };
  objectifs: Record<string, number>;
  sources: Record<string, number>;
  campaigns: Record<string, number>;
  monthlyConversions: { name: string; conversions: number }[];
}

// ─── Helpers ──────────────────────────────────────────────────────

const today = new Date().toLocaleDateString('en-CA');
const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA');
const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA');

function xpToNiveau(xp: number): number {
  if (xp >= 5000) return 8;
  if (xp >= 3500) return 7;
  if (xp >= 2500) return 6;
  if (xp >= 1500) return 5;
  if (xp >= 900) return 4;
  if (xp >= 400) return 3;
  if (xp >= 150) return 2;
  return 1;
}

function computeStats(users: UserData[]): StatsData {
  const total = users.length;
  const premium = users.filter((u) => u.isPremium || u.subscriptionPlan === 'premium');
  const activeToday = users.filter((u) => u.lastActiveDay === today).length;
  const activeWeek = users.filter((u) => u.lastActiveDay && u.lastActiveDay >= lastWeek).length;
  const activeMonth = users.filter((u) => u.lastActiveDay && u.lastActiveDay >= lastMonth).length;

  const streaks = users.map((u) => u.streakCount || 0);
  const streakMoyen = streaks.length ? streaks.reduce((a, b) => a + b, 0) / streaks.length : 0;
  const streakRecord = streaks.length ? Math.max(...streaks) : 0;
  const streakPlus7 = users.filter((u) => u.streakCount >= 7).length;
  const streakPlus30 = users.filter((u) => u.streakCount >= 30).length;

  const xps = users.map((u) => u.xp || 0);
  const xpMoyen = xps.length ? xps.reduce((a, b) => a + b, 0) / xps.length : 0;
  const niveauMoyen = users.length
    ? users.reduce((a, u) => a + xpToNiveau(u.xp || 0), 0) / users.length
    : 0;

  const francophones = users.filter((u) => u.isFrancophone).length;

  // Pays
  const paysCount: Record<string, number> = {};
  users.forEach((u) => {
    const p = u.paysOrigine || 'Inconnu';
    paysCount[p] = (paysCount[p] || 0) + 1;
  });
  const paysTop = Object.entries(paysCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([pays, count]) => ({ pays, count }));

  // Localisation
  const localisations = {
    quebec: users.filter((u) => u.localisationActuelle === 'quebec').length,
    canada: users.filter((u) => u.localisationActuelle === 'canada').length,
    pasEncore: users.filter((u) => u.localisationActuelle === 'pas_arrive').length,
  };

  // Objectifs
  const objectifs: Record<string, number> = {};
  users.forEach((u) => {
    const o = u.objectifPrincipal || 'Inconnu';
    objectifs[o] = (objectifs[o] || 0) + 1;
  });

  // Sources acquisition
  const sources: Record<string, number> = {};
  const campaigns: Record<string, number> = {};
  users.forEach((u) => {
    const src = u.acquisitionSource?.utm_source || 'direct';
    sources[src] = (sources[src] || 0) + 1;
    const camp = u.acquisitionSource?.utm_campaign;
    if (camp) campaigns[camp] = (campaigns[camp] || 0) + 1;
  });

  // Monthly Conversions
  const monthlyDataMap: Record<string, number> = {};
  users.forEach((u) => {
    if ((u.isPremium || u.subscriptionPlan === 'premium') && u.createdAt) {
      const d = new Date(u.createdAt);
      if (!isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyDataMap[key] = (monthlyDataMap[key] || 0) + 1;
      }
    }
  });

  const monthlyConversions = Object.entries(monthlyDataMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, count]) => {
      const [year, month] = key.split('-');
      const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
      return {
        name: d.toLocaleDateString('fr-CA', { month: 'short', year: 'numeric' }),
        conversions: count
      };
    });

  // MRR estimé (très approximatif — attend RevenueCat pour le vrai)
  const mrrEstime = premium.length * 14.99;

  return {
    totalUsers: total,
    activeToday,
    activeThisWeek: activeWeek,
    activeThisMonth: activeMonth,
    premiumUsers: premium.length,
    conversionRate: total > 0 ? (premium.length / total) * 100 : 0,
    mrrEstime,
    onboardingComplete: users.filter((u) => u.hasCompletedOnboarding).length,
    streakMoyen,
    streakRecord,
    streakPlus7,
    streakPlus30,
    xpMoyen,
    niveauMoyen,
    pctFrancophones: total > 0 ? (francophones / total) * 100 : 0,
    paysTop,
    localisations,
    objectifs,
    sources,
    campaigns,
    monthlyConversions,
  };
}

// ─── Composant carte stat ─────────────────────────────────────────

function StatCard({ theme, label, value, sub, color = 'blue', icon: Icon }: {
  theme: any;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon: any;
}) {
  const colorMap: Record<string, string> = {
    blue: `color-mix(in srgb, ${theme.colors.primary} 15%, transparent)`,
    green: `color-mix(in srgb, ${theme.colors.success} 15%, transparent)`,
    purple: `color-mix(in srgb, ${theme.colors.accent} 15%, transparent)`,
    amber: `color-mix(in srgb, ${theme.colors.gold} 15%, transparent)`,
    red: `color-mix(in srgb, ${theme.colors.danger} 15%, transparent)`,
  };
  
  const iconColorMap: Record<string, string> = {
    blue: theme.colors.primary,
    green: theme.colors.success,
    purple: theme.colors.accent,
    amber: theme.colors.gold,
    red: theme.colors.danger,
  };

  return (
    <div className="rounded-2xl p-4 border shadow-sm" style={{ backgroundColor: theme.colors.surface, borderColor: `color-mix(in srgb, ${theme.colors.ink} 10%, transparent)` }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: colorMap[color], color: iconColorMap[color] }}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-black" style={{ color: theme.colors.ink }}>{value}</p>
      <p className="text-sm font-medium mt-0.5" style={{ color: theme.colors.muted }}>{label}</p>
      {sub && <p className="text-xs mt-1" style={{ color: theme.colors.muted }}>{sub}</p>}
    </div>
  );
}

// ─── Barre horizontale ────────────────────────────────────────────

function BarRow({ theme, label, count, total, color = '#6366f1' }: {
  theme: any;
  label: string;
  count: number;
  total: number;
  color?: string;
  key?: string | number;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-28 shrink-0 truncate" style={{ color: theme.colors.muted }}>{label}</span>
      <div className="rounded-full h-2 flex-1" style={{ backgroundColor: `color-mix(in srgb, ${theme.colors.ink} 10%, transparent)` }}>
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-bold w-10 text-right" style={{ color: theme.colors.muted }}>{Math.round(pct)}%</span>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────

export default function AdminStats() {
  const { theme } = useAdminTheme();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const load = async () => {
    setIsLoading(true);
    try {
      const tenantId = useTenant.getState().currentTenant?.id || 'eduforge';
      const q = query(collection(db, 'utilisateurs'), where('tenantId', '==', tenantId));
      const snap = await getDocs(q);
      const users: UserData[] = [];
      snap.forEach((doc) => users.push(doc.data() as UserData));
      setStats(computeStats(users));
      setLastRefresh(new Date());
    } catch (err) {
      console.error('[AdminStats] Erreur chargement:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!stats) return <p className="text-slate-500 p-4">Erreur de chargement.</p>;

  return (
    <div className="space-y-6" style={{ color: theme.colors.ink }}>
      {/* Header refresh */}
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: theme.colors.muted }}>
          Mis à jour : {lastRefresh.toLocaleTimeString('fr-CA')}
        </p>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-xs font-bold transition-opacity hover:opacity-80"
          style={{ color: theme.colors.primary }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualiser
        </button>
      </div>

      {/* ── ACQUISITION ── */}
      <section>
        <h3 className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: theme.colors.muted }}>
          📥 Acquisition
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard theme={theme} label="Total inscrits" value={stats.totalUsers} icon={Users} color="blue" />
          <StatCard
            theme={theme}
            label="Onboarding complet"
            value={stats.onboardingComplete}
            sub={`${Math.round((stats.onboardingComplete / Math.max(stats.totalUsers, 1)) * 100)}% des inscrits`}
            icon={Target}
            color="green"
          />
        </div>

        {/* Sources acquisition */}
        {Object.keys(stats.sources).length > 1 && (
          <div className="rounded-2xl p-4 border shadow-sm mt-3 space-y-2" style={{ backgroundColor: theme.colors.surface, borderColor: `color-mix(in srgb, ${theme.colors.ink} 10%, transparent)` }}>
            <p className="text-sm font-bold mb-3" style={{ color: theme.colors.ink }}>Sources d'acquisition</p>
            {Object.entries(stats.sources)
              .sort((a, b) => (b[1] as number) - (a[1] as number))
              .map(([src, count]) => (
                <BarRow theme={theme} key={src} label={src} count={count as number} total={stats.totalUsers} color={theme.colors.primary} />
              ))}
          </div>
        )}
      </section>

      {/* ── RÉTENTION ── */}
      <section>
        <h3 className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: theme.colors.muted }}>
          🔥 Rétention
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <StatCard theme={theme} label="Actifs aujourd'hui" value={stats.activeToday} icon={Flame} color="red" />
          <StatCard theme={theme} label="Cette semaine" value={stats.activeThisWeek} icon={TrendingUp} color="amber" />
          <StatCard theme={theme} label="Ce mois" value={stats.activeThisMonth} icon={BarChart3} color="blue" />
        </div>

        <div className="rounded-2xl p-4 border shadow-sm mt-3 space-y-2" style={{ backgroundColor: theme.colors.surface, borderColor: `color-mix(in srgb, ${theme.colors.ink} 10%, transparent)` }}>
          <p className="text-sm font-bold mb-3" style={{ color: theme.colors.ink }}>Streaks</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Streak moyen', value: `${stats.streakMoyen.toFixed(1)} jours` },
              { label: 'Record absolu', value: `${stats.streakRecord} jours` },
              { label: 'Streak > 7j', value: `${stats.streakPlus7} users` },
              { label: 'Streak > 30j', value: `${stats.streakPlus30} users` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl p-3" style={{ backgroundColor: `color-mix(in srgb, ${theme.colors.ink} 5%, transparent)` }}>
                <p className="text-xs" style={{ color: theme.colors.muted }}>{label}</p>
                <p className="font-black mt-0.5" style={{ color: theme.colors.ink }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ENGAGEMENT ── */}
      <section>
        <h3 className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: theme.colors.muted }}>
          ⚡ Engagement
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard theme={theme} label="XP moyen" value={Math.round(stats.xpMoyen)} icon={Zap} color="amber" />
          <StatCard theme={theme} label="Niveau moyen" value={stats.niveauMoyen.toFixed(1)} icon={TrendingUp} color="purple" />
        </div>

        <div className="rounded-2xl p-4 border shadow-sm mt-3 space-y-2" style={{ backgroundColor: theme.colors.surface, borderColor: `color-mix(in srgb, ${theme.colors.ink} 10%, transparent)` }}>
          <p className="text-sm font-bold mb-3" style={{ color: theme.colors.ink }}>Profil utilisateurs</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ backgroundColor: `color-mix(in srgb, ${theme.colors.ink} 5%, transparent)` }}>
              <p className="text-xs" style={{ color: theme.colors.muted }}>% Francophones</p>
              <p className="font-black mt-0.5" style={{ color: theme.colors.ink }}>{Math.round(stats.pctFrancophones)}%</p>
            </div>
            <div className="rounded-xl p-3" style={{ backgroundColor: `color-mix(in srgb, ${theme.colors.ink} 5%, transparent)` }}>
              <p className="text-xs" style={{ color: theme.colors.muted }}>Non-francophones</p>
              <p className="font-black mt-0.5" style={{ color: theme.colors.ink }}>{Math.round(100 - stats.pctFrancophones)}%</p>
            </div>
          </div>

          {/* Objectifs */}
          <p className="text-sm font-bold mt-4 mb-2" style={{ color: theme.colors.ink }}>Objectifs principaux</p>
          <div className="space-y-2">
            {Object.entries(stats.objectifs)
              .sort((a, b) => (b[1] as number) - (a[1] as number))
              .map(([obj, count]) => (
                <BarRow theme={theme} key={obj} label={obj} count={count as number} total={stats.totalUsers} color={theme.colors.accent} />
              ))}
          </div>
        </div>
      </section>

      {/* ── MONÉTISATION ── */}
      <section>
        <h3 className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: theme.colors.muted }}>
          💰 Monétisation
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard theme={theme} label="Utilisateurs Premium" value={stats.premiumUsers} icon={Crown} color="purple" />
          <StatCard
            theme={theme}
            label="Taux conversion"
            value={`${stats.conversionRate.toFixed(1)}%`}
            sub="Cible : 4–6%"
            icon={TrendingUp}
            color="green"
          />
        </div>

        <div className="rounded-2xl p-4 border shadow-sm mt-3" style={{ backgroundColor: theme.colors.surface, borderColor: `color-mix(in srgb, ${theme.colors.ink} 10%, transparent)` }}>
          <p className="text-sm font-bold mb-1" style={{ color: theme.colors.ink }}>MRR estimé</p>
          <p className="text-3xl font-black" style={{ color: theme.colors.success }}>
            {stats.mrrEstime.toFixed(2)} $CAD
          </p>
          <p className="text-xs mt-1" style={{ color: theme.colors.muted }}>
            Approximatif · basé sur {stats.premiumUsers} × 14.99$ — attend RevenueCat pour le vrai MRR
          </p>
        </div>

        {stats.monthlyConversions.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mt-3">
            <p className="text-sm font-bold text-slate-700 mb-4">Évolution des conversions</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.monthlyConversions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    dy={10}
                  />
                  <YAxis 
                    allowDecimals={false}
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="conversions" 
                    name="Conversions"
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#8b5cf6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>

      {/* ── GÉOGRAPHIE ── */}
      <section>
        <h3 className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: theme.colors.muted }}>
          🌍 Géographie
        </h3>

        {/* Localisation */}
        <div className="rounded-2xl p-4 border shadow-sm mb-3 space-y-2" style={{ backgroundColor: theme.colors.surface, borderColor: `color-mix(in srgb, ${theme.colors.ink} 10%, transparent)` }}>
          <p className="text-sm font-bold mb-3" style={{ color: theme.colors.ink }}>Localisation actuelle</p>
          <BarRow theme={theme} label="🍁 Au Québec" count={stats.localisations.quebec} total={stats.totalUsers} color={theme.colors.danger} />
          <BarRow theme={theme} label="🇨🇦 Canada" count={stats.localisations.canada} total={stats.totalUsers} color={theme.colors.danger} />
          <BarRow theme={theme} label="✈️ Pas encore" count={stats.localisations.pasEncore} total={stats.totalUsers} color={theme.colors.muted} />
        </div>

        {/* Pays */}
        <div className="rounded-2xl p-4 border shadow-sm space-y-2" style={{ backgroundColor: theme.colors.surface, borderColor: `color-mix(in srgb, ${theme.colors.ink} 10%, transparent)` }}>
          <p className="text-sm font-bold mb-3" style={{ color: theme.colors.ink }}>Top 10 pays d'origine</p>
          {stats.paysTop.length === 0 ? (
            <p className="text-xs" style={{ color: theme.colors.muted }}>Données disponibles après ajout des questions onboarding</p>
          ) : (
            stats.paysTop.map(({ pays, count }) => (
              <BarRow theme={theme} key={pays} label={pays} count={count} total={stats.totalUsers} color={theme.colors.primary} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
