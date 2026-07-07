import React, { useState } from "react";
import {
  Lock,
  Search,
  Edit2,
  Plus,
  Save,
  X,
  Trash2,
  ArrowLeft,
  Award,
  Mic,
  Sparkles,
  LayoutGrid,
  Settings,
  BookOpen,
  User,
  LineChart,
  Globe,
  Tags,
  Palette,
  ScrollText,
  Package,
} from "lucide-react";
import { useAdminTheme } from "../../store/useAdminTheme";
import motsData from "../../data/mots.json";
import quizData from "../../data/quiz.json";
import anglicismesData from "../../data/anglicismes.json";
import contractionsData from "../../data/contractions.json";
import itemsData from "../../data/items.json";
import pronomsYEnData from "../../data/pronoms_y_en.json";
import sacresData from "../../data/sacres.json";
import tuInterrogatifData from "../../data/tu_interrogatif.json";
import tutoiementData from "../../data/tutoiement.json";
import onboardingData from "../../data/onboarding.json";
import badgesData from "../../data/badges.json";
import AdminProgression from "./AdminProgression";
import AdminDataTab from "./AdminDataTab";
import AudioRecorderModal from "./AudioRecorderModal";
import DataGeneratorModal from "./DataGeneratorModal";
import AdminStats from "./AdminStats";
import AdminCreatorHub from "./AdminCreatorHub";
import AdminMembers from "./AdminMembers";
import AdminForfaits from "./AdminForfaits";
import AdminScenarios from "./AdminScenarios";
import AdminIA from "./AdminIA";
import AdminSEO from "./AdminSEO";
import Changelog from "../../components/Changelog";
import AdminMechanics from "./AdminMechanics";
import AdminPlatformConfig from "./AdminPlatformConfig";
import AdminRoyalties from "./AdminRoyalties";
import AdminTags from "./AdminTags";
import AdminWhitelabel from "./AdminWhitelabel";
import AdminParcours from "./AdminParcours";
import AdminWebsite from "./AdminWebsite";
import { useTenant } from "../../store/useTenant";
import { useProgression } from "../../store/useProgression";
import { useSettings } from "../../store/useSettings";
import { useAppConfig } from "../../store/useAppConfig";

const SITUATION_MAPPING: Record<string, string> = {
  Nourriture: "Au resto ou à l'épicerie 🍔",
  Magasinage: "En faisant les magasins 🛍️",
  Argent: "En parlant d'argent / Banques 💰",
  Transport: "Dans le trafic ou le métro 🚌",
  Quotidien: "Dans la vie de tous les jours 📅",
  Banque: "En payant ses factures 💳",
  Vêtements: "En s'habillant chaudement 🧤",
  "Hiver/Météo": "Pendant une tempête de neige ❄️",
  Météo: "En regardant dehors 🌧️",
  Logement: "Dans son appartement 🏠",
  Nature: "Dans le bois / Au chalet 🌲",
  "Marché du travail": "En entrevue ou au bureau 💼",
  Emploi: "Au travail avec les collègues 🏢",
  Administration: "En faisant de la paperasse 📄",
  Santé: "À la clinique / L'hôpital 🏥",
  Éducation: "À l'école ou au Cégep 🎓",
  TEFAQ: "Pendant un examen officiel 📝",
  Relations: "Avec son chum ou sa blonde ❤️",
  Expressions: "En jasant avec les locaux 🗣️",
  Émotions: "Pour exprimer un feeling 😊",
  "Expressions de base": "Dans n'importe conversation 👋",
  Culture: "En découvrant le Québec ⚜️",
  Franglais: "Dans une business (Franglais) 🤝",
};

