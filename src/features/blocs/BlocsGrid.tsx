import { useState } from 'react';
import { useProgression } from '../../store/useProgression';
import { Star, ArrowLeft, Info, X, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import GameHUD from '../../components/GameHUD';
import GameResult from '../../components/GameResult';
import { useTheme } from '../../store/useTheme';

const GRID_SIZE = 8;

type Point = { x: number; y: number };
type ShapeDef = { id: string; points: Point[]; color: string };

const SHAPES: ShapeDef[] = [
  { id: 'dot', points: [{x:0, y:0}], color: 'bg-blue-500' },
  { id: 'line_h2', points: [{x:0, y:0}, {x:1, y:0}], color: 'bg-emerald-500' },
  { id: 'line_v2', points: [{x:0, y:0}, {x:0, y:1}], color: 'bg-emerald-500' },
  { id: 'line_h3', points: [{x:0, y:0}, {x:1, y:0}, {x:2, y:0}], color: 'bg-purple-500' },
  { id: 'line_v3', points: [{x:0, y:0}, {x:0, y:1}, {x:0, y:2}], color: 'bg-purple-500' },
  { id: 'square_2x2', points: [{x:0, y:0}, {x:1, y:0}, {x:0, y:1}, {x:1, y:1}], color: 'bg-amber-500' },
  { id: 'L_shape', points: [{x:0, y:0}, {x:0, y:1}, {x:0, y:2}, {x:1, y:2}], color: 'bg-rose-500' },
];

function generateRandomShapes(count: number) {
  return Array.from({ length: count }).map(() => SHAPES[Math.floor(Math.random() * SHAPES.length)]);
}

export default function BlocsGrid({ onBack }: { onBack: () => void }) {
  const claimReward = useProgression(s => s.claimReward);
  const piasses = useProgression(s => s.piasses);
  const getPointsConfig = useProgression(s => s.getPointsConfig);
  const { theme } = useTheme();
  
  const [grid, setGrid] = useState<boolean[][]>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false))
  );
  
  const [availableShapes, setAvailableShapes] = useState<(ShapeDef | null)[]>(generateRandomShapes(3));
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const canPlaceShape = (shape: ShapeDef, startX: number, startY: number, currentGrid: boolean[][] = grid) => {
    for (const pt of shape.points) {
      const x = startX + pt.x;
      const y = startY + pt.y;
      if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE || currentGrid[y][x]) {
        return false;
      }
    }
    return true;
  };

  const checkGameOver = (currentGrid: boolean[][], shapes: (ShapeDef | null)[]) => {
    const activeShapes = shapes.filter((s): s is ShapeDef => s !== null);
    if (activeShapes.length === 0) return false;
    for (const shape of activeShapes) {
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          if (canPlaceShape(shape, x, y, currentGrid)) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleRestart = () => {
    setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false)));
    setAvailableShapes(generateRandomShapes(3));
    setSelectedIndex(null);
    setGameOver(false);
  };

  const handleCellClick = (x: number, y: number) => {
    if (selectedIndex === null || availableShapes[selectedIndex] === null) return;
    
    const shape = availableShapes[selectedIndex]!;
    
    if (canPlaceShape(shape, x, y)) {
      const newGrid = grid.map(row => [...row]);
      for (const pt of shape.points) {
        newGrid[y + pt.y][x + pt.x] = true;
      }
      
      const rowsToClear: number[] = [];
      const colsToClear: number[] = [];
      
      for (let r = 0; r < GRID_SIZE; r++) {
        if (newGrid[r].every(cell => cell)) rowsToClear.push(r);
      }
      for (let c = 0; c < GRID_SIZE; c++) {
        let full = true;
        for (let r = 0; r < GRID_SIZE; r++) {
          if (!newGrid[r][c]) { full = false; break; }
        }
        if (full) colsToClear.push(c);
      }
      
      let cleared = 0;
      if (rowsToClear.length > 0 || colsToClear.length > 0) {
        for (const r of rowsToClear) {
          for (let c = 0; c < GRID_SIZE; c++) newGrid[r][c] = false;
        }
        for (const c of colsToClear) {
          for (let r = 0; r < GRID_SIZE; r++) newGrid[r][c] = false;
        }
        cleared = rowsToClear.length + colsToClear.length;
      }
      
      setGrid(newGrid);
      
      const newAvailable = [...availableShapes];
      newAvailable[selectedIndex] = null;
      setSelectedIndex(null);
      
      if (newAvailable.every(s => s === null)) {
        setAvailableShapes(newAvailable);
        setTimeout(() => {
          const nextShapes = generateRandomShapes(3);
          setAvailableShapes(nextShapes);
          if (checkGameOver(newGrid, nextShapes)) {
            setGameOver(true);
          }
        }, 300);
      } else {
        setAvailableShapes(newAvailable);
        if (checkGameOver(newGrid, newAvailable)) {
          setTimeout(() => setGameOver(true), 300);
        }
      }
      
      if (cleared > 0) {
        claimReward('blocs_correct', { quantity: cleared });
        setMessage("Ligne ! +" + cleared + " 🪙");
        setTimeout(() => setMessage(null), 2500);
      }
    }
  };

  const renderShapePreview = (shape: ShapeDef | null, index: number) => {
    if (!shape) return <div className="w-20 h-20" />; 

    const maxX = Math.max(...shape.points.map(p => p.x));
    const maxY = Math.max(...shape.points.map(p => p.y));
    const cols = maxX + 1;
    const rows = maxY + 1;

    return (
      <button 
        onClick={() => setSelectedIndex(index)}
        className={`flex items-center justify-center w-20 h-20 rounded-xl transition-all ${selectedIndex === index ? 'scale-110 shadow-md' : 'shadow-sm hover:opacity-80'}`}
        style={{ 
          backgroundColor: theme.colors.bg,
          border: selectedIndex === index ? `2px solid ${theme.colors.primary}` : `1px solid var(--color-border)`
        }}
      >
        <div 
          className="grid gap-[2px]" 
          style={{ 
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`
          }}
        >
          {Array.from({ length: rows * cols }).map((_, i) => {
            const x = i % cols;
            const y = Math.floor(i / cols);
            const isFilled = shape.points.some(p => p.x === x && p.y === y);
            return (
              <div 
                key={i} 
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-sm ${isFilled ? shape.color : 'bg-transparent'}`} 
              />
            );
          })}
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center pb-6 transition-colors duration-300" style={{ backgroundColor: theme.colors.bg }}>
      <div className="w-full pt-safe">
        <GameHUD title="Blocs" onBack={onBack} onHelp={() => setShowInstructions(true)} />
      </div>

      <div className="mb-4 h-8 flex justify-center items-center">
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className="font-bold px-6 py-2 rounded-full shadow-lg"
              style={{ backgroundColor: theme.colors.success, color: theme.colors.surface }}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Grid */}
      <div className="p-2 rounded-xl shadow-sm border mb-8 select-none" style={{ backgroundColor: theme.colors.surface, borderColor: 'var(--color-border)' }}>
        <div className="grid grid-cols-8 gap-1 sm:gap-2">
          {grid.map((row, y) => (
            row.map((isFilled, x) => (
              <div
                key={`${x}-${y}`}
                onClick={() => handleCellClick(x, y)}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-md transition-colors cursor-pointer"
                style={{ 
                  backgroundColor: isFilled ? theme.colors.primary : `${theme.colors.ink}10`,
                  boxShadow: isFilled ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                }}
              />
            ))
          ))}
        </div>
      </div>

      {/* Shapes Tray */}
      <div className="flex items-center justify-center gap-4 p-4 rounded-2xl shadow-sm border" style={{ backgroundColor: theme.colors.surface, borderColor: 'var(--color-border)' }}>
        {availableShapes.map((shape, idx) => (
          <div key={idx}>
            {renderShapePreview(shape, idx)}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {gameOver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <GameResult
               state="lose"
               title="Fin de la partie"
               subtitle="Vous ne pouvez plus placer de blocs. Plus de place !"
               onReplay={handleRestart}
               onBack={onBack}
            />
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInstructions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">Comment jouer ?</h2>
                  <button onClick={() => setShowInstructions(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="space-y-4 text-slate-600 text-lg">
                  <p>
                    <strong>1. </strong>Sélectionnez une forme en bas de l'écran en cliquant dessus.
                  </p>
                  <p>
                    <strong>2. </strong>Cliquez sur la grille pour placer la forme. 
                  </p>
                  <p>
                    <strong>3. </strong>Formez des lignes complètes (<span className="font-semibold text-blue-600">verticales</span> ou <span className="font-semibold text-blue-600">horizontales</span>) pour casser les blocs et gagner des piasses !
                  </p>
                  <p>
                    <strong>4. </strong>Collectez des piasses pour débloquer du vocabulaire québécois dans vos prochaines parties.
                  </p>
                </div>
                <div className="mt-8">
                  <button onClick={() => setShowInstructions(false)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors">
                    J'ai compris !
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
