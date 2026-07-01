import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { ArrowLeft, Trophy, Medal } from 'lucide-react';
import { motion } from 'motion/react';
import { useProgression } from '../../store/useProgression';
import { useTheme } from '../../store/useTheme';
import { useTenant } from '../../store/useTenant';

interface LeaderboardEntry {
  id: string;
  surnom: string;
  scoreTotal: number;
}

export default function LeaderboardScreen({ onBack }: { onBack: () => void }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { surnom: currentSurnom, piasses, motsDebloques } = useProgression();
  const { theme } = useTheme();

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const tenantId = useTenant.getState().currentTenant?.id || 'eduforge';
        const q = query(
          collection(db, 'classement'),
          where('tenantId', '==', tenantId),
          orderBy('scoreTotal', 'desc'),
          limit(20)
        );
        const snapshot = await getDocs(q);
        const fetchedEntries = snapshot.docs.map(doc => ({
          id: doc.id,
          surnom: doc.data().surnom || 'Anonyme',
          scoreTotal: doc.data().scoreTotal || 0
        }));
        setEntries(fetchedEntries);
      } catch (error) {
        console.error('Erreur lors du chargement du classement', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  let displayEntries = [...entries];
  if (!loading && currentSurnom && !entries.some(e => e.surnom === currentSurnom)) {
    const currentScoreTotal = piasses + ((motsDebloques?.length || 0) * 10);
    displayEntries.push({
      id: 'current-user-fallback',
      surnom: currentSurnom,
      scoreTotal: currentScoreTotal
    });
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-6" style={{ backgroundColor: theme.colors.bg }}>
      <div className="w-full max-w-md flex items-center justify-between mb-8">
        <button 
          onClick={onBack}
          className="p-3 rounded-full shadow-sm transition-colors"
          style={{ backgroundColor: theme.colors.surface, color: theme.colors.ink }}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2" style={{ color: theme.colors.ink }}>
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h2 className="text-xl font-bold">Classement</h2>
        </div>
        <div className="w-12" /> {/* Spacer */}
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
          <h1 className="text-2xl font-extrabold mb-1">Top Joueurs</h1>
          <p className="text-blue-100 text-sm font-medium">Les légendes du Québec</p>
        </div>

        <div className="p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center p-8 text-slate-400">
              Chargement...
            </div>
          ) : displayEntries.length < 10 ? (
            <div className="flex flex-col">
              <div className="text-center py-12 px-6">
                <div className="text-5xl mb-4">🏆</div>
                <h2 className="text-xl font-black text-slate-800 mb-2">
                  Les légendes arrivent bientôt !
                </h2>
                <p className="text-slate-500 mb-6">
                  Invite tes amis pour débloquer le classement 
                  des légendes du Québec.
                </p>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'Mots & Blocs',
                        text: 'Apprends le français québécois avec moi !',
                        url: window.location.origin,
                      });
                    }
                  }}
                  className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Inviter mes amis 🍁
                </button>
              </div>
              <div className="w-full">
                {displayEntries.map((entry, index) => {
                  const isCurrent = entry.surnom === currentSurnom;
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center p-3 rounded-2xl ${isCurrent ? 'border shadow-sm' : 'transition-colors'}`}
                      style={{ 
                        backgroundColor: isCurrent ? `${theme.colors.primary}20` : theme.colors.surface,
                        borderColor: isCurrent ? theme.colors.primary : 'transparent'
                      }}
                    >
                      <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center font-bold text-lg mr-3">
                        {index === 0 && <Medal className="w-8 h-8 text-yellow-500" />}
                        {index === 1 && <Medal className="w-7 h-7 text-slate-400" />}
                        {index === 2 && <Medal className="w-7 h-7 text-amber-600" />}
                        {index > 2 && <span style={{ color: theme.colors.muted }}>#{index + 1}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate" style={{ color: isCurrent ? theme.colors.primary : theme.colors.ink }}>
                          {entry.surnom} {isCurrent && <span className="text-xs ml-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.colors.primary, color: theme.colors.surface }}>Vous</span>}
                        </div>
                      </div>
                      <div className="text-right ml-3">
                        <div className="font-bold" style={{ color: theme.colors.ink }}>{Math.floor(entry.scoreTotal)} pt</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            displayEntries.map((entry, index) => {
              const isCurrent = entry.surnom === currentSurnom;
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center p-3 rounded-2xl ${isCurrent ? 'border shadow-sm' : 'transition-colors'}`}
                  style={{ 
                    backgroundColor: isCurrent ? `${theme.colors.primary}20` : theme.colors.surface,
                    borderColor: isCurrent ? theme.colors.primary : 'transparent'
                  }}
                >
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center font-bold text-lg mr-3">
                    {index === 0 && <Medal className="w-8 h-8 text-yellow-500" />}
                    {index === 1 && <Medal className="w-7 h-7 text-slate-400" />}
                    {index === 2 && <Medal className="w-7 h-7 text-amber-600" />}
                    {index > 2 && <span style={{ color: theme.colors.muted }}>#{index + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate" style={{ color: isCurrent ? theme.colors.primary : theme.colors.ink }}>
                      {entry.surnom} {isCurrent && <span className="text-xs ml-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.colors.primary, color: theme.colors.surface }}>Vous</span>}
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <div className="font-bold" style={{ color: theme.colors.ink }}>{Math.floor(entry.scoreTotal)} pt</div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
