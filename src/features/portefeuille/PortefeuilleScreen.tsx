import { ArrowLeft, Wallet, Palette, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProgression } from '../../store/useProgression';
import { useTheme } from '../../store/useTheme';
import { useCurrency } from '../../hooks/useCurrency';
import MoneyVisualizer from '../../components/MoneyVisualizer';
import { motion } from 'motion/react';

interface PortefeuilleScreenProps {
  onBack: () => void;
}

export default function PortefeuilleScreen({ onBack }: PortefeuilleScreenProps) {
  const navigate = useNavigate();
  const { piasses } = useProgression();
  const { theme } = useTheme();
  const { format, name, symbol } = useCurrency();

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: theme.colors.bg }}>
      <div className="w-full max-w-2xl min-h-screen shadow-xl border-x" style={{ backgroundColor: theme.colors.surface, borderColor: 'var(--color-border)' }}>
        
        {/* Header */}
        <div className="sticky top-0 backdrop-blur-md border-b z-50 p-4 flex items-center justify-between" style={{ backgroundColor: `${theme.colors.surface}E6`, borderColor: 'var(--color-border)' }}>
          <button
            onClick={onBack}
            className="flex items-center gap-2 transition-colors font-medium"
            style={{ color: theme.colors.muted }}
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>
          
          <div className="flex items-center gap-2 font-bold px-4 py-2 rounded-full" style={{ backgroundColor: `${theme.colors.success}20`, color: theme.colors.success }}>
            <Wallet className="w-5 h-5" />
            Mon Portefeuille
          </div>
        </div>

        <div className="p-6">
           <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold mb-2" style={{ color: theme.colors.ink }}>Votre Solde</h1>
              <p style={{ color: theme.colors.muted }}>
                 Voici la représentation de vos gains en {name.toLowerCase()}.
              </p>
           </div>
           
           {/* Navigation settings */}
           <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
             <button 
                onClick={() => navigate('/memoire')}
                className="flex items-center gap-4 p-4 rounded-2xl border transition-all hover:opacity-80 shadow-sm"
                style={{ backgroundColor: theme.colors.surface, borderColor: 'var(--color-border)' }}
             >
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}>
                  <Brain className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-bold text-lg font-display" style={{ color: theme.colors.ink }}>État Mémoriel</h3>
                  <p className="text-sm font-medium" style={{ color: theme.colors.muted }}>Consulter votre rétention et vos concepts fragiles</p>
                </div>
             </button>
             <button 
                onClick={() => navigate('/apparence')}
                className="flex items-center gap-4 p-4 rounded-2xl border transition-all hover:opacity-80 shadow-sm"
                style={{ backgroundColor: theme.colors.surface, borderColor: 'var(--color-border)' }}
             >
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}>
                  <Palette className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-bold text-lg font-display" style={{ color: theme.colors.ink }}>Apparence & Thème</h3>
                  <p className="text-sm font-medium" style={{ color: theme.colors.muted }}>Personnaliser les couleurs et l'esthétique</p>
                </div>
             </button>
           </div>
           
           <div className="rounded-3xl p-8 mb-8 text-center border" style={{ backgroundColor: theme.colors.bg, borderColor: 'var(--color-border)' }}>
              <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className="text-5xl font-black mb-8"
                 style={{ color: theme.colors.success }}
              >
                 {format(piasses)}
              </motion.div>
              
              <div className="rounded-3xl p-6 shadow-inner min-h-[400px] flex items-center justify-center overflow-x-auto" style={{ backgroundColor: theme.colors.surface }}>
                 {piasses > 0 ? (
                    symbol === '$' ? <MoneyVisualizer amount={piasses} size="lg" className="w-full" /> : <div className="text-9xl">{symbol}</div>
                 ) : (
                    <div className="font-medium" style={{ color: theme.colors.muted }}>
                       Votre portefeuille est vide. Complétez des jeux pour gagner des {name.toLowerCase()} !
                    </div>
                 )}
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}
