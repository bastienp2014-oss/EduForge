import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProgression } from "../store/useProgression";
import { useTheme } from "../store/useTheme";
import { useCurrency } from '../hooks/useCurrency';
import {
  Play, Info, Lock, Map, ShoppingBag, BookA, Tent,
  MessageCircle, Zap, Users, Trophy, Settings, MapPin, Star
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ModalInstructions, { GameType } from "./ModalInstructions";
import NicknameEditor from "../features/progression/NicknameEditor";

function DraggableItem({ id, children, className }: { id: string, children: import('react').ReactNode, className?: string }) {
  const uiPositions = useProgression((state) => state.uiPositions);
  const setUIPosition = useProgression((state) => state.setUIPosition);
  const pos = uiPositions?.[id] || { x: 0, y: 0, scale: 1 };
  const [isHovered, setIsHovered] = useState(false);

  const handleScale = (delta: number) => {
    const newScale = Math.max(0.3, Math.min(4, (pos.scale || 1) + delta));
    setUIPosition(id, { ...pos, scale: newScale });
  };

  return (
    <motion.div
      className={`relative w-fit cursor-move touch-none group ${className || ''}`}
      drag
      dragMomentum={false}
      animate={{ x: pos.x, y: pos.y, scale: pos.scale || 1 }}
      onDragEnd={(e, info) => {
        setUIPosition(id, { ...pos, x: pos.x + info.offset.x, y: pos.y + info.offset.y });
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ transformOrigin: 'top left' }}
    >
      {children}
      {isHovered && (
        <div className="absolute -top-6 left-0 flex gap-1 bg-black/60 rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto shadow-sm z-50">
          <button onClick={(e) => { e.stopPropagation(); handleScale(-0.1); }} className="text-white text-xs px-2 hover:bg-white/20 rounded font-mono">-</button>
          <button onClick={(e) => { e.stopPropagation(); handleScale(0.1); }} className="text-white text-xs px-2 hover:bg-white/20 rounded font-mono">+</button>
        </div>
      )}
    </motion.div>
  );
}

// Composant pour la ligne de temps verticale
function VerticalTimeline({ niveaux, currentLevelId, theme, format, xp }: { niveaux: any[], currentLevelId: number, theme: any, format: any, xp: number }) {
  const reversedNiveaux = [...niveaux].reverse();
  
  return (
    <div className="flex flex-col items-center py-10 relative">
      <h3 className="font-black text-xl mb-12 tracking-tight text-center" style={{ color: theme.colors.text }}>
        Le Chemin de l'Ambassadeur
      </h3>
      
      {reversedNiveaux.map((niveau, index) => {
        const isCurrent = niveau.id === currentLevelId;
        const currentNiveauRef = niveaux.find(n => n.id === currentLevelId);
        const isUnlocked = niveau.seuilScore <= xp;
        const isLast = index === reversedNiveaux.length - 1;
        
        return (
          <div key={niveau.id} className="relative flex flex-col items-center w-full min-h-[100px]">
            {index !== 0 && (
              <div 
                className="absolute top-[-60px] w-3 h-[60px] z-0 rounded-full"
                style={{ 
                  backgroundColor: isUnlocked ? theme.colors.primary : `${theme.colors.border}`,
                  opacity: isUnlocked ? 1 : 0.4
                }} 
              />
            )}
            
            <div className="relative z-10 flex flex-col items-center">
              {isCurrent && (
                <div className="absolute -top-5 bg-pink-500 text-white text-[10px] font-black px-3 py-1 rounded-full z-20 shadow-md">
                  Actuel
                </div>
              )}
              
              <div 
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg border-4 transition-transform ${isCurrent ? 'scale-110' : ''}`}
                style={{
                  backgroundColor: isUnlocked ? theme.colors.surface : theme.colors.background,
                  borderColor: isCurrent ? theme.colors.primary : (isUnlocked ? theme.colors.success : theme.colors.border),
                  opacity: isUnlocked ? 1 : 0.6
                }}
              >
                <span className="text-3xl opacity-80" style={{ filter: isUnlocked ? 'none' : 'grayscale(100%)' }}>
                  {niveau.id === 1 ? '✈️' : niveau.id === 2 ? '☕' : niveau.id === 3 ? '🛍️' : niveau.id === 4 ? '🔨' : niveau.id === 5 ? '🍁' : niveau.id === 6 ? '🤔' : niveau.id === 7 ? '🤬' : '⚜️'}
                </span>
              </div>
              
              <span 
                className="mt-3 font-black text-sm"
                style={{ color: isUnlocked ? theme.colors.text : theme.colors.textMuted }}
              >
                {niveau.nom}
              </span>
            </div>
            
            {!isLast && <div className="h-14" />}
          </div>
        );
      })}
    </div>
  );
}

export default function HomeScreen() {
  const navigate = useNavigate();
  const piasses = useProgression((state) => state.piasses);
  const xp = useProgression((state) => state.xp);
  const streakCount = useProgression((state) => state.streakCount);
  const longestStreak = useProgression((state) => state.longestStreak);
  const isPremium = useProgression((state) => state.isPremium);
  const isAdmin = useProgression((state) => state.isAdmin);
  const progressionConfig = useProgression((state) => state.progressionConfig);
  const getNiveau = useProgression((state) => state.getNiveau);
  const getFeatureFlags = useProgression((state) => state.getFeatureFlags);
  const uiPositions = useProgression((state) => state.uiPositions);
  const setUIPosition = useProgression((state) => state.setUIPosition);
  const leconsCompletes = useProgression((state) => state.leconsCompletes);
  const completerLecon = useProgression((state) => state.completerLecon);
  const addXp = useProgression((state) => state.addXp);
  const addPiasses = useProgression((state) => state.addPiasses);
  const { theme, setThemeById } = useTheme();
  const { format } = useCurrency();
  const [instructionsGame, setInstructionsGame] = useState<GameType | null>(null);
  const [activeTheoryLesson, setActiveTheoryLesson] = useState<any>(null);
  const flags = getFeatureFlags();

  const currentLevelId = getNiveau();
  const currentNiveauObj = progressionConfig.niveaux.find(n => n.id === currentLevelId) || progressionConfig.niveaux[0];
  const nextNiveauObj = progressionConfig.niveaux.find(n => n.id === currentLevelId + 1) || null;

  const progressPercent = nextNiveauObj
    ? ((xp - currentNiveauObj.seuilScore) / (nextNiveauObj.seuilScore - currentNiveauObj.seuilScore)) * 100
    : 100;

  const PALIERS_CELEBRATION = [3, 7, 14, 30, 100];
  const [celebrationStreak, setCelebrationStreak] = useState<number | null>(null);

  useEffect(() => {
    if (PALIERS_CELEBRATION.includes(streakCount)) {
      setCelebrationStreak(streakCount);
    }
  }, [streakCount]);
  
  const messagesCelebration: Record<number, { titre: string; message: string }> = {
    3:   { titre: '3 jours de suite ! 🔥', message: 'T\'es en feu ! Continue de même, câline !' },
    7:   { titre: 'Une semaine complète ! 🏆', message: 'Une semaine de suite ? T\'es sérieux, toi. Respect !' },
    14:  { titre: '2 semaines non-stop ! ⚜️', message: 'Deux semaines ! T\'es plus un immigrant, t\'es un Québécois en devenir.' },
    30:  { titre: 'Un mois entier ! 👑', message: 'Un mois de suite. Ostie que t\'es persévérant. Le Québec est chanceux de t\'avoir.' },
    100: { titre: '100 jours ! 🌟', message: '100 jours. Tu es officiellement plus assidu que la plupart des natifs. Chapeau !' },
  };

  return (
      <div className="flex flex-col min-h-screen pb-12 font-sans transition-colors duration-300" style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}>
        <div className="p-4 sm:p-6 space-y-8 max-w-md mx-auto w-full relative">
          {isAdmin && (
            <button onClick={() => navigate('/admin')} className="absolute top-0 right-4 p-2 opacity-50 hover:opacity-100 transition-opacity">
              <Lock className="w-4 h-4" />
            </button>
          )}

          <NicknameEditor />

          {/* BANNER */}
          <div className="rounded-3xl overflow-hidden relative shadow-md min-h-[160px] flex items-center bg-slate-900">
            {/* Image de fond avec un léger zoom (scale-110) pour couper les marges latérales si l'image uploadée en contient */}
            <div className="absolute inset-0 bg-cover bg-right scale-110 origin-center" style={{ backgroundImage: theme.images?.homeBanner ? `url(${theme.images.homeBanner})` : 'none', backgroundColor: theme.colors.header }} />
            
            <div className="relative z-10 py-5 px-4 sm:p-6 flex flex-col justify-center w-full max-w-[65%]">
              <DraggableItem id="homeBannerText_title">
                <h2 className="text-lg sm:text-xl font-bold mb-1 text-white leading-tight drop-shadow-md">Prêt pour aujourd'hui?</h2>
              </DraggableItem>
              <DraggableItem id="homeBannerText_subtitle">
                <p className="text-xs sm:text-sm text-white/95 mb-3 leading-snug drop-shadow-md font-medium">Votre parcours culturel vous attend.</p>
              </DraggableItem>
              <DraggableItem id="homeBannerText_button">
                <button onClick={() => navigate('/srs')} className="w-fit px-4 py-2 rounded-full font-bold shadow-md transition-transform active:scale-[0.98] text-xs pointer-events-auto" style={{ backgroundColor: theme.colors.primary, color: '#fff' }}>
                  Lancer ma journée
                </button>
              </DraggableItem>
            </div>
          </div>

          {/* APPRENDRE GRID REPLACED WITH NEW TIMELINE LAYOUT */}
          {/* HEADER TITRE */}
          <div className="text-center mt-2 mb-4">
            <h1 className="text-2xl font-black mb-1 flex items-center justify-center gap-2" style={{ color: theme.colors.text }}>
              <span className="text-blue-600">⚜️</span> Mots & Blocs
            </h1>
            <p className="text-sm px-4 font-medium" style={{ color: theme.colors.textMuted }}>
              Le vocabulaire essentiel pour travailler, s'installer et réussir au Québec.
            </p>
          </div>

          {/* LEVEL SUMMARY CARD */}
          <div className="rounded-3xl p-5 shadow-sm border" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <div className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: theme.colors.textMuted }}>Niveau Actuel</div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🤔</span>
                <span className="font-black text-lg leading-tight max-w-[120px]" style={{ color: theme.colors.text }}>{currentNiveauObj.nom}</span>
              </div>
              <div className="px-3 py-1.5 rounded-2xl font-bold flex items-center gap-1.5" style={{ backgroundColor: `${theme.colors.primary}15`, color: theme.colors.primary }}>
                <span className="text-[10px]">⚜️</span> {format(piasses)} $
              </div>
            </div>
            {nextNiveauObj && (
              <div className="text-xs font-bold" style={{ color: theme.colors.textMuted }}>
                {format(xp)} $ / {format(nextNiveauObj.seuilScore)} $ pour {nextNiveauObj.nom}
              </div>
            )}
          </div>

          {/* BANNER REVISIONS */}
          <div className="rounded-3xl overflow-hidden relative shadow-md min-h-[160px] flex items-center bg-blue-600" style={{ backgroundColor: theme.colors.primary }}>
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-white opacity-10 rotate-12 translate-x-8 scale-150 transform origin-left" />
            
            <div className="relative z-10 py-5 px-5 flex flex-col justify-center w-full max-w-[70%]">
              <div className="text-[10px] font-black uppercase tracking-wider text-blue-100 mb-1">Routine Quotidienne</div>
              <h2 className="text-xl font-black mb-2 text-white leading-tight drop-shadow-md">Prêt pour tes<br/>révisions ?</h2>
              <p className="text-xs text-blue-50 mb-4 font-medium leading-relaxed drop-shadow-md">
                15 mots à consolider aujourd'hui pour garder le rythme.
              </p>
              <button onClick={() => navigate('/srs')} className="w-fit px-5 py-2.5 rounded-xl font-black shadow-md transition-transform active:scale-[0.98] text-sm flex items-center gap-2 bg-white" style={{ color: theme.colors.primary }}>
                <Play className="w-4 h-4 fill-current" />
                Lancer ma journée
              </button>
            </div>
          </div>

          {/* VERTICAL TIMELINE */}
          <div className="rounded-[40px] shadow-sm border overflow-hidden mb-6 mt-4" style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border }}>
             <VerticalTimeline niveaux={progressionConfig.niveaux} currentLevelId={currentLevelId} theme={theme} format={format} xp={xp} />
          </div>

          {/* CUSTOM JOURNEY CHAPITRES & LEÇONS */}
          <section className="space-y-3 mb-6 mt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-[11px] uppercase tracking-wider ml-2 animate-pulse" style={{ color: theme.colors.textMuted }}>Mon Parcours d'Apprentissage</h3>
              <span className="text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-md">Niveau {currentLevelId}</span>
            </div>
            
            {!currentNiveauObj.chapitres || currentNiveauObj.chapitres.length === 0 ? (
              <div className="rounded-3xl p-6 text-center border border-dashed" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
                <div className="text-3xl mb-2">🗺️</div>
                <h4 className="font-bold text-sm mb-1" style={{ color: theme.colors.text }}>Aucun parcours pour l'instant</h4>
                <p className="text-xs leading-relaxed" style={{ color: theme.colors.textMuted }}>
                  Ajoutez des chapitres et des leçons via l'onglet <strong>Parcours</strong> du menu Administration.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentNiveauObj.chapitres.map((chap, cIndex) => (
                  <div key={chap.id} className="rounded-3xl border p-4 shadow-sm" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
                    <div className="mb-3">
                      <div className="text-[10px] font-black tracking-wider uppercase text-blue-500" style={{ color: theme.colors.primary }}>Chapitre {cIndex + 1}</div>
                      <h4 className="font-black text-base" style={{ color: theme.colors.text }}>{chap.nom}</h4>
                      {chap.description && <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>{chap.description}</p>}
                    </div>
                    
                    <div className="space-y-2 border-t pt-3" style={{ borderColor: theme.colors.border }}>
                      {chap.lecons.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-2">Aucune leçon dans ce chapitre.</p>
                      ) : (
                        chap.lecons.map((lecon) => {
                          const isCompleted = leconsCompletes?.[lecon.id];
                          return (
                            <div key={lecon.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                              <div className="flex items-center gap-2.5">
                                <span className="text-base">{lecon.type === 'theorie' ? '📖' : '🎮'}</span>
                                <div className="text-left">
                                  <div className="font-bold text-xs" style={{ color: theme.colors.text }}>{lecon.nom}</div>
                                  <div className="text-[10px]" style={{ color: theme.colors.textMuted }}>
                                    {lecon.type === 'theorie' ? 'Contenu Théorique' : `${lecon.mechanic || 'Jeu'} (${lecon.tags?.join(', ')})`}
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                {isCompleted ? (
                                  <span className="text-xs font-black text-emerald-500 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-lg">
                                    ✓ Fait
                                  </span>
                                ) : (
                                  <button 
                                    onClick={() => {
                                      if (lecon.type === 'theorie') {
                                        setActiveTheoryLesson(lecon);
                                      } else {
                                        navigate(`/lesson/${lecon.id}`);
                                      }
                                    }}
                                    className="px-3 py-1 rounded-lg font-black text-xs text-white" 
                                    style={{ backgroundColor: theme.colors.primary }}
                                  >
                                    Lancer
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* LEÇONS & GRAMMAIRE GRID */}
          <section>
            <h3 className="font-black text-[11px] uppercase tracking-wider mb-3 ml-2" style={{ color: theme.colors.textMuted }}>Leçons & Grammaire</h3>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => navigate('/blocs')} className="p-4 rounded-2xl shadow-sm text-left flex items-center justify-between border active:scale-[0.98] transition-all bg-slate-900 border-slate-800" style={{ backgroundColor: theme.colors.ink, borderColor: theme.colors.ink }}>
                <div className="flex items-center gap-3">
                  <Play className="w-5 h-5 text-white fill-white" />
                  <span className="font-bold text-white">Blocs Québec</span>
                </div>
                <div onClick={(e) => { e.stopPropagation(); setInstructionsGame('blocs'); }} className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20">
                  <Info className="w-4 h-4" />
                </div>
              </button>
              
              <button onClick={() => navigate('/quiz')} className="p-4 rounded-2xl shadow-sm text-left flex items-center justify-between border active:scale-[0.98] transition-all bg-white border-slate-200" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">📋</span>
                  <span className="font-bold" style={{ color: theme.colors.text }}>Mots du Québec</span>
                </div>
                <div onClick={(e) => { e.stopPropagation(); setInstructionsGame('quiz'); }} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200" style={{ backgroundColor: theme.colors.background, color: theme.colors.textMuted }}>
                  <Info className="w-4 h-4" />
                </div>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-3">
              <button onClick={() => flags.feature_advanced_grammar ? navigate('/tuinterrogatif') : navigate('/paywall')} className="p-4 rounded-2xl shadow-sm text-center border active:scale-[0.98] transition-all flex flex-col items-center justify-center min-h-[90px]" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
                <span className="text-xl mb-1">🤔</span>
                <span className="font-bold text-xs" style={{ color: theme.colors.text }}>"Tu" Interrogatif</span>
              </button>
              <button onClick={() => flags.feature_advanced_grammar ? navigate('/contractions') : navigate('/paywall')} className="p-4 rounded-2xl shadow-sm text-center border active:scale-[0.98] transition-all flex flex-col items-center justify-center min-h-[90px]" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
                <span className="text-xl mb-1 text-amber-500">⚡</span>
                <span className="font-bold text-xs" style={{ color: theme.colors.text }}>Contractions</span>
              </button>
            </div>

            <button onClick={() => flags.feature_advanced_grammar ? navigate('/tutoiement') : navigate('/paywall')} className="mt-3 p-4 rounded-2xl shadow-sm text-center border active:scale-[0.98] transition-all w-full flex items-center justify-center gap-2" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
                <span className="text-xl">🤝</span>
                <span className="font-bold text-sm" style={{ color: theme.colors.text }}>Culture du Vouvoiement</span>
            </button>
          </section>

          {/* PREMIUM UPSELL */}
          {!isPremium && (
            <section>
              <div className="rounded-3xl p-6 shadow-md relative overflow-hidden text-left border" style={{ background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.primaryHover})`, borderColor: theme.colors.border }}>
                <div className="absolute -right-4 -top-8 opacity-10 text-white pointer-events-none">
                  <Star size={160} />
                </div>
                <h3 className="font-black text-white text-lg flex items-center gap-2 mb-2 relative z-10">
                  <Star className="w-5 h-5 fill-current" /> Passeport Premium
                </h3>
                <p className="text-white/90 text-sm font-medium mb-5 relative z-10 w-[85%] leading-relaxed">
                  Débloquez les niveaux avancés (Travailler & Culture) et supprimez toutes les limites d'énergie.
                </p>
                <button onClick={() => navigate('/paywall')} className="w-full bg-white text-slate-900 font-black py-3 rounded-xl shadow-sm transition-transform active:scale-[0.98]">
                  Devenir Premium (Mock)
                </button>
              </div>
            </section>
          )}

          {/* EXTRAS */}
          <section>
            <h3 className="font-black text-xl mb-4 tracking-tight" style={{ color: theme.colors.text }}>Extras</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button onClick={() => flags.feature_dictionnaire ? navigate('/dictionnaire') : navigate('/paywall')} className={`p-4 rounded-3xl shadow-sm flex items-center justify-center gap-3 transition-transform active:scale-95 border ${!flags.feature_dictionnaire ? 'opacity-70 grayscale' : ''}`} style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }}>
                <BookA className="w-5 h-5" style={{ color: theme.colors.primary }} />
                <span className="font-bold text-sm">Dico</span>
                {!flags.feature_dictionnaire && <Lock className="w-3.5 h-3.5 text-amber-500" />}
              </button>
              
              <button onClick={() => navigate('/portefeuille')} className="p-4 rounded-3xl shadow-sm flex items-center justify-center gap-3 transition-transform active:scale-95 border" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }}>
                <span className="text-xl leading-none">💵</span>
                <span className="font-bold text-sm">Portefeuille</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => flags.feature_classement ? navigate('/leaderboard') : navigate('/paywall')} className={`p-4 rounded-3xl shadow-sm flex items-center justify-center gap-3 transition-transform active:scale-95 border ${!flags.feature_classement ? 'opacity-70 grayscale' : ''}`} style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }}>
                <Trophy className="w-5 h-5" style={{ color: theme.colors.accent }} />
                <span className="font-bold text-sm">Légendes</span>
                {!flags.feature_classement && <Lock className="w-3.5 h-3.5 text-amber-500" />}
              </button>
              
              <button onClick={() => navigate('/devplan')} className="p-4 rounded-3xl shadow-sm flex items-center justify-center gap-3 transition-transform active:scale-95 border" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }}>
                <Map className="w-5 h-5 opacity-60" />
                <span className="font-bold text-sm">Roadmap</span>
              </button>
            </div>
          </section>

        </div>

        {/* Modal Instructions */}
        <AnimatePresence>
          {instructionsGame && <ModalInstructions game={instructionsGame} onClose={() => setInstructionsGame(null)} />}
        </AnimatePresence>

        {/* Theory Lesson Modal */}
        {activeTheoryLesson && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col max-h-[85vh] text-slate-800" style={{ color: '#1e293b' }}>
              <h2 className="text-xl font-black text-slate-900 mb-2">{activeTheoryLesson.nom}</h2>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1">
                <span>📖 Leçon Théorique</span>
                <span>•</span>
                <span>{activeTheoryLesson.tags?.join(', ')}</span>
              </div>
              <div className="flex-1 overflow-y-auto mb-6 pr-2 prose prose-slate text-sm leading-relaxed text-slate-700">
                <p className="whitespace-pre-line">{activeTheoryLesson.theorieContent || "Aucun contenu théorique n'a été rédigé pour cette leçon. Cliquez sur terminer pour valider l'étape."}</p>
              </div>
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button 
                  onClick={() => setActiveTheoryLesson(null)} 
                  className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Fermer
                </button>
                <button 
                  onClick={() => {
                    completerLecon(activeTheoryLesson.id);
                    addXp(15);
                    addPiasses(5);
                    setActiveTheoryLesson(null);
                    alert(`Bravo ! Leçon terminée !\n+15 XP et +5 $`);
                  }}
                  className="flex-1 py-3 text-white font-black rounded-xl shadow-md transition-transform active:scale-95 text-center" 
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  Terminer la leçon
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Celebration Modal */}
        {celebrationStreak && messagesCelebration[celebrationStreak] && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={() => setCelebrationStreak(null)}>
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="text-6xl mb-4 animate-bounce">🔥</div>
              <h2 className="text-2xl font-black text-slate-900 mb-3">{messagesCelebration[celebrationStreak].titre}</h2>
              <p className="text-slate-600 mb-6 leading-relaxed font-medium">{messagesCelebration[celebrationStreak].message}</p>
              <button onClick={() => setCelebrationStreak(null)} className="w-full py-3.5 rounded-xl text-white font-black shadow-md transition-transform active:scale-95 text-base" style={{ backgroundColor: theme.colors.primary }}>
                Merci, je continue ! 💪
              </button>
            </div>
          </div>
        )}
      </div>
  );
}
