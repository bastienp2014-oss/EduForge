import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Circle, ArrowLeft, Map, CheckSquare, 
  Plus, Trash2, Edit2, Save, X, Target, LayoutList, Database, 
  Lightbulb, DollarSign, Activity, FileText, ChevronUp, ChevronDown
} from 'lucide-react';

export interface Task {
  id: string;
  title: string;
  quoi?: string;
  pourquoi?: string;
  comment?: string;
  completed: boolean;
}

export interface Phase {
  id: string;
  title: string;
  iconName: string;
  tasks: Task[];
}

const DEFAULT_PHASES: Phase[] = [
  {
    id: 'p0',
    title: 'Phase 0 : Contexte & Persona (Mohammed du Maroc)',
    iconName: 'LayoutList',
    tasks: [
      {
        id: '0_1', title: 'Persona Cible : Mohammed du Maroc', completed: true,
        quoi: 'Immigrant francophone (ou avec de bonnes bases), adulte, cherchant à s\'intégrer au Québec.',
        pourquoi: 'Il ne cherche pas à apprendre le français de zéro, mais à comprendre l\'accent, les expressions (sacres, anglicismes), et l\'administration (Loi 31, SAAQ) pour survivre et travailler.',
        comment: 'Le ton de l\'application doit être mature, centré sur la survie réelle (logement, emploi, choc culturel) et non infantilisant.'
      },
      {
        id: '0_2', title: 'Architecture Bipolaire (Apprendre vs Explorer)', completed: true,
        quoi: 'Scinder l\'app en deux : "Apprendre" (Cursus structuré de 8 niveaux) et "Explorer / La Rue Principale" (Espace bac à sable avec l\'économie et les services).',
        pourquoi: 'Respecter le besoin d\'autonomie des apprenants adultes (théorie Deci & Ryan) tout en offrant une progression rassurante.',
        comment: 'Onglets distincts. "Apprendre" contient les leçons séquencées. "La Rue Principale" contient les bâtiments (SAAQ, Épicerie) que l\'utilisateur consulte selon ses besoins.'
      }
    ]
  },
  {
    id: 'p1',
    title: 'Phase 1 : Onboarding, Urgences & ASO',
    iconName: 'Target',
    tasks: [
      { 
        id: '1_1', title: 'Onboarding Profilage (Questionnaire d\'Urgences)', completed: true,
        quoi: 'Poser la question : "Quelle est votre priorité actuelle ?" pour débloquer immédiatement les éléments vitaux dans la Rue Principale.',
        pourquoi: 'Personnaliser l\'accès sans exiger de passage de niveau.',
        comment: 'Intégrer un espace Onboarding dans l\'Admin où on peut facilement modifier ou ajouter des questions de profilage/priorité dynamiquement.'
      },
      {
        id: '1_2', title: 'Onboarding "Choc de la réalité" (Compte à rebours)', completed: true,
        quoi: 'Compte à rebours rouge basé sur la date d\'arrivée (Permis SAAQ, RAMQ).',
        pourquoi: 'Frapper fort sur une douleur immédiate pour prouver l\'utilité de l\'app ("Life-saving").',
        comment: 'Écran interactif demandant la date d\'arrivée et générant une timeline d\'urgence.'
      },
      {
        id: '1_3', title: 'Profilage Francophone (Bypass Linguistique)', completed: false,
        quoi: 'Identifier si l\'utilisateur est déjà francophone (France, Afrique du Nord, Afrique de l\'Ouest, etc.) à l\'inscription.',
        pourquoi: 'Les niveaux MIFI 1 à 4 sont trop basiques pour eux. Ils veulent seulement s\'adapter à l\'accent, au lexique québécois, et à la culture.',
        comment: 'Créer un embranchement (ex: "Je parle déjà français"). Cela débloque directement les Niveaux 5 et +, ou active un "Test de placement" qui omet la grammaire de base, et focalise sur les régionalismes / contractions ("Chu", sacres, anglicismes).'
      }
    ]
  },
  {
    id: 'p2',
    title: 'Phase 2 : Progression sur 8 Niveaux (Alignement MIFI / CECRL)',
    iconName: 'Lightbulb',
    tasks: [
      {
        id: '2_1', title: 'Restructuration des Json Pédagogiques (Les 8 paliers)', completed: true,
        quoi: 'Associer le contenu cognitif et linguistique actuel aux 8 paliers (Niveau 1: Le Nouveau-Venu à Niveau 8: L\'Ambassadeur).',
        pourquoi: 'Permettre une vraie courbe de progression alignée sur l\'Échelle québécoise et ciblant le choc culturel.',
        comment: 'Ajouter une propriété `niveau: number` dans chaque item des données JSON locales (mots, quiz, anglicismes).'
      },
      {
        id: '2_2', title: 'L\'Écoute Auditive : Relâchement & Contractions', completed: true,
        quoi: 'Intégration d\'audios réalistes pour pratiquer la compréhension orale.',
        pourquoi: 'La prononciation des voyelles relâchées (Niv 1-2) et la décompression acoustique (Les contractions des pronoms Niv 3-4, ex: "Chu") sont les ponts vers l\'intégration auditive réelle.',
        comment: 'Ajouter un bouton d\'enregistrement audio dans l\'interface Admin pour chaque mot/expression. Prévoir l\'intégration de TTS (Text-to-Speech) et banques audios pour de imports massifs.'
      },
      { 
        id: '2_3', title: 'Le Pokedex des Faux-Amis et Culturel', completed: true,
        quoi: 'Cartes mémorielles d\'urgence pour les mots dangereux, incluant Anglicismes et "Tu" Interrogatif.',
        pourquoi: 'Désamorcer les malentendus lexicaux majeurs dès les premiers niveaux.',
        comment: 'Déjà en partie réalisé (mots.json, anglicismes.json), à classifier pour les distribuer dans le "Parcours Guidé".'
      },
      {
        id: '2_4', title: 'Cadrage des Sacres (Module Avancé Niv. 6/7)', completed: true,
        quoi: 'Intégrer les sacres québécois uniquement à un stade avancé (Niveau 6 : Le Gérant d\'Estrade, Niveau 7 : L\'Habitué).',
        pourquoi: 'Permettre à l\'apprenant avancé de décoder l\'humeur et la charge émotive intense sans inciter à l\'utilisation vulgarisée précipitée.',
        comment: 'Dictionnaire "verrouillé" pour l\'Habitué, explication syntaxique de l\'utilisation en intensificateur ("Crisse que c\'est bon").'
      }
    ]
  },
  {
    id: 'p3',
    title: 'Phase 3 : La Rue Principale (Simulation Financière & Vie)',
    iconName: 'Map',
    tasks: [
      {
        id: '5_1', title: 'Sauvegarde de l\'Économie Réaliste et Boutique', completed: true,
        quoi: 'Maintenir la gestion des Items et du Coût de la vie existant (Piasses, loyer, épicerie).',
        pourquoi: 'La réalité monétaire prépare au choc financier local et soutient la motivation ludique en incitant l\'apprenant à terminer ses niveaux (pour payer son loyer métaphorique).',
        comment: 'Conservation du menu "Items", les prix restent indexés sur le coût réel. Gagner des devises par l\'effort linguistique.'
      },
      {
        id: '5_2', title: 'L\'Arcade (Entraînement Libre)', completed: true,
        quoi: 'Ajouter un "Centre de jeux / Arcade" sur la Rue Principale.',
        pourquoi: 'Séparer la théorie sérieuse de la pratique ludique. C\'est la salle de gym pour farmer intensément sans pression narrative.',
        comment: 'Regrouper tous les mini-jeux purement ludiques (Pendu, Lancer de Hache) en accès libre.'
      },
      {
        id: '3_1', title: 'Simulateur : Alerte Logement & Loi 31', completed: false,
        quoi: 'Simulateur SMS avec un propriétaire réclamant un dépôt de garantie (Bâtiment: Appartements / Logement).',
        pourquoi: 'Alerter sur l\'illégalité des cautions et faire économiser de l\'argent. Transforme l\'app en "must-have" utilitaire.',
        comment: 'Déjà intégré partiellement à la création de compte au début. Déplacer ou lier l\'accès via le bâtiment résidentiel dans la Rue Principale.'
      },
      {
        id: '3_2', title: 'Le Filtre à CV (Formation par soustraction)', completed: false,
        quoi: 'Liste de contrôle interactive pour formater le CV à la nord-américaine.',
        pourquoi: 'Retirer la photo, l\'âge et le statut marital pour éviter les rejets en pré-sélection.',
        comment: 'Checklist dynamique validant le profil.'
      },
      {
        id: '3_3', title: 'Simulateur d\'entrevue & Soft Skills', completed: false,
        quoi: 'Scénarios d\'entrevue valorisant le savoir-être et le tutoiement stratégique.',
        pourquoi: 'L\'expérience et l\'adaptation (tutoiement rapide) priment sur les diplômes.',
        comment: 'Arbres de dialogues avec choix multiples et conséquences RH.'
      }
    ]
  },
  {
    id: 'p4',
    title: 'Phase 4 : Rétention & Assistant Personnel (LiveOps)',
    iconName: 'Activity',
    tasks: [
      {
        id: '4_1', title: 'Routine Quotidienne (Apprentissage Espacé - SRS Custom)', completed: false,
        quoi: 'Générer une session de 5-10 minutes chaque jour regroupant des révisions personnalisées (Flashcards, Mini-jeux).',
        pourquoi: 'Le mode "Automatique". Retire la charge mentale du choix à l\'utilisateur. Algorithme interne simple pour la mémoire à long terme.',
        comment: 'Un bouton principal sur l\'accueil "Lancer ma journée" basé sur l\'historique des erreurs.'
      },
      {
        id: '4_2', title: 'Support Multilingue (i18n)', completed: false,
        quoi: 'Proposer l\'interface et les explications critiques en plusieurs langues (Anglais, Espagnol, Arabe, Mandarin, Ukrainien, etc.).',
        pourquoi: 'Une mauvaise compréhension des enjeux légaux/administratifs (bail, santé) peut porter un préjudice grave. L\'information de survie doit être accessible dans la langue maternelle.',
        comment: 'Intégration de i18next avec des fichiers de traduction JSON priorisés sur le vocabulaire de survie et les explications culturelles/légales.'
      },
      {
        id: '4_3', title: 'Alerte Push & Calendrier de Survie', completed: false,
        quoi: 'Notifications pour l\'échange de permis (avant 6 mois), impôts, fin de carence RAMQ et pneus d\'hiver.',
        pourquoi: 'Empêcher la désinstallation après les 90 premiers jours d\'intégration en se rendant vital.',
        comment: 'Système d\'alertes planifiées.'
      },
      {
        id: '4_4', title: 'Radar à Tabous & Civisme (Anti-"Du Coup")', completed: false,
        quoi: 'Exercices d\'intégration poussée : esquiver religion/politique, règles de déneigement, élimination des tics français.',
        pourquoi: 'Atteindre le palier ultime d\'intégration sociale incognito.',
        comment: 'Module de "Quiz de survie sociale".'
      }
    ]
  },
  {
    id: 'p5',
    title: 'Phase 5 : Déploiement Whitelabel, Facturation & Infrastructure',
    iconName: 'Server',
    tasks: [
      {
        id: 'mb_1', title: 'Abstraction du Moteur Linguistique', completed: false,
        quoi: 'Séparer la logique de gamification et de rétention du contenu spécifique au Québec.',
        pourquoi: 'Transformer l\'application en une "coquille vide" réutilisable pour apprendre d\'autres langues ou s\'intégrer dans d\'autres pays.',
        comment: 'S\'assurer que les JSON/Firebase sont agnostiques. Aucun concept culturel hardcodé dans les composants React majeurs.'
      },
      {
        id: 'mb_feat', title: 'Feature Flags & Abonnements (Paywall)', completed: true,
        quoi: 'Mise en place de paliers d\'abonnement (Free/Basic/Premium) pour bloquer/débloquer l\'accès aux modules.',
        pourquoi: 'Préparer la monétisation et permettre de gérer finement l\'accès des apprenants aux différents modules selon la licence de leur organisation ou leur achat.',
        comment: 'Utilisation de `getFeatureFlags()` dans l\'état global basé sur le plan. Interface Admin pour tester.'
      },
      {
        id: 'mb_2', title: 'Tableau de Bord Financier', completed: true,
        quoi: 'Statistiques avancées des utilisateurs, graphiques (Recharts) d\'acquisition et estimation MRR.',
        pourquoi: 'Permet le suivi des KPI de croissance et la rétention.',
        comment: 'Implémenté dans AdminStats (super admin / whitelabel).'
      },
      {
        id: 'mb_3', title: 'Monétisation et Forfaits', completed: true,
        quoi: 'Configuration des limites des forfaits depuis l\'Admin.',
        pourquoi: 'Permet d\'ajuster dynamiquement le modèle freemium ou payant sans déployer de code.',
        comment: 'Implémenté dans AdminForfaits.'
      }
    ]
  },
  {
    id: 'p6',
    title: 'Phase 6 : Marketing, SEO & Déploiement Vitrine (Astro)',
    iconName: 'Target',
    tasks: [
      {
        id: 'mk_1', title: 'Architecture Multi-Tenant & SSR', completed: false,
        quoi: 'Mise en place d\'Astro avec rendu côté serveur (SSR).',
        pourquoi: 'Pour servir dynamiquement les sites B2B et clients selon le nom de domaine.',
        comment: 'Nécessitera une séparation du backend (Headless CMS) et du frontend Astro.'
      },
      {
        id: 'mk_2', title: 'Générateur de Site Promotionnel', completed: false,
        quoi: 'Modèle clé en main intégré au tableau de bord pour configurer la landing page.',
        pourquoi: 'Permettre aux clients de lancer leur site sans code.',
        comment: 'Synchronisation automatique du thème (couleurs, nom) avec l\'app.'
      },
      {
        id: 'mk_3', title: 'Sélection CMS & SEO Pédagogique', completed: true,
        quoi: 'Interface admin pour choisir le contenu à exposer publiquement.',
        pourquoi: 'Générer du trafic organique en utilisant les leçons sélectionnées comme articles SEO.',
        comment: 'L\'app React sert de CMS Headless pour envoyer la donnée ciblée à Astro. Implémenté dans AdminWebsite.'
      },
      {
        id: 'mk_4', title: 'Copywriting Assisté par l\'IA', completed: false,
        quoi: 'Génération de textes marketing et pédagogiques par l\'IA.',
        pourquoi: 'Accélérer la création de contenu pour les landing pages et le blog.',
        comment: 'Utiliser Gemini pour adapter le ton selon le profil client.'
      },
      {
        id: 'mk_5', title: 'Teasers Jouables & Paywall (Lead Gen)', completed: true,
        quoi: 'Intégrer les mini-jeux React directement dans le site Astro avec des limites.',
        pourquoi: 'Captiver les leads avec un essai gratuit bloqué par un paywall/inscription après X minutes.',
        comment: 'Configuration ajoutée dans AdminWebsite.'
      },
      {
        id: 'mk_6', title: 'Mockups UI (Vrais Composants)', completed: false,
        quoi: 'Import direct des vrais composants React de l\'app dans les îlots Astro.',
        pourquoi: 'Garantir que les mockups marketing sont 100% synchronisés avec le design réel.',
        comment: 'L\'IA génère uniquement les fausses données (props) injectées dans ces composants (placés dans des cadres CSS).'
      }
    ]
  }
];