type TabId =
  | "dashboard"
  | "creator_hub"
  | "members"
  | "whitelabel"
  | "stats"
  | "seo"
  | "config"
  | "platform"
  | "theme"
  | "forfaits"
  | "scenarios"
  | "badges"
  | "mots"
  | "quiz"
  | "anglicismes"
  | "contractions"
  | "items"
  | "pronoms_y_en"
  | "sacres"
  | "tu_interrogatif"
  | "tutoiement"
  | "progression"
  | "parcours"
  | "onboarding"
  | "ia"
  | "mechanics"
  | "tags"
  | "website"
  | "changelog"
  | "royalties";

interface AdminScreenProps {
  onBack: () => void;
}

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/useAuth';

export default function AdminScreen({ onBack }: AdminScreenProps) {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const { claims } = useAuth();
  const isSuperAdmin = claims?.role === 'superadmin';
  const isAdmin = isSuperAdmin || claims?.role === 'admin';
  const isCreator = isAdmin || claims?.role === 'creator';
  const currentTenant = useTenant(s => s.currentTenant);
  const role = currentTenant?.type === 'saas' ? 'superadmin' : 'client';
  const { tags: availableTags } = useAppConfig();
  const [activeTab, setActiveTab] = useState<TabId>(isCreator && !isAdmin ? "creator_hub" : "dashboard");

  const [words, setWords] = useState<any[]>(motsData);
  const [quizzes, setQuizzes] = useState<any[]>(quizData);
  const [anglicismes, setAnglicismes] = useState<any[]>(anglicismesData);
  const [contractions, setContractions] = useState<any[]>(contractionsData);
  const [items, setItems] = useState<any>(itemsData);
  const [pronomsYEn, setPronomsYEn] = useState<any[]>(pronomsYEnData);
  const [sacres, setSacres] = useState<any[]>(sacresData);
  const [tuInterrogatif, setTuInterrogatif] =
    useState<any[]>(tuInterrogatifData);
  const [tutoiement, setTutoiement] = useState<any[]>(tutoiementData);
  const [onboarding, setOnboarding] = useState<any[]>(onboardingData);
  const [badges, setBadges] = useState<any[]>(badgesData);

  if (!isCreator)
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 font-sans"
        style={{
          backgroundColor: theme.colors.header,
          color: theme.colors.surface,
        }}
      >
        <div
          className="w-full max-w-sm p-8 rounded-2xl shadow-2xl border text-center"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: `color-mix(in srgb, ${theme.colors.ink} 10%, transparent)`,
            color: theme.colors.ink,
          }}
        >
          <div className="flex justify-center mb-6">
            <div
              className="p-4 rounded-full"
              style={{
                backgroundColor: `color-mix(in srgb, ${theme.colors.danger} 20%, transparent)`,
                color: theme.colors.danger,
              }}
            >
              <Lock className="w-8 h-8" />
            </div>
          </div>
          <h2
            className="text-2xl font-bold mb-2 font-display"
            style={{ color: theme.colors.ink }}
          >
            Accès Réservé
          </h2>
          <p className="text-sm mb-6" style={{ color: theme.colors.muted }}>
            Vous devez être connecté avec un compte administrateur pour accéder
            à cette section.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="w-full font-bold py-3 rounded-xl transition-colors hover:opacity-90"
            style={{
              backgroundColor: theme.colors.primary,
              color: theme.colors.surface,
            }}
          >
            Retour
          </button>
        </div>
      </div>
    );

  const getTabCount = (tabId: TabId) => {
    switch (tabId) {
      case "mots":
        return words.length;
      case "quiz":
        return quizzes.length;
      case "anglicismes":
        return anglicismes.length;
      case "contractions":
        return contractions.length;
      case "items":
        return Object.values(items).length;
      case "pronoms_y_en":
        return pronomsYEn.length;
      case "sacres":
        return sacres.length;
      case "tu_interrogatif":
        return tuInterrogatif.length;
      case "tutoiement":
        return tutoiement.length;
      case "onboarding":
        return onboarding.length;
      case "badges":
        return badges.length;
      case "mechanics":
        return 25;
      default:
        return null;
    }
  };

  const TAB_GROUPS = [
    {
      name: "Super Admin (Plateforme)",
      tabs: [
        { id: "platform", label: "⚙️ Plateforme & Locataires" },
        { id: "forfaits", label: "💰 Forfaits" },
      ],
    },
    {
      name: "Administration (Client Whitelabel)",
      tabs: [
        { id: "creator_hub", label: "📦 Hub Créateur (Cours & Bundles)" },
        { id: "royalties", label: "💸 Revenus & Redevances" },
        { id: "members", label: "👥 Membres & Formateurs" },
        { id: "config", label: "⚙️ Configuration (App)" },
        { id: "stats", label: "📊 Stats & Joueurs" },
        { id: "theme", label: "🎨 Marque & Thème" },
        { id: "tags", label: "🏷️ Tags & Taxonomie" },
        { id: "ia", label: "✨ Assistant IA & Génération" },
        { id: "website", label: "🚀 Site Vitrine" },
        { id: "seo", label: "🔍 Dashboard SEO" },
        { id: "changelog", label: "📜 Changelog" },
      ],
    },
    {
      name: "Système & Gamification",
      tabs: [
        { id: "items", label: "🛍️ Boutique" },
        { id: "badges", label: "🏅 Badges" },
        { id: "mechanics", label: "🧩 Mécaniques" },
      ],
    },
    {
      name: "Progression & Scénarios",
      tabs: [
        { id: "scenarios", label: "🎭 Scénarios" },
        { id: "progression", label: "📈 Progression" },
        { id: "parcours", label: "🛤️ Parcours" },
        { id: "onboarding", label: "👋 Onboarding" },
      ],
    },
    {
      name: "Contenu Pédagogique",
      tabs: [
        { id: "mots", label: "Expressions" },
        { id: "quiz", label: "Quiz" },
        { id: "anglicismes", label: "Anglicismes" },
        { id: "contractions", label: "Contractions" },
        { id: "pronoms_y_en", label: "Y et En" },
        { id: "sacres", label: "Sacres" },
        { id: "tu_interrogatif", label: "Tu Interroactif" },
        { id: "tutoiement", label: "Tutoiement" },
      ],
    },
  ];

  const isDark = theme.dark;
  const cardStyle = {
    backgroundColor: theme.colors.surface,
    borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
    color: theme.colors.ink,
  };
  const subBtnStyle = (isActive = false) => ({
    backgroundColor: isActive
      ? `${theme.colors.primary}15`
      : isDark
        ? "rgba(255, 255, 255, 0.03)"
        : "rgba(0, 0, 0, 0.02)",
    borderColor: isActive
      ? theme.colors.primary
      : isDark
        ? "rgba(255, 255, 255, 0.06)"
        : "rgba(0, 0, 0, 0.05)",
  });

  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={{ backgroundColor: theme.colors.bg, color: theme.colors.ink }}
    >
      <div
        className="p-4 shadow-sm flex items-center justify-between z-20 sticky top-0 border-b"
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: isDark
            ? "rgba(255, 255, 255, 0.08)"
            : "rgba(0, 0, 0, 0.08)",
          color: theme.colors.ink,
        }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() =>
              activeTab === "dashboard" ? onBack() : setActiveTab("dashboard")
            }
            className="p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: theme.colors.ink }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-black tracking-tight">
            {activeTab === "dashboard"
              ? "Gestionnaire (Admin)"
              : TAB_GROUPS.flatMap((g) => g.tabs).find(
                  (t) => t.id === activeTab,
                )?.label || "Administration"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <select
              className="text-xs font-bold px-2 py-1.5 rounded-lg border"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
                color: theme.colors.ink
              }}
              value={currentTenant?.id || 'eduforge'}
              onChange={(e) => {
                useTenant.getState().simulateTenantSwitch(e.target.value);
                if (e.target.value !== 'eduforge') {
                  setActiveTab("dashboard");
                }
              }}
            >
              <option value="eduforge" style={{ color: "black" }}>👑 EduForge (SaaS)</option>
              <option value="mots_blocs" style={{ color: "black" }}>🍁 Mots & Blocs (Client)</option>
              <option value="labo_test" style={{ color: "black" }}>🧪 Labo Test (Client)</option>
            </select>
          )}
          <div
            className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-xl border shadow-sm"
            style={{
              backgroundColor: role === 'superadmin' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              borderColor: role === 'superadmin' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              color: role === 'superadmin' ? '#3b82f6' : '#10b981',
            }}
          >
            {role === "superadmin" ? "👑 Super Admin (SaaS)" : "🏢 Client Whitelabel"}
          </div>
          <div
            className="hidden sm:block text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.05)",
              color: theme.colors.muted,
            }}
          >
            Éditeur Local
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto h-full flex flex-col">
        {activeTab === "dashboard" ? (
          <div className="p-6 max-w-6xl mx-auto w-full">
            {role !== "superadmin" && (
              <div
                className="mb-6 p-4 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4"
                style={{
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.03)"
                    : "#f8fafc",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#cbd5e1",
                }}
              >
                <div className="text-left">
                  <h3
                    className="font-black text-sm"
                    style={{ color: theme.colors.ink }}
                  >
                    🏢 Mode Client B2B Actif
                  </h3>
                  <p className="text-xs" style={{ color: theme.colors.muted }}>
                    Certaines fonctionnalités globales de la plateforme (Super
                    Admin) sont masquées dans ce mode. Vous pouvez changer de locataire via le sélecteur en haut à droite.
                  </p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Marque Blanche Bento */}
              {isAdmin && (
                <div
                  className="rounded-3xl p-6 shadow-sm border lg:col-span-2 row-span-2 flex flex-col"
                  style={cardStyle}
                >
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="p-3 rounded-2xl"
                    style={{
                      backgroundColor: `${theme.colors.primary}15`,
                      color: theme.colors.primary,
                    }}
                  >
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <h2
                      className="text-xl font-black"
                      style={{ color: theme.colors.ink }}
                    >
                      Marque Blanche
                    </h2>
                    <p
                      className="text-sm font-medium"
                      style={{ color: theme.colors.muted }}
                    >
                      Apparence & Configuration
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <button
                    onClick={() => setActiveTab("whitelabel")}
                    className="p-4 rounded-2xl border transition-all text-left group"
                    style={subBtnStyle()}
                  >
                    <Palette
                      className="w-5 h-5 text-blue-500 mb-2"
                      style={{ color: theme.colors.primary }}
                    />
                    <h3
                      className="font-bold text-sm mb-1 group-hover:opacity-80"
                      style={{ color: theme.colors.ink }}
                    >
                      Identité & Thème
                    </h3>
                    <p
                      className="text-xs"
                      style={{ color: theme.colors.muted }}
                    >
                      Couleurs, nom et paramètres
                    </p>
                  </button>
                  <button
                    onClick={() => setActiveTab("website")}
                    className="p-4 rounded-2xl border transition-all text-left group"
                    style={subBtnStyle()}
                  >
                    <Globe
                      className="w-5 h-5 mb-2"
                      style={{ color: theme.colors.primary }}
                    />
                    <h3
                      className="font-bold text-sm mb-1 group-hover:opacity-80"
                      style={{ color: theme.colors.ink }}
                    >
                      Site Vitrine
                    </h3>
                    <p
                      className="text-xs"
                      style={{ color: theme.colors.muted }}
                    >
                      Landing page et contenu
                    </p>
                  </button>
                  <button
                    onClick={() => setActiveTab("seo")}
                    className="p-4 rounded-2xl border transition-all text-left group"
                    style={subBtnStyle()}
                  >
                    <Search
                      className="w-5 h-5 mb-2 text-blue-500"
                      style={{ color: theme.colors.primary }}
                    />
                    <h3
                      className="font-bold text-sm mb-1 group-hover:opacity-80"
                      style={{ color: theme.colors.ink }}
                    >
                      Dashboard SEO
                    </h3>
                    <p
                      className="text-xs"
                      style={{ color: theme.colors.muted }}
                    >
                      Performances & trafic organique
                    </p>
                  </button>
                  <button
                    onClick={() => setActiveTab("changelog")}
                    className="p-4 rounded-2xl border transition-all text-left group"
                    style={subBtnStyle()}
                  >
                    <ScrollText
                      className="w-5 h-5 mb-2 text-blue-500"
                      style={{ color: theme.colors.primary }}
                    />
                    <h3
                      className="font-bold text-sm mb-1 group-hover:opacity-80"
                      style={{ color: theme.colors.ink }}
                    >
                      Changelog
                    </h3>
                    <p
                      className="text-xs"
                      style={{ color: theme.colors.muted }}
                    >
                      Historique des mises à jour
                    </p>
                  </button>
                  <button
                    onClick={() => setActiveTab("tags")}
                    className="p-4 rounded-2xl border transition-all text-left group"
                    style={subBtnStyle()}
                  >
                    <Tags
                      className="w-5 h-5 mb-2"
                      style={{ color: theme.colors.primary }}
                    />
                    <h3
                      className="font-bold text-sm mb-1 group-hover:opacity-80"
                      style={{ color: theme.colors.ink }}
                    >
                      Tags & Taxonomie
                    </h3>
                    <p
                      className="text-xs"
                      style={{ color: theme.colors.muted }}
                    >
                      Gérer les catégories globales
                    </p>
                  </button>
                  <button
                    onClick={() => setActiveTab("ia")}
                    className="p-4 rounded-2xl border transition-all text-left group flex items-center justify-between"
                    style={subBtnStyle()}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles
                          className="w-5 h-5 text-purple-500"
                          style={{ color: theme.colors.accent }}
                        />
                        <h3
                          className="font-bold text-sm group-hover:opacity-80"
                          style={{ color: theme.colors.ink }}
                        >
                          Assistant IA
                        </h3>
                      </div>
                      <p
                        className="text-xs"
                        style={{ color: theme.colors.muted }}
                      >
                        Configuration du modèle et prompts
                      </p>
                    </div>
                  </button>
                </div>
              </div>
              )}

              {/* Analytique */}
              <button
                onClick={() => setActiveTab("stats")}
                className="rounded-3xl p-6 shadow-sm border hover:shadow-md transition-all text-left flex flex-col group"
                style={cardStyle}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-3 rounded-2xl"
                    style={{
                      backgroundColor: `${theme.colors.success}15`,
                      color: theme.colors.success,
                    }}
                  >
                    <LineChart className="w-6 h-6" />
                  </div>
                  <h2
                    className="text-lg font-black"
                    style={{ color: theme.colors.ink }}
                  >
                    Analytique
                  </h2>
                </div>
                <p
                  className="text-sm mb-4"
                  style={{ color: theme.colors.muted }}
                >
                  Suivi des joueurs, progression et rétention.
                </p>
                <div className="mt-auto flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 bg-slate-200 dark:bg-slate-700"
                      style={{ borderColor: theme.colors.surface }}
                    />
                  ))}
                  <div
                    className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                    style={{
                      borderColor: theme.colors.surface,
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.05)",
                      color: theme.colors.muted,
                    }}
                  >
                    +12
                  </div>
                </div>
              </button>

              {/* Espace Créateur */}
              <button
                onClick={() => setActiveTab("creator_hub")}
                className="rounded-3xl p-6 shadow-sm border hover:shadow-md transition-all text-left flex flex-col group lg:col-span-1"
                style={cardStyle}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-3 rounded-2xl"
                    style={{
                      backgroundColor: `${theme.colors.secondary || '#8b5cf6'}15`,
                      color: theme.colors.secondary || '#8b5cf6',
                    }}
                  >
                    <Package className="w-6 h-6" />
                  </div>
                  <h2
                    className="text-lg font-black"
                    style={{ color: theme.colors.ink }}
                  >
                    Espace Formateur
                  </h2>
                </div>
                <p
                  className="text-sm mb-4"
                  style={{ color: theme.colors.muted }}
                >
                  Gérez vos cours et bundles.
                </p>
              </button>

              <button
                onClick={() => setActiveTab("royalties")}
                className="rounded-3xl p-6 shadow-sm border hover:shadow-md transition-all text-left flex flex-col group lg:col-span-1"
                style={cardStyle}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-3 rounded-2xl"
                    style={{
                      backgroundColor: `${theme.colors.success}15`,
                      color: theme.colors.success,
                    }}
                  >
                    <LineChart className="w-6 h-6" />
                  </div>
                  <h2
                    className="text-lg font-black"
                    style={{ color: theme.colors.ink }}
                  >
                    Redevances
                  </h2>
                </div>
                <p
                  className="text-sm mb-4"
                  style={{ color: theme.colors.muted }}
                >
                  Suivi des revenus et partages.
                </p>
              </button>

              {/* Membres & Formateurs */}
              {isAdmin && (
              <button
                onClick={() => setActiveTab("members")}
                className="rounded-3xl p-6 shadow-sm border hover:shadow-md transition-all text-left flex flex-col group"
                style={cardStyle}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-3 rounded-2xl"
                    style={{
                      backgroundColor: `${theme.colors.primary}15`,
                      color: theme.colors.primary,
                    }}
                  >
                    <User className="w-6 h-6" />
                  </div>
                  <h2
                    className="text-lg font-black"
                    style={{ color: theme.colors.ink }}
                  >
                    Membres
                  </h2>
                </div>
                <p
                  className="text-sm mb-4"
                  style={{ color: theme.colors.muted }}
                >
                  Gestion des formateurs et des partages de revenus.
                </p>
              </button>
              )}

              {/* Progression & Scénarios */}
              {isAdmin && (
              <div
                className="rounded-3xl p-6 shadow-sm border lg:col-span-2"
                style={cardStyle}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-3 rounded-2xl"
                    style={{
                      backgroundColor: `${theme.colors.gold}15`,
                      color: theme.colors.gold,
                    }}
                  >
                    <LayoutGrid className="w-6 h-6" />
                  </div>
                  <div>
                    <h2
                      className="text-lg font-black"
                      style={{ color: theme.colors.ink }}
                    >
                      Progression & Apprentissage
                    </h2>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: "parcours", icon: "🛤️", label: "Parcours" },
                    { id: "progression", icon: "📈", label: "Niveaux" },
                    { id: "scenarios", icon: "🎭", label: "Scénarios" },
                    { id: "onboarding", icon: "👋", label: "Onboarding" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as TabId)}
                      className="p-3 rounded-2xl border transition-colors text-center flex flex-col items-center justify-center gap-2 aspect-square group"
                      style={subBtnStyle()}
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <span
                        className="text-xs font-bold group-hover:opacity-80"
                        style={{ color: theme.colors.ink }}
                      >
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              )}

              {/* Gamification */}
              {isAdmin && (
              <div
                className="rounded-3xl p-6 shadow-sm border"
                style={cardStyle}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-3 rounded-2xl"
                    style={{
                      backgroundColor: `${theme.colors.danger}15`,
                      color: theme.colors.danger,
                    }}
                  >
                    <Award className="w-6 h-6" />
                  </div>
                  <h2
                    className="text-lg font-black"
                    style={{ color: theme.colors.ink }}
                  >
                    Gamification
                  </h2>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab("badges")}
                    className="w-full p-3 rounded-xl border transition-colors text-left flex items-center gap-3 group"
                    style={subBtnStyle()}
                  >
                    <span className="text-xl">🏅</span>
                    <span
                      className="font-bold text-sm group-hover:opacity-80"
                      style={{ color: theme.colors.ink }}
                    >
                      Badges & Succès
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("items")}
                    className="w-full p-3 rounded-xl border transition-colors text-left flex items-center gap-3 group"
                    style={subBtnStyle()}
                  >
                    <span className="text-xl">🛍️</span>
                    <span
                      className="font-bold text-sm group-hover:opacity-80"
                      style={{ color: theme.colors.ink }}
                    >
                      Boutique & Objets
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("mechanics")}
                    className="w-full p-3 rounded-xl border transition-colors text-left flex items-center gap-3 group"
                    style={subBtnStyle()}
                  >
                    <span className="text-xl">🧩</span>
                    <span
                      className="font-bold text-sm group-hover:opacity-80"
                      style={{ color: theme.colors.ink }}
                    >
                      Mécaniques
                    </span>
                  </button>
                </div>
              </div>
              )}

              {/* Contenu Pédagogique (Vocab & Grammaire) */}
              <div
                className="rounded-3xl p-6 shadow-sm border lg:col-span-3"
                style={cardStyle}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-3 rounded-2xl"
                    style={{
                      backgroundColor: `${theme.colors.primary}15`,
                      color: theme.colors.primary,
                    }}
                  >
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h2
                    className="text-lg font-black"
                    style={{ color: theme.colors.ink }}
                  >
                    Base de Données Pédagogique
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "mots", label: "Expressions", count: words.length },
                    { id: "quiz", label: "Quiz", count: quizzes.length },
                    {
                      id: "anglicismes",
                      label: "Anglicismes",
                      count: anglicismes.length,
                    },
                    {
                      id: "contractions",
                      label: "Contractions",
                      count: contractions.length,
                    },
                    {
                      id: "pronoms_y_en",
                      label: "Y et En",
                      count: pronomsYEn.length,
                    },
                    { id: "sacres", label: "Sacres", count: sacres.length },
                    {
                      id: "tu_interrogatif",
                      label: "Tu Interroactif",
                      count: tuInterrogatif.length,
                    },
                    {
                      id: "tutoiement",
                      label: "Tutoiement",
                      count: tutoiement.length,
                    },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as TabId)}
                      className="px-4 py-2 rounded-full border transition-colors flex items-center gap-2 group"
                      style={subBtnStyle()}
                    >
                      <span
                        className="font-bold text-sm group-hover:opacity-80"
                        style={{ color: theme.colors.ink }}
                      >
                        {item.label}
                      </span>
                      <span
                        className="text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm border"
                        style={{
                          backgroundColor: theme.colors.surface,
                          borderColor: isDark
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(0,0,0,0.05)",
                          color: theme.colors.primary,
                        }}
                      >
                        {item.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Super Admin - only visible if superadmin */}
              {role === "superadmin" && (
                <div
                  className="rounded-3xl p-6 shadow-sm border lg:col-span-3 flex flex-col sm:flex-row gap-4 items-center justify-between"
                  style={{
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(15, 23, 42, 0.95)",
                    borderColor: isDark ? "rgba(255,255,255,0.1)" : "#1e293b",
                    color: isDark ? theme.colors.ink : "#ffffff",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="p-3 rounded-2xl"
                      style={{
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(255,255,255,0.1)",
                      }}
                    >
                      <Settings className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black">
                        Super Admin (Plateforme globale)
                      </h2>
                      <p className="text-sm opacity-75">
                        Locataires, forfaits et configuration de base.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setActiveTab("platform")}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold text-sm transition-colors text-center border"
                      style={{
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(255,255,255,0.1)",
                        borderColor: "rgba(255,255,255,0.2)",
                        color: "#ffffff",
                      }}
                    >
                      Plateforme & Locataires
                    </button>
                    <button
                      onClick={() => setActiveTab("forfaits")}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold text-sm transition-colors text-center border"
                      style={{
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(255,255,255,0.1)",
                        borderColor: "rgba(255,255,255,0.2)",
                        color: "#ffffff",
                      }}
                    >
                      Forfaits
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            className="flex-1 flex flex-col relative overflow-hidden"
            style={{ backgroundColor: theme.colors.bg }}
          >
            {[
              "onboarding",
              "badges",
              "mots",
              "quiz",
              "anglicismes",
              "contractions",
              "items",
              "pronoms_y_en",
              "sacres",
              "tu_interrogatif",
              "tutoiement",
            ].includes(activeTab) ? (
              <div className="flex-1 overflow-auto">
                {activeTab === "onboarding" && <AdminDataTab activeTab={activeTab} dataList={onboarding} setDataList={setOnboarding} isDark={isDark} />}
                {activeTab === "badges" && <AdminDataTab activeTab={activeTab} dataList={badges} setDataList={setBadges} isDark={isDark} />}
                {activeTab === "mots" && <AdminDataTab activeTab={activeTab} dataList={words} setDataList={setWords} isDark={isDark} />}
                {activeTab === "quiz" && <AdminDataTab activeTab={activeTab} dataList={quizzes} setDataList={setQuizzes} isDark={isDark} />}
                {activeTab === "anglicismes" && <AdminDataTab activeTab={activeTab} dataList={anglicismes} setDataList={setAnglicismes} isDark={isDark} />}
                {activeTab === "contractions" && <AdminDataTab activeTab={activeTab} dataList={contractions} setDataList={setContractions} isDark={isDark} />}
                {activeTab === "items" && <AdminDataTab activeTab={activeTab} dataList={Object.values(items)} setDataList={(newList) => {
                  const newItems: any = {};
                  newList.forEach((item) => newItems[item.id || item.nom] = item);
                  setItems(newItems);
                }} isDark={isDark} />}
                {activeTab === "pronoms_y_en" && <AdminDataTab activeTab={activeTab} dataList={pronomsYEn} setDataList={setPronomsYEn} isDark={isDark} />}
                {activeTab === "sacres" && <AdminDataTab activeTab={activeTab} dataList={sacres} setDataList={setSacres} isDark={isDark} />}
                {activeTab === "tu_interrogatif" && <AdminDataTab activeTab={activeTab} dataList={tuInterrogatif} setDataList={setTuInterrogatif} isDark={isDark} />}
                {activeTab === "tutoiement" && <AdminDataTab activeTab={activeTab} dataList={tutoiement} setDataList={setTutoiement} isDark={isDark} />}
              </div>
            ) : (
              <div className="flex-1 overflow-auto">
                {activeTab === "stats" && <AdminStats />}
                {activeTab === "creator_hub" && <AdminCreatorHub />}
                {activeTab === "royalties" && <AdminRoyalties />}
                {activeTab === "members" && <AdminMembers />}
                {activeTab === "platform" && <AdminPlatformConfig />}
                {activeTab === "whitelabel" && <AdminWhitelabel />}
                {activeTab === "website" && (
                  <AdminWebsite  />
                )}
                {activeTab === "seo" && <AdminSEO />}
                {activeTab === "changelog" && <Changelog />}
                {activeTab === "config" && <AdminWhitelabel />}
                {activeTab === "theme" && <AdminWhitelabel />}
                {activeTab === "tags" && <AdminTags />}
                {activeTab === "ia" && <AdminIA />}
                {activeTab === "forfaits" && <AdminForfaits />}
                {activeTab === "scenarios" && <AdminScenarios />}
                {activeTab === "progression" && <AdminProgression />}
                {activeTab === "parcours" && <AdminParcours />}
                {activeTab === "mechanics" && <AdminMechanics />}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
