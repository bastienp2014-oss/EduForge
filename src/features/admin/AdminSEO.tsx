import React, { useState } from "react";
import { useAdminTheme } from "../../store/useAdminTheme";
import { useTenant } from "../../store/useTenant";
import {
  Search,
  LineChart,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  MapPin,
  Eye,
  MousePointerClick,
  RefreshCw,
  BarChart2,
} from "lucide-react";

// Mock data to simulate the aggregated ETL data from Firestore
const MOCK_SEO_DATA = {
  totalClicks: 12450,
  clicksTrend: 12.5,
  totalImpressions: 145000,
  impressionsTrend: 8.4,
  avgCtr: 8.5,
  ctrTrend: -0.2,
  avgPosition: 14.2,
  positionTrend: 1.5,
  topKeywords: [
    {
      term: "cours anglais paris",
      clicks: 1250,
      impressions: 12000,
      position: 3.2,
    },
    {
      term: "apprendre espagnol affaires",
      clicks: 840,
      impressions: 8500,
      position: 4.5,
    },
    {
      type: "brand",
      term: "plateforme edu login",
      clicks: 620,
      impressions: 1500,
      position: 1.1,
    },
    {
      term: "jeu vocabulaire anglais",
      clicks: 580,
      impressions: 5200,
      position: 5.8,
    },
    {
      term: "formation langue entreprise",
      clicks: 410,
      impressions: 6800,
      position: 8.4,
    },
  ],
  topPages: [
    { path: "/cours-anglais-paris", clicks: 2100, impressions: 18000 },
    { path: "/espagnol-affaires", clicks: 1450, impressions: 12500 },
    { path: "/vocabulaire-anglais-jeu", clicks: 980, impressions: 8200 },
  ],
  tenantRankings: [
    {
      id: "tenant_paris",
      name: "Language School Paris",
      clicks: 5400,
      share: 43,
    },
    { id: "tenant_b2b", name: "Corporate Edu B2B", clicks: 3200, share: 25 },
    { id: "tenant_demo1", name: "Demo Tenant 1", clicks: 1850, share: 15 },
    {
      id: "tenant_0",
      name: "PlateformeEdu (Site Vitrine)",
      clicks: 2000,
      share: 17,
    },
  ],
  chartData: [
    { date: "1 Juin", clicks: 320, impressions: 3400 },
    { date: "5 Juin", clicks: 380, impressions: 4100 },
    { date: "10 Juin", clicks: 410, impressions: 4800 },
    { date: "15 Juin", clicks: 450, impressions: 5200 },
    { date: "20 Juin", clicks: 520, impressions: 6100 },
    { date: "25 Juin", clicks: 480, impressions: 5800 },
    { date: "30 Juin", clicks: 590, impressions: 7200 },
  ],
};