export default function DevelopmentPlan({ onBack }: { onBack: () => void }) {
  const [phases, setPhases] = useState<Phase[]>(DEFAULT_PHASES);
  const [collapsedPhases, setCollapsedPhases] = useState<Record<string, boolean>>({});
  const [collapsedTasks, setCollapsedTasks] = useState<Record<string, boolean>>({});
  
  const togglePhaseCollapse = (phaseId: string) => {
    setCollapsedPhases(prev => ({ ...prev, [phaseId]: !prev[phaseId] }));
  };
  
  const toggleCollapse = (task: Task) => {
    setCollapsedTasks(prev => {
      const isCurrentlyCollapsed = prev[task.id] ?? task.completed;
      return { ...prev, [task.id]: !isCurrentlyCollapsed };
    });
  };
  
  // Edit mode states
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Task>>({});
  
  // Add mode states
  const [addingToPhase, setAddingToPhase] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('mots_blocs_dev_plan_v24'); // Force reset with v24
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPhases(parsed);
        }
      } catch (e) {
        console.error("Failed to parse saved plan.", e);
      }
    } else {
      // Migrate old plan
      const oldPlanStr = localStorage.getItem('mots_blocs_dev_plan_v23');
      if (oldPlanStr) {
        try {
          const oldPlan = JSON.parse(oldPlanStr) as Phase[];
          
          // Merge old completion statuses into new default phases
          const newPhases = DEFAULT_PHASES.map(newPhase => {
            const oldPhase = oldPlan.find(p => p.id === newPhase.id);
            if (!oldPhase) return newPhase;
            
            return {
              ...newPhase,
              tasks: newPhase.tasks.map(newTask => {
                const oldTask = oldPhase.tasks.find(t => t.id === newTask.id);
                return oldTask ? { ...newTask, completed: oldTask.completed } : newTask;
              })
            };
          });
          
          setPhases(newPhases);
          localStorage.setItem('mots_blocs_dev_plan_v24', JSON.stringify(newPhases));
        } catch(e) {}
      }
    }
  }, []);

  const saveToStorage = (newPhases: Phase[]) => {
    localStorage.setItem('mots_blocs_dev_plan_v24', JSON.stringify(newPhases));
  };

  const toggleTask = (taskId: string, phaseId: string) => {
    if (editingTaskId) return; // Don't toggle while editing
    const newPhases = phases.map(phase => {
      if (phase.id !== phaseId) return phase;
      return {
        ...phase,
        tasks: phase.tasks.map(task => 
          task.id === taskId ? { ...task, completed: !task.completed } : task
        )
      };
    });
    setPhases(newPhases);
    
    // Reset collapse state so it defaults to closed when completed and open when not completed
    setCollapsedTasks(prev => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });

    saveToStorage(newPhases);
  };

  const startEditTask = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTaskId(task.id);
    setEditForm({ ...task });
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditForm({});
  };

  const saveEdit = (phaseId: string) => {
    if (!editForm.title || editForm.title.trim() === '') return;
    
    const newPhases = phases.map(phase => {
      if (phase.id !== phaseId) return phase;
      return {
        ...phase,
        tasks: phase.tasks.map(task => 
          task.id === editingTaskId ? { ...task, ...editForm } as Task : task
        )
      };
    });
    setPhases(newPhases);
    saveToStorage(newPhases);
    cancelEdit();
  };

  const deleteTask = (taskId: string, phaseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Voulez-vous vraiment supprimer cette tâche ?')) return;
    
    const newPhases = phases.map(phase => {
      if (phase.id !== phaseId) return phase;
      return {
        ...phase,
        tasks: phase.tasks.filter(t => t.id !== taskId)
      };
    });
    setPhases(newPhases);
    saveToStorage(newPhases);
  };

  const startAddTask = (phaseId: string) => {
    setAddingToPhase(phaseId);
    setEditForm({ title: '', quoi: '', pourquoi: '', comment: '', completed: false });
  };

  const saveNewTask = (phaseId: string) => {
    if (!editForm.title || editForm.title.trim() === '') return;
    
    const newTask: Task = {
      id: `task_${Date.now()}`,
      title: editForm.title,
      quoi: editForm.quoi || '',
      pourquoi: editForm.pourquoi || '',
      comment: editForm.comment || '',
      completed: false
    };

    const newPhases = phases.map(phase => {
      if (phase.id !== phaseId) return phase;
      return {
        ...phase,
        tasks: [...phase.tasks, newTask]
      };
    });
    setPhases(newPhases);
    saveToStorage(newPhases);
    setAddingToPhase(null);
    setEditForm({});
  };

  // Keep a map for icons since we stringified them
  const iconMap: Record<string, React.ReactNode> = {
    Target: <Target className="w-5 h-5 text-indigo-500" />,
    Lightbulb: <Lightbulb className="w-5 h-5 text-amber-500" />,
    Database: <Database className="w-5 h-5 text-sky-500" />,
    Activity: <Activity className="w-5 h-5 text-emerald-500" />,
    LayoutList: <LayoutList className="w-5 h-5 text-purple-500" />
  };

  const totalTasks = phases.reduce((acc, phase) => acc + phase.tasks.length, 0);
  const completedTasks = phases.reduce((acc, phase) => acc + phase.tasks.filter(t => t.completed).length, 0);
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-2 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-6 relative">
          <button 
            onClick={onBack}
            className="absolute top-4 sm:top-6 left-4 sm:left-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center mt-6 sm:mt-2">
            <div className="inline-block p-2 sm:p-3 bg-indigo-500 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 shadow-lg">
              <Map className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mb-2">Plan de Développement Détailé</h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-lg mx-auto">
              S\'alignant sur les analyses de marché et SEO. Visualisez le quoi, pourquoi, et comment. N\'hésitez pas à personnaliser !
            </p>
          </div>
        </div>

        {/* Global Progress */}
        <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
              <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Progression Globale
            </span>
            <span className="font-bold text-indigo-600 text-sm sm:text-base">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-200 h-2.5 sm:h-3 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-500 h-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Quests List */}
        <div className="p-3 sm:p-6 space-y-8 sm:space-y-12">
          {phases.map((phase) => (
            <div key={phase.id} className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => togglePhaseCollapse(phase.id)}>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-slate-100 rounded-lg sm:rounded-xl">{iconMap[phase.iconName] || <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />}</div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">{phase.title}</h2>
                </div>
                <div className="p-1">
                  {collapsedPhases[phase.id] ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronUp className="w-5 h-5 text-slate-400" />}
                </div>
              </div>
              
              {!collapsedPhases[phase.id] && (
                <div className="space-y-3 sm:space-y-4 ml-1.5 sm:ml-2 border-l-2 border-slate-100 pl-3 sm:pl-4 py-1 sm:py-2">
                  {phase.tasks.map(task => {
                    const isEditing = editingTaskId === task.id;
                    
                    if (isEditing) {
                      return (
                        <div key={task.id} className="bg-slate-50 p-4 rounded-2xl border-2 border-indigo-200 space-y-3">
                          <input
                            type="text"
                            value={editForm.title || ''}
                            onChange={e => setEditForm({...editForm, title: e.target.value})}
                            placeholder="Titre de la tâche"
                            className="w-full font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2"
                          />
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Quoi (Objectif)</label>
                            <textarea
                              value={editForm.quoi || ''}
                              onChange={e => setEditForm({...editForm, quoi: e.target.value})}
                              className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 resize-none h-16"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Pourquoi (Raison)</label>
                            <textarea
                              value={editForm.pourquoi || ''}
                              onChange={e => setEditForm({...editForm, pourquoi: e.target.value})}
                              className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 resize-none h-16"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Comment (Technologie/Méthode)</label>
                            <textarea
                              value={editForm.comment || ''}
                              onChange={e => setEditForm({...editForm, comment: e.target.value})}
                              className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 resize-none h-16"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <button onClick={cancelEdit} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 transition-colors">
                              Annuler
                            </button>
                            <button onClick={() => saveEdit(phase.id)} className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-2">
                              <Save className="w-4 h-4" /> Sauvegarder
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={task.id}
                        className={`relative flex items-start gap-3 sm:gap-4 p-3 sm:p-5 rounded-2xl sm:rounded-3xl border-2 transition-all group hover:shadow-md
                          ${task.completed ? 'border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50/50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                      >
                        <div className="mt-0.5 sm:mt-1 shrink-0 cursor-pointer" onClick={() => toggleTask(task.id, phase.id)}>
                          {task.completed ? (
                            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 transition-colors hover:text-emerald-600" />
                          ) : (
                            <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300 group-hover:text-indigo-300 transition-colors" />
                          )}
                        </div>
                        
                        <div className="flex-1 w-full pr-10 sm:pr-16 space-y-2 sm:space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className={`text-sm sm:text-[17px] font-black leading-tight ${task.completed ? 'text-slate-500 line-through decoration-emerald-300 decoration-2' : 'text-slate-800'}`}>
                              {task.title}
                            </h3>
                            {task.completed && (
                              <button onClick={(e) => { e.stopPropagation(); toggleCollapse(task); }} className="p-1 sm:p-2 hover:bg-slate-200 rounded-full transition-colors flex-shrink-0 ml-2">
                                {(collapsedTasks[task.id] ?? task.completed) ? <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" /> : <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />}
                              </button>
                            )}
                          </div>
                          
                          {(!(collapsedTasks[task.id] ?? task.completed) && (task.quoi || task.pourquoi || task.comment)) && (
                            <div className={`space-y-2 mt-1.5 sm:mt-2 ${task.completed ? 'opacity-60' : 'opacity-100'}`}>
                              {task.quoi && (
                                <div className="leading-snug">
                                  <span className="inline-block text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-indigo-500 bg-indigo-50 px-1.5 sm:px-2 py-0.5 rounded mr-1.5 sm:mr-2">Quoi</span>
                                  <span className="text-xs sm:text-sm text-slate-700">{task.quoi}</span>
                                </div>
                              )}
                              {task.pourquoi && (
                                <div className="leading-snug">
                                  <span className="inline-block text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 sm:px-2 py-0.5 rounded mr-1.5 sm:mr-2">Pourquoi</span>
                                  <span className="text-xs sm:text-sm text-slate-700">{task.pourquoi}</span>
                                </div>
                              )}
                              {task.comment && (
                                <div className="leading-snug">
                                  <span className="inline-block text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded mr-1.5 sm:mr-2">Comment</span>
                                  <span className="text-xs sm:text-sm text-slate-600">{task.comment}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action buttons (shown on hover) */}
                        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                          <button 
                            onClick={(e) => startEditTask(task, e)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Modifier la tâche"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => deleteTask(task.id, phase.id, e)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Supprimer la tâche"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add new task section */}
                  {addingToPhase === phase.id ? (
                    <div className="bg-slate-50 p-4 rounded-2xl border-2 border-indigo-200 border-dashed space-y-3 mt-4">
                      <input
                        type="text"
                        value={editForm.title || ''}
                        onChange={e => setEditForm({...editForm, title: e.target.value})}
                        placeholder="Nouvelle tâche..."
                        className="w-full font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2"
                        autoFocus
                      />
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Quoi (Objectif)</label>
                        <textarea
                          value={editForm.quoi || ''}
                          onChange={e => setEditForm({...editForm, quoi: e.target.value})}
                          className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 resize-none h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Pourquoi</label>
                        <textarea
                          value={editForm.pourquoi || ''}
                          onChange={e => setEditForm({...editForm, pourquoi: e.target.value})}
                          className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 resize-none h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Comment</label>
                        <textarea
                          value={editForm.comment || ''}
                          onChange={e => setEditForm({...editForm, comment: e.target.value})}
                          className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 resize-none h-12"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => setAddingToPhase(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 transition-colors">
                          <X className="w-5 h-5" />
                        </button>
                        <button onClick={() => saveNewTask(phase.id)} className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-2">
                          <Plus className="w-4 h-4" /> Ajouter
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => startAddTask(phase.id)}
                      className="w-full mt-4 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 text-slate-400 hover:text-indigo-500 hover:border-indigo-200 hover:bg-indigo-50/50 rounded-2xl font-bold transition-all"
                    >
                      <Plus className="w-4 h-4" /> Ajouter une tâche à cette phase
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

