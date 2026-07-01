import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/useAuth';
import { useAdminTheme } from '../../store/useAdminTheme';
import { useTenant } from '../../store/useTenant';
import { DollarSign, TrendingUp, History, Download, ShieldCheck, CheckCircle } from 'lucide-react';
import { getAuth } from 'firebase/auth';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  creatorId: string;
  timestamp: any;
  splits: {
    platformPercentage: number;
    creatorPercentage: number;
    platformAmount: number;
    creatorAmount: number;
  };
}

interface Ledger {
  id: string;
  creatorId: string;
  tenantId: string;
  pendingBalance: number;
  totalEarned: number;
}

export default function AdminRoyalties() {
  const { theme } = useAdminTheme();
  const { claims } = useAuth();
  const currentTenant = useTenant(s => s.currentTenant);
  const isSuperAdmin = claims?.role === 'superadmin';
  const isAdmin = isSuperAdmin || claims?.role === 'admin';
  
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [simAmount, setSimAmount] = useState(100);
  const [simCreatorId, setSimCreatorId] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currentTenant]);

  const fetchData = async () => {
    if (!currentTenant) return;
    setIsLoading(true);
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      
      const [ledgersRes, txRes] = await Promise.all([
        fetch(`/api/revenue/ledgers?tenantId=${currentTenant.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/revenue/transactions?tenantId=${currentTenant.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (ledgersRes.ok) setLedgers(await ledgersRes.json());
      if (txRes.ok) setTransactions(await txRes.json());
    } catch (err) {
      console.error("Erreur chargement royalties", err);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateTransaction = async () => {
    if (!currentTenant || !simCreatorId) return;
    setIsSimulating(true);
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      
      const res = await fetch('/api/revenue/process-transaction', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          amount: simAmount,
          creatorId: simCreatorId,
          tenantId: currentTenant.id,
          type: 'bundle_purchase'
        })
      });

      if (res.ok) {
        fetchData();
      } else {
        alert("Erreur lors de la simulation");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  const totalPending = ledgers.reduce((acc, l) => acc + (l.pendingBalance || 0), 0);
  const totalEarnedAll = ledgers.reduce((acc, l) => acc + (l.totalEarned || 0), 0);

  const cardStyle = {
    backgroundColor: theme.colors.surface,
    borderColor: theme.dark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
    color: theme.colors.ink,
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black" style={{ color: theme.colors.ink }}>Revenus & Redevances</h2>
          <p className="text-sm" style={{ color: theme.colors.muted }}>
            {isAdmin 
              ? "Gérez les revenus générés et les redevances dues aux créateurs." 
              : "Suivez vos ventes et vos revenus générés."}
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold" style={{ borderColor: theme.colors.success, color: theme.colors.success, backgroundColor: `${theme.colors.success}15` }}>
            <ShieldCheck className="w-4 h-4" /> Mode Admin
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl p-6 border shadow-sm" style={cardStyle}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl" style={{ backgroundColor: `${theme.colors.primary}15`, color: theme.colors.primary }}>
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm">Solde En Attente</h3>
          </div>
          <p className="text-3xl font-black">${totalPending.toFixed(2)}</p>
          <p className="text-xs mt-1" style={{ color: theme.colors.muted }}>Revenus prêts à être versés</p>
        </div>
        
        <div className="rounded-3xl p-6 border shadow-sm" style={cardStyle}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl" style={{ backgroundColor: `${theme.colors.success}15`, color: theme.colors.success }}>
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm">Gains Totaux Historiques</h3>
          </div>
          <p className="text-3xl font-black">${totalEarnedAll.toFixed(2)}</p>
          <p className="text-xs mt-1" style={{ color: theme.colors.muted }}>Cumul depuis la création</p>
        </div>
      </div>

      {/* Simulation Tools (Admin Only) */}
      {isAdmin && (
        <div className="rounded-3xl p-6 border shadow-sm space-y-4" style={cardStyle}>
          <h3 className="font-bold border-b pb-2" style={{ borderColor: theme.dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>Simuler une Transaction (Admin)</h3>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1 flex-1 min-w-[200px]">
              <label className="text-xs font-bold">Montant Brut ($)</label>
              <input 
                type="number" 
                value={simAmount}
                onChange={e => setSimAmount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border bg-transparent"
                style={{ borderColor: theme.dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" }}
              />
            </div>
            <div className="space-y-1 flex-1 min-w-[200px]">
              <label className="text-xs font-bold">ID Créateur</label>
              <input 
                type="text" 
                placeholder="Ex: user_123"
                value={simCreatorId}
                onChange={e => setSimCreatorId(e.target.value)}
                className="w-full p-2.5 rounded-xl border bg-transparent"
                style={{ borderColor: theme.dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" }}
              />
            </div>
            <button 
              onClick={simulateTransaction}
              disabled={isSimulating || !simCreatorId}
              className="px-6 py-2.5 rounded-xl font-bold text-white shadow-md disabled:opacity-50"
              style={{ backgroundColor: theme.colors.primary }}
            >
              {isSimulating ? 'Traitement...' : 'Traiter le Paiement'}
            </button>
          </div>
          <p className="text-xs" style={{ color: theme.colors.muted }}>
            Répartition automatique : 30% Plateforme / 70% Créateur. Transactions Firestore atomiques.
          </p>
        </div>
      )}

      {/* Transactions List */}
      <div className="rounded-3xl p-6 border shadow-sm" style={cardStyle}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5" style={{ color: theme.colors.primary }} />
            <h3 className="font-bold">Historique des Transactions</h3>
          </div>
          <button className="text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <Download className="w-3 h-3" /> Exporter CSV
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-10 opacity-50">Chargement...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-10 opacity-50">Aucune transaction trouvée.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: theme.dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
                  <th className="pb-3 font-bold">Date</th>
                  <th className="pb-3 font-bold">ID / Type</th>
                  {isAdmin && <th className="pb-3 font-bold">Créateur</th>}
                  <th className="pb-3 font-bold text-right">Montant Brut</th>
                  <th className="pb-3 font-bold text-right">Frais Plateforme</th>
                  <th className="pb-3 font-bold text-right">Part Créateur</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: theme.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3">
                      {tx.timestamp?._seconds ? new Date(tx.timestamp._seconds * 1000).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3">
                      <div className="font-medium">{tx.id.slice(0, 8)}...</div>
                      <div className="text-[10px] uppercase tracking-wider opacity-60">{tx.type}</div>
                    </td>
                    {isAdmin && (
                      <td className="py-3 font-mono text-xs opacity-75">{tx.creatorId}</td>
                    )}
                    <td className="py-3 text-right font-bold">${tx.amount.toFixed(2)}</td>
                    <td className="py-3 text-right text-red-500 font-medium">-${tx.splits.platformAmount.toFixed(2)}</td>
                    <td className="py-3 text-right text-green-500 font-bold">+${tx.splits.creatorAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ledgers List (Admin Only) */}
      {isAdmin && (
        <div className="rounded-3xl p-6 border shadow-sm" style={cardStyle}>
           <div className="flex items-center gap-2 mb-6">
            <CheckCircle className="w-5 h-5" style={{ color: theme.colors.success }} />
            <h3 className="font-bold">Soldes des Créateurs (Ledgers)</h3>
          </div>
          {ledgers.length === 0 ? (
            <div className="text-center py-10 opacity-50">Aucun solde trouvé.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ledgers.map(ledger => (
                <div key={ledger.id} className="p-4 rounded-2xl border bg-black/5 dark:bg-white/5 flex justify-between items-center">
                  <div>
                    <div className="text-xs opacity-75 mb-1">Créateur ID</div>
                    <div className="font-mono text-sm font-bold">{ledger.creatorId}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs opacity-75 mb-1">Solde Dû</div>
                    <div className="font-black text-lg text-green-500">${(ledger.pendingBalance || 0).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
