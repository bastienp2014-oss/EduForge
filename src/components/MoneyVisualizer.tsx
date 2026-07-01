import React from 'react';
import { motion } from 'motion/react';

interface MoneyVisualizerProps {
  amount: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CURRENCY_DENOMINATIONS = [
  { value: 100, id: '100', type: 'bill', layout: 'h', color: 'bg-[#B48F6C] text-[#2e1d11]' },
  { value: 50, id: '50', type: 'bill', layout: 'h', color: 'bg-[#E3938C] text-[#4a1c18]' },
  { value: 20, id: '20', type: 'bill', layout: 'h', color: 'bg-[#A8C7A0] text-[#1c3318]' },
  { value: 10, id: '10', type: 'bill', layout: 'v', color: 'bg-[#AC94BD] text-[#341d40]' },
  { value: 5, id: '5', type: 'bill', layout: 'h', color: 'bg-[#8CA8D1] text-[#152336]' },
  { value: 2, id: '2', type: 'coin', color: 'bg-[#F4D03F] border-[5px] border-[#BDC3C7] text-yellow-900' },
  { value: 1, id: '1', type: 'coin', color: 'bg-[#F4D03F] border-[3px] border-[#D4AC0D] text-yellow-900' },
  { value: 0.25, id: '0.25', type: 'coin', color: 'bg-[#E5E7EB] border-[2px] border-[#9CA3AF] text-slate-800' },
  { value: 0.10, id: '0.10', type: 'coin', color: 'bg-[#E5E7EB] border-[2px] border-[#9CA3AF] text-slate-800' },
  { value: 0.05, id: '0.05', type: 'coin', color: 'bg-[#E5E7EB] border-[2px] border-[#9CA3AF] text-slate-800' },
];

export function extractDenominations(amount: number) {
  let remaining = parseFloat(amount.toFixed(2));
  const breakdown: { [key: string]: number } = {};

  for (const denom of CURRENCY_DENOMINATIONS) {
    if (remaining >= denom.value) {
        // Fix floating point precision issues during division
      const count = Math.floor((remaining + 0.001) / denom.value);
      if (count > 0) {
        breakdown[denom.id] = count;
        remaining = remaining - (count * denom.value);
      }
    }
  }

  return breakdown;
}

export default function MoneyVisualizer({ amount, className = "", size = 'md' }: MoneyVisualizerProps) {
  const breakdown = extractDenominations(amount);
  
  // Track image load failures to show beautiful vector fallbacks
  const [imageErrors, setImageErrors] = React.useState<Record<string, boolean>>({
    '2': true, // 2$ doesn't have an image, so start with fallback active
  });

  const bills = CURRENCY_DENOMINATIONS.filter(d => d.type === 'bill');
  const coins = CURRENCY_DENOMINATIONS.filter(d => d.type === 'coin');
  
  const mult = size === 'sm' ? 0.6 : size === 'lg' ? 1.5 : 1;

  const hasBills = bills.some(b => breakdown[b.id] > 0);
  const hasCoins = coins.some(c => breakdown[c.id] > 0);

  return (
    <div className={`flex flex-col gap-8 items-center justify-center ${className}`}>
      {/* SECTION DES BILLETS */}
      {hasBills && (
        <div className="flex flex-wrap justify-center gap-4">
          {bills.map(denom => {
            const count = breakdown[denom.id];
            if (!count) return null;

            const isVertical = denom.layout === 'v';

            return (
              <motion.div 
                key={denom.id} 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="relative flex flex-col items-center bg-white rounded-3xl p-4 shadow-sm hover:shadow-md transition-all border-2 border-slate-100 justify-between min-h-[160px]"
                style={{ width: size === 'sm' ? 80 : 120 }}
              >
                <div className="w-full flex-grow flex items-center justify-center mb-2">
                  <div 
                    className={`overflow-hidden rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center relative shadow-sm ${
                      isVertical 
                        ? 'h-24 aspect-[1/2.15] w-auto' 
                        : 'w-full aspect-[2.15] h-auto'
                    }`}
                  >
                    {imageErrors[denom.id] ? (
                      <div className={`w-full h-full ${denom.color} rounded-lg flex flex-col items-center justify-between p-1.5 font-bold text-xs select-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]`}>
                        <div className="self-start text-[8px] opacity-75">{denom.value}$</div>
                        <div className="text-sm font-black tracking-tight">{denom.value}$</div>
                        <div className="self-end text-[8px] opacity-75 rotate-180">{denom.value}$</div>
                      </div>
                    ) : (
                      <img 
                        src={`/money/${denom.id}.png`}
                        alt={`${denom.value}$`}
                        // scale-[1.25] combined with object-cover crops out the outer checkerboard borders perfectly
                        className="w-full h-full object-cover scale-[1.25]"
                        onError={() => setImageErrors(prev => ({ ...prev, [denom.id]: true }))}
                      />
                    )}
                  </div>
                </div>
                <div className="font-bold text-slate-700 text-xs text-center leading-tight mt-auto">
                   Billet de {denom.value}$
                </div>
                
                {count > 0 && (
                  <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-xs font-black px-2.5 py-1 rounded-full border-4 border-slate-100 shadow-sm z-30">
                    x{count}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* SECTION DES PIÈCES */}
      {hasCoins && (
        <div className="flex flex-wrap justify-center gap-4">
          {coins.map(denom => {
            const count = breakdown[denom.id];
            if (!count) return null;

            return (
              <motion.div 
                key={denom.id} 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="relative flex flex-col items-center bg-white rounded-3xl p-4 shadow-sm hover:shadow-md transition-all border-2 border-slate-100 justify-between min-h-[160px]"
                style={{ width: size === 'sm' ? 80 : 120 }}
              >
                <div className="w-full flex-grow flex items-center justify-center mb-2">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden bg-slate-50 border border-slate-200 relative shadow-inner">
                    {imageErrors[denom.id] ? (
                      denom.value === 2 ? (
                        // Beautiful bimetallic Canadian Toonie Vector fallback (Silver outer ring, gold core)
                        <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-400 rounded-full border-2 border-slate-300 p-1 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-200 via-[#F4D03F] to-amber-500 border border-amber-300 flex items-center justify-center font-black text-amber-950 text-xs shadow-inner">
                            2$
                          </div>
                        </div>
                      ) : denom.value === 1 ? (
                        // Loonie vector fallback (Golden brass)
                        <div className="w-full h-full bg-gradient-to-br from-amber-200 via-[#F5C71A] to-amber-500 rounded-full border-2 border-amber-400 flex items-center justify-center font-black text-amber-950 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]">
                          1$
                        </div>
                      ) : (
                        // Silver coins fallback (Quarter, Dime, Nickel)
                        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-300 rounded-full border-2 border-slate-200 flex items-center justify-center font-black text-slate-700 text-xs shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                          {denom.value >= 1 ? `${denom.value}$` : `${Math.round(denom.value * 100)}¢`}
                        </div>
                      )
                    ) : (
                      <img 
                        src={`/money/${denom.id}.png`}
                        alt={`${denom.value}$`}
                        // scale-[1.35] inside rounded-full completely removes outer square corners & fake checkerboards
                        className="w-full h-full object-cover scale-[1.35] drop-shadow-sm"
                        onError={() => setImageErrors(prev => ({ ...prev, [denom.id]: true }))}
                      />
                    )}
                  </div>
                </div>
                <div className="font-bold text-slate-700 text-xs text-center leading-tight mt-auto">
                   {denom.value >= 1 ? `Pièce de ${denom.value}$` : `Pièce de ${Math.round(denom.value * 100)}¢`}
                </div>
                
                {count > 0 && (
                  <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-xs font-black px-2.5 py-1 rounded-full border-4 border-slate-100 shadow-sm z-30">
                    x{count}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  );
}
