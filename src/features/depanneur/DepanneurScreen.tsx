/**
 * DEPANNEUR SCREEN (La Rue Principale - original design)
 * Single column vertical list with road track in center
 */
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useProgression } from '../../store/useProgression';
import itemsData from '../../data/items.json';
import MoneyVisualizer, { CURRENCY_DENOMINATIONS } from '../../components/MoneyVisualizer';
import { useTheme } from '../../store/useTheme';
import { useCurrency } from '../../hooks/useCurrency';
import { useAppConfig } from '../../store/useAppConfig';

type DepanneurProps = {
  onBack: () => void;
  isEmbedded?: boolean;
  ruesSecondaires?: any[];
  onNaviguerRue?: (rueId: any) => void;
  onOpenScenarios?: () => void;
  initialShop?: string;
};

type ItemData = {
  id: string;
  nom: string;
  description: string;
  prix_avant_taxes: number;
  tps_gst: number;
  tvq_qst: number;
  taxes_totales: number;
  prix_total_taxes_incluses: number;
  categorie: string;
  icone: string;
  taxable: boolean;
  shop_id?: string;
};

type Shop = {
  id: string;
  name: string;
  icon: string;
  desc: string;
  color: string;
  bg: string;
  side: 'left' | 'right';
  isRedirect?: boolean;
  route?: string;
};

const SHOPS: Shop[] = [
  // Left column
  { id: 'epicerie', name: 'Épicerie', icon: '🛒', desc: 'ALIMENTATION ET DE BASE', color: '#16a34a', bg: '#f0fdf4', side: 'left' },
  { id: 'maison_shop', name: 'Maison', icon: '🏠', desc: 'ACHAT, ENTRETIEN ET TAXES', color: '#059669', bg: '#ecfdf5', side: 'left' },
  { id: 'hopital', name: 'Hôpital & Cliniques', icon: '🏥', desc: 'SOINS DE SANTÉ', color: '#2563eb', bg: '#eff6ff', side: 'left' },
  { id: 'saaq', name: 'SAAQ', icon: '🚗', desc: 'PERMIS ET IMMATRICULATION', color: '#0284c7', bg: '#f0f9ff', side: 'left' },
  { id: 'hotel_de_ville', name: 'Services Publics', icon: '🏛️', desc: 'TAXES, PAIEMENTS', color: '#475569', bg: '#f8fafc', side: 'left' },
  { id: 'boutiques', name: 'Boutiques & Loisirs', icon: '🛍️', desc: 'ACTIVITÉS, VÊTEMENTS', color: '#c026d3', bg: '#fdf4ff', side: 'left' },
  { id: 'ecole', name: 'Écoles & Éducation', icon: '🏫', desc: 'SYSTÈME SCOLAIRE', color: '#ca8a04', bg: '#fefce8', side: 'left', isRedirect: true, route: 'education' },

  // Right column
  { id: 'depanneur', name: 'Dépanneur', icon: '🏪', desc: 'DÉPANNAGE ET LAVE-GLACE', color: '#4f46e5', bg: '#eef2ff', side: 'right' },
  { id: 'appartement_shop', name: 'Appartement', icon: '🏢', desc: 'LOYER ET ASSURANCES', color: '#7c3aed', bg: '#f5f3ff', side: 'right' },
  { id: 'quincaillerie', name: 'Quincaillerie', icon: '🔨', desc: 'RÉPARATIONS ET MAISON', color: '#ea580c', bg: '#fff7ed', side: 'right' },
  { id: 'garage', name: 'Garage', icon: '🔧', desc: 'ENTRETIEN, PNEUS ET ESSENCE', color: '#52525b', bg: '#fafafa', side: 'right' },
  { id: 'resto', name: 'Restaurants & Cafés', icon: '🍔', desc: 'MANGER OU BOIRE', color: '#d97706', bg: '#fffbeb', side: 'right' },
  { id: 'transport', name: 'Transport', icon: '🚌', desc: 'BUS, MÉTRO, TAXI', color: '#0891b2', bg: '#ecfeff', side: 'right' },
  { id: 'arcade', name: "Salle d'Arcade", icon: '🕹️', desc: 'MINI-JEUX ET DÉFIS', color: '#7c3aed', bg: '#f5f3ff', side: 'right', isRedirect: true, route: 'arcade' },
];

function ShopCard({ shop, animIdx, onSelect }: { shop: Shop; animIdx: number; onSelect: () => void; }) {
  const count = (itemsData as ItemData[]).filter(i => i.shop_id === shop.id).length;
  if (count === 0 && !shop.isRedirect) return <div className="flex-1 opacity-0 pointer-events-none" />;
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animIdx * 0.04, duration: 0.3 }}
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className={`flex-1 rounded-3xl p-4 text-left relative overflow-hidden shadow-sm active:shadow-none transition-shadow flex flex-col items-center justify-center`}
      style={{ background: shop.bg, minWidth: 0 }}
    >
      {!shop.isRedirect && count > 0 && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white" style={{ background: shop.color }}>
          {count}
        </div>
      )}
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-2" style={{ background: shop.color }}>
        <span className="text-3xl">{shop.icon}</span>
      </div>
      <p className="font-black text-[15px] leading-tight text-center mt-1" style={{ color: shop.color }}>{shop.name}</p>
      <p className="text-[9px] font-bold uppercase tracking-wider mt-1.5 leading-tight text-center" style={{ color: shop.color, opacity: 0.8 }}>{shop.desc}</p>
    </motion.button>
  );
}

