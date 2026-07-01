import React, { useState, useEffect, useCallback } from 'react';
import { useProgression } from '../../store/useProgression';
import { useTheme } from '../../store/useTheme';
import { ArrowLeft, RefreshCcw, Sparkles, HelpCircle, X, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import GameHUD from '../../components/GameHUD';
import GameResult from '../../components/GameResult';

import { getTileColors, getTileTextColor } from '../../utils/tileColors';

const generateId = () => Math.random().toString(36).substring(2, 9);

type Tile = {
  id: string;
  value: string;
  isNew?: boolean;
  isMerged?: boolean;
  justMerged?: boolean;
  isCompleteWord?: boolean;
};

type Board = (Tile | null)[][];

type WordDef = { text: string; parts: string[] };
type LevelDef = {
  label: string;
  targetCount: number;
  words: WordDef[];
};

const LEVELS: LevelDef[] = [
  { 
    label: "Niveau 1: Le Débutant", targetCount: 4,
    words: [
      { text: "TUQUE", parts: ["TU", "QUE"] },
      { text: "JASER", parts: ["JA", "SER"] }
    ]
  },
  { 
    label: "Niveau 2: L'Étudiant", targetCount: 6,
    words: [
      { text: "FRETTE", parts: ["FRET", "TE"] },
      { text: "CÉGEP", parts: ["CÉ", "GEP"] },
      { text: "CHIALER", parts: ["CHIA", "LER"] }
    ]
  },
  { 
    label: "Niveau 3: Le Bûcheron", targetCount: 6,
    words: [
      { text: "CABANE", parts: ["CA", "BA", "NE"] },
      { text: "POUTINE", parts: ["POU", "TI", "NE"] }
    ]
  },
  { 
    label: "Niveau 4: Le Résident", targetCount: 8,
    words: [
      { text: "CARIBOU", parts: ["CA", "RI", "BOU"] },
      { text: "TABARNAK", parts: ["TA", "BAR", "NAK"] },
      { text: "DÉPANNEUR", parts: ["DÉ", "PAN", "NEUR"] }
    ]
  },
  { 
    label: "Niveau 5: L'Habitué", targetCount: 6,
    words: [
      { text: "MAGASINER", parts: ["MA", "GA", "SI", "NER"] },
      { text: "ACHALANDÉ", parts: ["A", "CHA", "LAN", "DÉ"] }
    ]
  },
  { 
    label: "Niveau 6: L'Expert", targetCount: 8,
    words: [
      { text: "ÉPOUVANTAIL", parts: ["É", "POU", "VAN", "TAIL"] },
      { text: "DÉPANNEUSE", parts: ["DÉ", "PAN", "NEU", "SE"] }
    ]
  },
  { 
    label: "Niveau 7: Le Québécois Pur", targetCount: 6,
    words: [
      { text: "INCONTOURNABLE", parts: ["IN", "CON", "TOUR", "NA", "BLE"] },
      { text: "EXTRAORDINAIRE", parts: ["EX", "TRA", "OR", "DI", "NAIRE"] }
    ]
  }
];

function attemptMerge(val1: string, val2: string, levelWords: string[]): string | null {
  const sum = val1 + val2;
  if (levelWords.some(w => w.includes(sum))) return sum;
  if (val1 === val2) return val1; // Fusionner deux syllabes identiques pour libérer de l'espace
  return null;
}

function slideRowLeft(row: (Tile | null)[], levelWords: string[]) {
  let tiles = row.filter(t => t !== null) as Tile[];
  let anyComplete = false;
  let scoreDelta = 0;
  let completedWords: string[] = [];

  for (let k = 0; k < tiles.length - 1; k++) {
    if (tiles[k].justMerged) continue;
    const mergedValue = attemptMerge(tiles[k].value, tiles[k+1].value, levelWords);
    if (mergedValue) {
       tiles[k] = { id: tiles[k].id, value: mergedValue, isMerged: true, justMerged: true };
       if (levelWords.includes(mergedValue)) {
          tiles[k].isCompleteWord = true;
          anyComplete = true;
          scoreDelta += mergedValue.length * 10;
          completedWords.push(mergedValue);
       } else {
          scoreDelta += 5;
       }
       tiles.splice(k+1, 1);
    }
  }
  tiles.forEach(t => t.justMerged = false);
  while (tiles.length < 4) tiles.push(null);
  return { row: tiles, anyComplete, scoreDelta, completedWords };
}

function slideRowRight(row: (Tile | null)[], levelWords: string[]) {
  let tiles = row.filter(t => t !== null) as Tile[];
  let anyComplete = false;
  let scoreDelta = 0;
  let completedWords: string[] = [];

  for (let k = tiles.length - 1; k > 0; k--) {
     if (tiles[k].justMerged) continue;
     const mergedValue = attemptMerge(tiles[k-1].value, tiles[k].value, levelWords);
     if (mergedValue) {
        tiles[k] = { id: tiles[k].id, value: mergedValue, isMerged: true, justMerged: true };
        tiles.splice(k-1, 1);
        if (levelWords.includes(mergedValue)) {
           tiles[k-1].isCompleteWord = true;
           anyComplete = true;
           scoreDelta += mergedValue.length * 10;
           completedWords.push(mergedValue);
        } else {
           scoreDelta += 5;
        }
     }
  }
  tiles.forEach(t => t.justMerged = false);
  while (tiles.length < 4) tiles.unshift(null);
  return { row: tiles, anyComplete, scoreDelta, completedWords };
}

function slide(board: Board, direction: "LEFT"|"RIGHT"|"UP"|"DOWN", levelWords: string[]) {
  let newBoard: Board = [
    [null,null,null,null],
    [null,null,null,null],
    [null,null,null,null],
    [null,null,null,null]
  ];
  let changed = false;
  let scoreDelta = 0;
  let anyComplete = false;
  let completedWords: string[] = [];

  if (direction === "LEFT" || direction === "RIGHT") {
    for (let r = 0; r < 4; r++) {
      const row = board[r];
      const res = direction === "LEFT" ? slideRowLeft(row, levelWords) : slideRowRight(row, levelWords);
      newBoard[r] = res.row;
      scoreDelta += res.scoreDelta;
      if (res.anyComplete) anyComplete = true;
      res.completedWords?.forEach(w => completedWords.push(w));
      
      for (let c = 0; c < 4; c++) {
         if (board[r][c]?.value !== newBoard[r][c]?.value) changed = true;
      }
    }
  } else {
    for (let c = 0; c < 4; c++) {
      const col = [board[0][c], board[1][c], board[2][c], board[3][c]];
      const res = direction === "UP" ? slideRowLeft(col, levelWords) : slideRowRight(col, levelWords);
      for (let r = 0; r < 4; r++) {
        newBoard[r][c] = res.row[r];
        if (board[r][c]?.value !== newBoard[r][c]?.value) changed = true;
      }
      scoreDelta += res.scoreDelta;
      if (res.anyComplete) anyComplete = true;
      res.completedWords?.forEach(w => completedWords.push(w));
    }
  }

  return { newBoard, changed, scoreDelta, anyComplete, completedWords };
}

function spawnTile(board: Board, components: string[]): Board {
  const emptySpots: {r: number, c: number}[] = [];
  board.forEach((row, r) => {
    row.forEach((cell, c) => {
       if (!cell && !board[r][c]?.isCompleteWord) emptySpots.push({r, c});
    });
  });
  
  if (emptySpots.length === 0) return board;
  
  const spot = emptySpots[Math.floor(Math.random() * emptySpots.length)];
  const val = components[Math.floor(Math.random() * components.length)];
  
  const newBoard = [...board];
  newBoard[spot.r] = [...newBoard[spot.r]];
  newBoard[spot.r][spot.c] = { id: generateId(), value: val, isNew: true };
  return newBoard;
}

function checkIsGameOver(board: Board, levelWords: string[]): boolean {
  for (let r=0; r<4; r++) {
    for (let c=0; c<4; c++) {
      if (!board[r][c] || board[r][c]?.isCompleteWord) return false;
    }
  }
  for (let r=0; r<4; r++) {
    for (let c=0; c<4; c++) {
      const v = board[r][c]!.value;
      if (c < 3 && attemptMerge(v, board[r][c+1]!.value, levelWords)) return false; 
      if (r < 3 && attemptMerge(v, board[r+1][c]!.value, levelWords)) return false; 
    }
  }
  return true;
}

export default function Game2048Screen({ onBack }: { onBack: () => void }) {
  const [board, setBoard] = useState<Board>([]);
  const [levelIdx, setLevelIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [progress, setProgress] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTitle, setSuccessTitle] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { addPiasses, getPointsConfig } = useProgression();
  const { theme } = useTheme();
  const tileColorsConfig = React.useMemo(() => getTileColors(theme.colors.primary), [theme.colors.primary]);

  const getTileStyle = React.useCallback((val: string) => {
    const hash = Array.from(val).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const bgColor = tileColorsConfig[hash % tileColorsConfig.length];
    const textColor = getTileTextColor(bgColor, theme.colors.ink);
    return { backgroundColor: bgColor, color: textColor };
  }, [tileColorsConfig, theme.colors.ink]);

  useEffect(() => {
    const hasSeenHelp = localStorage.getItem('2048_help_seen');
    if (!hasSeenHelp) {
      setShowHelp(true);
      localStorage.setItem('2048_help_seen', 'true');
    }
  }, []);

  const currentLevel = LEVELS[Math.min(levelIdx, LEVELS.length - 1)];
  const components = currentLevel.words.flatMap(w => w.parts);
  const wordsStr = currentLevel.words.map(w => w.text);

  const resetGame = useCallback((idx: number) => {
    let b: Board = Array(4).fill(null).map(() => Array(4).fill(null));
    const comp = LEVELS[idx].words.flatMap(w => w.parts);
    b = spawnTile(b, comp);
    b = spawnTile(b, comp);
    setBoard(b);
    setLevelIdx(idx);
    setProgress(0);
    setScore(0);
    setGameOver(false);
    setShowSuccess(false);
    setIsLocked(false);
    if (idx === 0) {
      useProgression.getState().incrementStat('2048_played', 1);
    }
  }, []);

  useEffect(() => {
    resetGame(0);
  }, [resetGame]);

  useEffect(() => {
    if (showSuccess) {
       const t = setTimeout(() => {
          if (levelIdx < LEVELS.length - 1) {
             resetGame(levelIdx + 1);
          } else {
             setSuccessTitle("Vous êtes le maître du vocabulaire !");
          }
       }, 2500);
       return () => clearTimeout(t);
    }
  }, [showSuccess, levelIdx, resetGame]);

  const handleSwipe = useCallback((direction: "LEFT"|"RIGHT"|"UP"|"DOWN") => {
    if (gameOver || showSuccess || isLocked) return;

    const result = slide(board, direction, wordsStr);

    if (result.changed) {
      setScore(s => s + result.scoreDelta);
      
      if (result.anyComplete) {
         setIsLocked(true);
         let b = result.newBoard;
         setBoard(b);
         
         setTimeout(() => {
           setBoard(currBoard => {
              let popped = currBoard.map(row => row.map(t => t?.isCompleteWord ? null : t));
              popped = spawnTile(popped, components); 
              
              if (checkIsGameOver(popped, wordsStr)) {
                  setGameOver(true);
              }
              return popped;
           });
           
           addPiasses(getPointsConfig().game2048Correct * result.completedWords.length);
           
           setProgress(p => {
              const np = p + result.completedWords.length;
              if (np >= currentLevel.targetCount) {
                 setSuccessTitle(`Niveau ${levelIdx+1} Complété!`);
                 setShowSuccess(true);
              } else {
                 setIsLocked(false);
              }
              return np;
           });
         }, 500);

      } else {
         let b = result.newBoard;
         b = spawnTile(b, components);
         setBoard(b);
         if (checkIsGameOver(b, wordsStr)) {
            setGameOver(true);
         }
      }
    }
  }, [board, levelIdx, gameOver, showSuccess, isLocked, wordsStr, components, currentLevel.targetCount, addPiasses, getPointsConfig]);

  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const x = e.changedTouches[0].clientX;
    const y = e.changedTouches[0].clientY;
    const dx = x - touchStart.x;
    const dy = y - touchStart.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 30) handleSwipe(dx > 0 ? "RIGHT" : "LEFT");
    } else {
      if (Math.abs(dy) > 30) handleSwipe(dy > 0 ? "DOWN" : "UP");
    }
    setTouchStart(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      switch(e.key) {
        case 'ArrowUp': handleSwipe('UP'); break;
        case 'ArrowDown': handleSwipe('DOWN'); break;
        case 'ArrowLeft': handleSwipe('LEFT'); break;
        case 'ArrowRight': handleSwipe('RIGHT'); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSwipe]);

  if (board.length === 0) return null;

  if (gameOver && !showSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center pt-8 pb-12 w-full h-full" style={{ background: theme.colors.bg }}>
        <GameResult
           state="lose"
           title="Bloqué !"
           subtitle="La grille est pleine."
           points={score}
           onReplay={() => resetGame(levelIdx)}
           onBack={onBack}
        />
      </div>
    );
  }

  if (showSuccess && levelIdx >= LEVELS.length - 1) {
    return (
      <div className="min-h-screen flex flex-col items-center pt-8 pb-12 w-full h-full" style={{ background: theme.colors.bg }}>
        <GameResult
           state="win"
           title={successTitle}
           points={score}
           onReplay={() => resetGame(0)}
           onBack={onBack}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center pb-12 overflow-y-auto w-full h-full" style={{ background: theme.colors.bg }}>
      <div className="w-full max-w-[400px]">
        <GameHUD
          title="2048 Mots"
          onBack={onBack}
          extra={
            <div className="flex gap-2">
              <button onClick={() => setShowHelp(true)} className="p-2 text-white bg-white/20 rounded-full">
                <HelpCircle className="w-5 h-5" />
              </button>
              <div className="text-right">
                <div className="text-white/70 font-bold text-[10px] uppercase tracking-wider">Score</div>
                <div className="text-lg font-extrabold text-white leading-none">{score}</div>
              </div>
            </div>
          }
        />
      </div>

      <div className="w-full max-w-[350px] mb-4 p-4 mt-4 bg-white rounded-2xl shadow-sm border border-slate-100">
         <div className="flex justify-between items-center mb-3">
           <h2 className="font-bold text-slate-800 text-lg">{currentLevel.label}</h2>
           <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
              Objectif: {progress} / {currentLevel.targetCount}
           </span>
         </div>
         <div className="flex flex-wrap gap-2">
           {currentLevel.words.map(w => (
              <div key={w.text} className="flex border rounded-lg overflow-hidden shadow-sm" style={{ backgroundColor: theme.colors.surface, borderColor: 'var(--color-border)' }}>
                 {w.parts.map((p, i) => (
                    <span key={i} className="px-1.5 py-1 text-[10px] font-black tracking-widest border-r border-white/20 last:border-r-0 shadow-sm" style={getTileStyle(p)}>
                       {p}
                    </span>
                 ))}
                 <span className="px-2 py-1 flex items-center bg-white text-[11px] font-bold text-slate-600">
                    {w.text}
                 </span>
              </div>
           ))}
         </div>
      </div>

      <div 
        className="relative p-3 rounded-2xl w-[350px] aspect-square shadow-inner touch-none mx-auto"
        style={{ backgroundColor: `${theme.colors.ink}15` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="grid grid-cols-4 grid-rows-4 gap-3 w-full h-full absolute inset-0 p-3">
          {Array.from({length: 16}).map((_, i) => (
            <div key={i} className="rounded-xl w-full h-full" style={{ backgroundColor: `${theme.colors.ink}20` }} />
          ))}
        </div>
        
        <div className="grid grid-cols-4 grid-rows-4 gap-3 w-full h-full relative z-10">
           {board.map((row, rowIndex) => 
             row.map((tile, colIndex) => (
               <div key={`${rowIndex}-${colIndex}`} className="w-full h-full relative">
                 <AnimatePresence>
                   {tile && (
                     <motion.div
                       key={tile.id}
                       layoutId={tile.id}
                       initial={tile.isNew ? { scale: 0.2, opacity: 0 } : false}
                       animate={{ 
                         scale: tile.isCompleteWord ? [1, 1.1, 0] : 1, 
                         opacity: tile.isCompleteWord ? [1, 1, 0] : 1 
                       }}
                       exit={{ scale: 0.2, opacity: 0 }}
                       transition={{ 
                          type: tile.isCompleteWord ? "tween" : "spring", 
                          duration: tile.isCompleteWord ? 0.4 : undefined,
                          stiffness: 300, damping: 20 
                       }}
                       className={`absolute inset-0 flex items-center justify-center rounded-xl font-black text-xl shadow-sm
                         ${tile.isCompleteWord ? "bg-amber-400 border-4 border-amber-200 text-amber-900 z-50 shadow-lg" : "shadow-md"}
                       `}
                       style={!tile.isCompleteWord ? getTileStyle(tile.value) : undefined}
                     >
                       {tile.value}
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
             ))
           )}
        </div>

        <AnimatePresence>
          {showSuccess && levelIdx < LEVELS.length - 1 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-2xl"
            >
              <motion.div 
                initial={{ scale: 0.5, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="text-center"
              >
                <Sparkles className="w-16 h-16 text-amber-400 mx-auto mb-3 animate-pulse" />
                <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight leading-tight px-4">
                  {successTitle}
                </h2>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="w-full max-w-[350px] text-center font-medium mt-6 p-4 rounded-xl border" style={{ backgroundColor: theme.colors.surface, borderColor: 'var(--color-border)', color: theme.colors.muted }}>
         <p className="text-sm font-bold mb-1" style={{ color: theme.colors.ink }}>
           Fusionnez les syllabes dans le bon ordre !
         </p>
         <p className="text-xs mb-1">
           Les mots complets disparaissent et vous font gagner des points.
         </p>
         <p className="text-xs text-indigo-500 font-bold">
           Astuce : Fusionnez deux syllabes identiques pour libérer de l'espace !
         </p>
      </div>

      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="rounded-3xl w-full max-w-[400px] overflow-hidden shadow-2xl flex flex-col"
              style={{ backgroundColor: theme.colors.surface }}
            >
              <div className="p-6 flex justify-between items-center text-white relative" style={{ backgroundColor: theme.colors.primary }}>
                <h2 className="text-2xl font-black">Comment jouer ?</h2>
                <button onClick={() => setShowHelp(false)} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                
                <div className="flex gap-4 items-start">
                  <div className="p-3 rounded-2xl shrink-0" style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}>
                     <ChevronRight className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1" style={{ color: theme.colors.ink }}>Glissez pour bouger</h3>
                    <p className="text-sm leading-relaxed" style={{ color: theme.colors.muted }}>Faites glisser votre doigt (ou utilisez les flèches du clavier) pour envoyer toutes les syllabes dans une direction.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="p-3 rounded-2xl shrink-0" style={{ backgroundColor: `${theme.colors.success}20`, color: theme.colors.success }}>
                     <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1" style={{ color: theme.colors.ink }}>Formez les mots</h3>
                    <p className="text-sm leading-relaxed" style={{ color: theme.colors.muted }}>Réunissez les syllabes <b>dans l'ordre</b> (ex: <span className="font-bold text-red-500">TU</span> puis <span className="font-bold text-orange-500">QUE</span>) pour valider des mots et marquer des points.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="p-3 rounded-2xl shrink-0" style={{ backgroundColor: `${theme.colors.gold}20`, color: theme.colors.gold }}>
                     <RefreshCcw className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1" style={{ color: theme.colors.ink }}>Libérez de l'espace</h3>
                    <p className="text-sm leading-relaxed" style={{ color: theme.colors.muted }}>Deux syllabes idéntiques vous bloquent ? <b>Fusionnez-les !</b> <br/>(ex: <span className="font-bold text-red-500">TU</span> + <span className="font-bold text-red-500">TU</span> = <span className="font-bold text-red-500">TU</span>) <br/>Cela vous évitera de vous faire éliminer en remplissant la grille.</p>
                  </div>
                </div>

              </div>

              <div className="p-4 border-t" style={{ backgroundColor: theme.colors.surface, borderColor: 'var(--color-border)' }}>
                <button 
                  onClick={() => setShowHelp(false)}
                  className="w-full text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-transform"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  C'est compris !
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