export default function AdminSEO() {
  const { theme } = useAdminTheme();
  const { currentTenant } = useTenant();
  const role = currentTenant?.type === 'saas' ? 'superadmin' : 'client';
  const isDark = theme.dark;
  const [timeRange, setTimeRange] = useState("30d");

  const cardStyle = {
    backgroundColor: theme.colors.surface,
    borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
    color: theme.colors.ink,
  };

  const MetricCard = ({
    title,
    value,
    trend,
    icon: Icon,
    colorClass,
    isNegativeBad = true,
  }: any) => {
    const isPositive = trend > 0;
    const isGood = isPositive ? !isNegativeBad : isNegativeBad; // For position, negative is better. Wait, trend for position 1.5 (means went down, which is bad).
    const trendColor = isPositive ? "text-emerald-500" : "text-rose-500";

    return (
      <div className="p-5 rounded-3xl border shadow-sm" style={cardStyle}>
        <div className="flex justify-between items-start mb-4">
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Icon className="w-5 h-5" />
          </div>
          <div
            className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isPositive ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"}`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {Math.abs(trend)}%
          </div>
        </div>
        <div>
          <h4
            className="text-sm font-medium mb-1"
            style={{ color: theme.colors.muted }}
          >
            {title}
          </h4>
          <div
            className="text-2xl font-black"
            style={{ color: theme.colors.ink }}
          >
            {value}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2
            className="text-2xl font-black mb-1 flex items-center gap-2"
            style={{ color: theme.colors.ink }}
          >
            <LineChart className="w-6 h-6 text-blue-500" />
            Tableau de Bord SEO
          </h2>
          <p className="text-sm" style={{ color: theme.colors.muted }}>
            {role === "superadmin"
              ? "Surveillez les performances SEO globales de tous les locataires et de votre site vitrine."
              : "Analysez le trafic organique de votre plateforme et identifiez les opportunités de croissance."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="text-sm font-bold px-4 py-2 rounded-xl border outline-none cursor-pointer"
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f8fafc",
              borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#e2e8f0",
              color: theme.colors.ink,
            }}
          >
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="90d">3 derniers mois</option>
            <option value="12m">12 derniers mois</option>
          </select>
          <button
            className="p-2 rounded-xl border bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title="Rafraîchir les données (simulé)"
          >
            <RefreshCw
              className="w-5 h-5"
              style={{ color: theme.colors.ink }}
            />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Clics Totaux"
          value={MOCK_SEO_DATA.totalClicks.toLocaleString()}
          trend={MOCK_SEO_DATA.clicksTrend}
          icon={MousePointerClick}
        />
        <MetricCard
          title="Impressions"
          value={MOCK_SEO_DATA.totalImpressions.toLocaleString()}
          trend={MOCK_SEO_DATA.impressionsTrend}
          icon={Eye}
        />
        <MetricCard
          title="CTR Moyen"
          value={`${MOCK_SEO_DATA.avgCtr}%`}
          trend={MOCK_SEO_DATA.ctrTrend}
          icon={BarChart2}
        />
        <MetricCard
          title="Position Moyenne"
          value={MOCK_SEO_DATA.avgPosition}
          trend={MOCK_SEO_DATA.positionTrend}
          icon={Globe}
          isNegativeBad={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area (Simulated) */}
        <div
          className="lg:col-span-2 rounded-3xl p-6 shadow-sm border flex flex-col"
          style={cardStyle}
        >
          <div className="flex items-center justify-between mb-6">
            <h3
              className="font-black text-lg"
              style={{ color: theme.colors.ink }}
            >
              Évolution du Trafic (GSC)
            </h3>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div> Clics
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-purple-200 dark:bg-purple-900/50"></div>{" "}
                Impressions
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-[300px] flex items-end gap-2 pt-10">
            {/* Simple CSS bar chart simulation */}
            {MOCK_SEO_DATA.chartData.map((data, i) => {
              const maxImp = Math.max(
                ...MOCK_SEO_DATA.chartData.map((d) => d.impressions),
              );
              const maxClick = Math.max(
                ...MOCK_SEO_DATA.chartData.map((d) => d.clicks),
              );
              const impHeight = (data.impressions / maxImp) * 100;
              const clickHeight = (data.clicks / maxClick) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center justify-end group"
                >
                  <div className="relative w-full flex justify-center items-end h-full">
                    {/* Impressions Bar */}
                    <div
                      className="absolute bottom-0 w-full max-w-[40px] bg-purple-100 dark:bg-purple-900/30 rounded-t-sm transition-all"
                      style={{ height: `${impHeight}%` }}
                    ></div>
                    {/* Clics Bar */}
                    <div
                      className="absolute bottom-0 w-full max-w-[20px] bg-blue-500 rounded-t-sm transition-all group-hover:bg-blue-400"
                      style={{ height: `${clickHeight}%` }}
                    ></div>
                  </div>
                  <div className="mt-3 text-[10px] font-bold text-slate-400 rotate-[-45deg] whitespace-nowrap">
                    {data.date}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Keywords */}
        <div
          className="rounded-3xl p-6 shadow-sm border flex flex-col"
          style={cardStyle}
        >
          <h3
            className="font-black text-lg mb-6"
            style={{ color: theme.colors.ink }}
          >
            Top Requêtes
          </h3>
          <div className="space-y-4 flex-1">
            {MOCK_SEO_DATA.topKeywords.map((kw, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-4">
                  <div
                    className="text-sm font-bold truncate"
                    style={{ color: theme.colors.ink }}
                  >
                    {kw.term}
                  </div>
                  <div
                    className="text-xs mt-0.5"
                    style={{ color: theme.colors.muted }}
                  >
                    Pos: {kw.position} • Imp:{" "}
                    {(kw.impressions / 1000).toFixed(1)}k
                  </div>
                </div>
                <div className="text-sm font-black bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg shrink-0">
                  {kw.clicks}
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2.5 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded-xl transition-colors">
            Voir toutes les requêtes
          </button>
        </div>

        {/* Super Admin specific sections */}
        {role === "superadmin" && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            {/* Classement des Tenants */}
            <div className="rounded-3xl p-6 shadow-sm border" style={cardStyle}>
              <h3
                className="font-black text-lg mb-6"
                style={{ color: theme.colors.ink }}
              >
                Performances par Locataire
              </h3>
              <div className="space-y-4">
                {MOCK_SEO_DATA.tenantRankings.map((tenant, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span
                        className="font-bold flex items-center gap-2"
                        style={{ color: theme.colors.ink }}
                      >
                        {tenant.id === "tenant_0" ? (
                          <Globe className="w-4 h-4 text-purple-500" />
                        ) : (
                          <MapPin className="w-4 h-4 text-slate-400" />
                        )}
                        {tenant.name}
                      </span>
                      <span className="font-black">
                        {tenant.clicks.toLocaleString()} clics
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${tenant.id === "tenant_0" ? "bg-purple-500" : "bg-blue-500"}`}
                        style={{ width: `${tenant.share}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Landing Pages (Tenant 0) */}
            <div
              className="rounded-3xl p-6 shadow-sm border bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-900/10 dark:to-transparent"
              style={cardStyle}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                  <Globe className="w-5 h-5" />
                </div>
                <h3
                  className="font-black text-lg"
                  style={{ color: theme.colors.ink }}
                >
                  Top Pages (Site Vitrine)
                </h3>
              </div>
              <div className="space-y-3">
                {MOCK_SEO_DATA.topPages.map((page, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl border bg-white dark:bg-slate-900/50"
                    style={{
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.05)"
                        : "#e2e8f0",
                    }}
                  >
                    <div className="truncate pr-4 flex-1 font-medium text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                      {page.path}
                    </div>
                    <div className="flex gap-4 text-xs font-bold shrink-0">
                      <div className="text-slate-500">
                        {page.impressions} imp.
                      </div>
                      <div className="text-slate-900 dark:text-white">
                        {page.clicks} clics
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2.5 text-sm font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 rounded-xl transition-colors">
                Gérer le SEO du site vitrine
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