export default function DepanneurScreen({ onBack,  isEmbedded, ruesSecondaires, onNaviguerRue, onOpenScenarios, initialShop }: DepanneurProps) {
  const navigate = useNavigate();
  const { piasses, acheterObjet } = useProgression();
  const { theme } = useTheme();
  const { format, symbol, name: currencyName } = useCurrency();
  const { features } = useAppConfig();
  const [selectedItem, setSelectedItem] = useState<ItemData | null>(null);
  const [selectedShop, setSelectedShop] = useState<string | null>(initialShop || null);
  const [tenderedTotal, setTenderedTotal] = useState(0);

  useEffect(() => {
    setSelectedShop(initialShop || null);
  }, [initialShop]);

  const getCashPrice = (item: ItemData) => {
     if (!features.enableQuebecTaxes) return item.prix_avant_taxes;
     return Math.round(item.prix_total_taxes_incluses * 20) / 20;
  };

  const cashTotal = selectedItem ? getCashPrice(selectedItem) : 0;

  const handleBuy = () => {
    if (!selectedItem) return;
    if (tenderedTotal >= cashTotal) {
      if (acheterObjet(selectedItem.id, cashTotal)) {
        setSelectedItem(null);
        setTenderedTotal(0);
      }
    }
  };

  const handleTender = (val: number) => {
    if (tenderedTotal + val > piasses) {
      alert("Tu n'as pas assez d'argent !");
      return;
    }
    setTenderedTotal(p => p + val);
  };

  const handleShopSelect = (shop: Shop) => {
    if (shop.isRedirect && navigate && shop.route) navigate(shop.route);
    else setSelectedShop(shop.id);
  };

  const currentShop = SHOPS.find(s => s.id === selectedShop);
  const shopItems = (itemsData as ItemData[]).filter(i => i.shop_id === selectedShop);

  // Group shops into rows: pairs of (leftShop, rightShop)
  const rows = [];
  const leftShops = SHOPS.filter(s => s.side === 'left');
  const rightShops = SHOPS.filter(s => s.side === 'right');
  const maxRows = Math.max(leftShops.length, rightShops.length);
  for (let i = 0; i < maxRows; i++) {
    rows.push({
      left: leftShops[i] || null,
      right: rightShops[i] || null
    });
  }

  const handleBackShop = () => {
    if (isEmbedded && onBack) {
      onBack();
    } else {
      setSelectedShop(null);
    }
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden" style={{ backgroundColor: theme.colors.bg }}>
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 backdrop-blur-sm" style={{ backgroundColor: `${theme.colors.bg}E6` }}>
        <button onClick={selectedShop ? handleBackShop : onBack} className="w-12 h-12 flex items-center justify-center rounded-full shadow-sm" style={{ backgroundColor: theme.colors.surface, color: theme.colors.ink }}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        {isEmbedded && !selectedShop && (
          <button 
            onClick={onOpenScenarios}
            className="flex-1 mx-4 max-w-[120px] py-2 px-3 rounded-full text-xs font-bold transition-colors flex items-center justify-center shadow-sm"
            style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}
          >
            🎭 Scénarios
          </button>
        )}
        <div className="text-right ml-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1" style={{ color: theme.colors.muted }}>Mon Portefeuille</p>
          <p className="text-xl font-black leading-none" style={{ color: theme.colors.success }}>{format(piasses)}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!selectedShop && (
          <motion.div key="rue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto overflow-x-hidden">
            
            <div className="px-4 pb-6">
              <div className="bg-slate-900 rounded-[32px] p-6 mb-8 flex flex-row items-center gap-5 text-white">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                  <span className="text-3xl text-white">🛍️</span>
                </div>
                <div>
                  <h1 className="font-black text-2xl mb-1 text-white">La Rue Principale</h1>
                  <p className="text-sm text-slate-300 leading-snug">Familiarise-toi avec le coût de la vie au Québec. Découvre les commerces et services locaux !</p>
                </div>
              </div>

              <div className="relative">
                {/* Central Road */}
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 bg-[#e2e8f0] rounded-full overflow-hidden shadow-inner flex justify-center">
                  <div className="h-full border-r-[3px] border-dashed border-[#fbbf24] w-px absolute left-[calc(50%-1px)]" />
                  
                  {/* Animated Cars */}
                  <motion.div
                    className="absolute z-10"
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 15, ease: 'linear', repeat: Infinity }}
                  >
                    <span className="text-xl inline-block -rotate-180">🚗</span>
                  </motion.div>

                  <motion.div
                    className="absolute z-10 text-xl"
                    animate={{ bottom: ['0%', '100%'] }}
                    transition={{ duration: 20, ease: 'linear', repeat: Infinity, delay: 5 }}
                  >
                    <span>🚕</span>
                  </motion.div>
                </div>

                {/* Staggered Rows */}
                <div className="flex flex-col gap-6 relative z-10">
                  {rows.map((row, i) => (
                     <div key={i} className={`flex gap-14 items-center ${i === 0 ? '' : ''}`}>
                       <div className="flex-1">
                         {row.left ? <ShopCard shop={row.left} animIdx={i*2} onSelect={() => handleShopSelect(row.left!)} /> : <div className="h-2" />}
                       </div>
                       <div className={`flex-1 ${i === 0 ? 'mt-20' : ''}`}>
                         {row.right ? <ShopCard shop={row.right} animIdx={i*2+1} onSelect={() => handleShopSelect(row.right!)} /> : <div className="h-2" />}
                       </div>
                     </div>
                  ))}
                </div>
              </div>

              <div className="mt-12 rounded-3xl p-6 border text-center" style={{ backgroundColor: theme.colors.surface, borderColor: 'var(--color-border)' }}>
                <p className="font-black mb-3" style={{ color: theme.colors.ink }}>À cours de {currencyName.toLowerCase()} ?</p>
                <button onClick={() => { alert("Mock: Visionnement d'une publicité..."); useProgression.getState().addPiasses(10); }} className="w-full text-white font-black py-4 rounded-2xl transition-colors flex items-center justify-center gap-2" style={{ backgroundColor: theme.colors.primary }}>
                  <span>▶</span> Regarder une publicité (+10 {symbol})
                </button>
              </div>
            </div>

          </motion.div>
        )}
        {selectedShop && (
          <motion.div key={selectedShop} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="flex-1 overflow-y-auto">
            <div className="p-4" style={{ background: currentShop?.color }}>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{currentShop?.icon}</span>
                <div>
                  <h2 className="font-black text-lg text-white">{currentShop?.name}</h2>
                  <p className="text-white/70 text-xs">{currentShop?.desc}</p>
                </div>
                <button onClick={handleBackShop} className="ml-auto w-8 h-8 flex items-center justify-center rounded-full bg-white/20">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {shopItems.map(item => (
                <motion.button key={item.id} whileTap={{ scale: 0.98 }} onClick={() => setSelectedItem(item)} className="w-full bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-left flex items-center gap-4">
                  <span className="text-3xl shrink-0">{item.icone}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 text-sm">{item.nom}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{item.description}</p>
                    <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase" style={{ background: `${currentShop?.color}15`, color: currentShop?.color }}>
                      {item.categorie}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">ACHETER</p>
                    <p className="font-black text-slate-900">{format(features.enableQuebecTaxes ? item.prix_total_taxes_incluses : item.prix_avant_taxes)}</p>
                  </div>
                </motion.button>
              ))}
            </div>
            <div className="p-4">
              <button onClick={handleBackShop} className="w-full py-3 rounded-2xl font-bold text-slate-600 bg-slate-100">
                Retourner à la rue principale
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-end p-4">
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className="w-full bg-white rounded-3xl p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-start gap-4 mb-6">
                <span className="text-4xl">{selectedItem.icone}</span>
                <div className="flex-1">
                  <h3 className="font-black text-slate-900 text-lg">{selectedItem.nom}</h3>
                  <p className="text-slate-500 text-sm mt-1">{selectedItem.description}</p>
                </div>
                <button onClick={() => { setSelectedItem(null); setTenderedTotal(0); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 mb-4 space-y-2">
                {features.enableQuebecTaxes ? (
                  <>
                    {[
                      { label: 'Prix avant taxes', value: format(selectedItem.prix_avant_taxes) },
                      { label: 'TPS (5%)', value: selectedItem.taxable ? format(selectedItem.tps_gst) : 'Exempté' },
                      { label: 'TVQ (9,975%)', value: selectedItem.taxable ? format(selectedItem.tvq_qst) : 'Exempté' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-slate-500">{label}</span>
                        <span className="font-medium text-slate-700">{value}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Prix unitaire</span>
                    <span className="font-medium text-slate-700">{format(selectedItem.prix_avant_taxes)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total</span><span>{format(cashTotal)}</span>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-sm font-bold text-slate-700 mb-2">
                  Tendrez : {format(tenderedTotal)} / {format(cashTotal)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {CURRENCY_DENOMINATIONS.map(d => (
                    <button key={d.id} onClick={() => handleTender(d.value)} className="px-2 py-1 rounded-lg bg-white font-bold border hover:bg-slate-50 shadow-sm text-sm">
                      {d.value >= 1 ? `${d.value}${symbol}` : `${Math.round(d.value * 100)}¢`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setSelectedItem(null); setTenderedTotal(0); }} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100">
                  Annuler
                </button>
                <button onClick={handleBuy} disabled={tenderedTotal < cashTotal || piasses < cashTotal} className="flex-1 py-3 rounded-xl font-black text-white bg-emerald-600 disabled:opacity-40">
                  Acheter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

