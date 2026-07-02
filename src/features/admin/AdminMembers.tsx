import React, { useState, useEffect } from 'react';
import { useAdminTheme } from '../../store/useAdminTheme';
import { useTenant } from '../../store/useTenant';
import { TenantMember, RevenueShareAgreement, TenantRole } from '../../types';
import { UserPlus, Shield, Mail, Edit2, Trash2, Percent, DollarSign, X } from 'lucide-react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { secureFetch } from '../../utils/secureFetch';

export default function AdminMembers() {
  const { theme } = useAdminTheme();
  const { currentTenant } = useTenant();
  const role = currentTenant?.type === 'saas' ? 'superadmin' : 'client';
  
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TenantRole>('creator');

  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TenantMember | null>(null);
  const [revenueShare, setRevenueShare] = useState<number>(30);

  const cardStyle = {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.surface,
  };

  useEffect(() => {
    if (!currentTenant?.id) return;
    setIsLoading(true);
    const q = query(collection(db, 'tenants', currentTenant.id, 'members'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: TenantMember[] = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() } as TenantMember);
      });
      setMembers(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching members:", error);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [currentTenant?.id]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant?.id || !auth.currentUser) return;
    
    setIsInviting(true);
    try {
      const response = await secureFetch('/api/admin/members/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser.getIdToken()}`
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          tenantId: currentTenant.id,
          name: ''
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur inconnue');
      }
      
      setInviteEmail('');
      setShowInviteModal(false);
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    } finally {
      setIsInviting(false);
    }
  };

  const getRoleBadgeColor = (role: TenantRole) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'creator': return 'bg-green-100 text-green-800 border-green-200';
      case 'employee': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'support': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: theme.colors.ink }}>
            Membres & Formateurs
          </h2>
          <p className="text-sm" style={{ color: theme.colors.muted }}>
            Gérez les accès à votre espace créateur et configurez les partages de revenus.
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all hover:opacity-90 text-white"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <UserPlus className="w-5 h-5" />
          Inviter un membre
        </button>
      </div>

      <div className="rounded-3xl border overflow-hidden" style={cardStyle}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ backgroundColor: theme.colors.surface, color: theme.colors.muted }}>
                <th className="p-4 font-semibold text-sm">Utilisateur</th>
                <th className="p-4 font-semibold text-sm">Rôle</th>
                <th className="p-4 font-semibold text-sm">Statut</th>
                <th className="p-4 font-semibold text-sm">Ajouté le</th>
                <th className="p-4 font-semibold text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-t border-gray-100/10">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 font-bold" style={{ color: theme.colors.ink }}>
                        {member.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: theme.colors.ink }}>{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(member.role)}`}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-1.5 text-sm">
                      <span className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-green-500' : member.status === 'invited' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                      <span style={{ color: theme.colors.muted }}>
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </span>
                    </span>
                  </td>
                  <td className="p-4 text-sm" style={{ color: theme.colors.muted }}>
                    {new Date(member.addedAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {member.role === 'creator' && (
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setShowRevenueModal(true);
                          }}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Partage de revenus"
                          style={{ color: theme.colors.primary }}
                        >
                          <Percent className="w-4 h-4" />
                        </button>
                      )}
                      <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: theme.colors.muted }}>
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-red-50 transition-colors text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div 
            className="w-full max-w-md rounded-3xl p-6 shadow-2xl relative"
            style={{ backgroundColor: theme.colors.surface }}
          >
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 transition-colors"
              style={{ color: theme.colors.muted }}
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold mb-6" style={{ color: theme.colors.ink }}>
              Inviter un collaborateur
            </h3>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: theme.colors.ink }}>
                  Adresse email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="collab@example.com"
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none"
                  style={{ 
                    borderColor: theme.colors.surface,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.ink,
                  }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: theme.colors.ink }}>
                  Rôle
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TenantRole)}
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none"
                  style={{ 
                    borderColor: theme.colors.surface,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.ink,
                  }}
                >
                  <option value="creator">Créateur / Formateur</option>
                  <option value="admin">Administrateur</option>
                  <option value="employee">Employé / Tuteur</option>
                  <option value="support">Support client</option>
                </select>
                <p className="mt-2 text-xs" style={{ color: theme.colors.muted }}>
                  {inviteRole === 'creator' && "Peut créer des cours et recevoir des partages de revenus."}
                  {inviteRole === 'admin' && "A un accès complet à l'espace d'administration."}
                  {inviteRole === 'employee' && "Peut gérer les apprenants et corriger les devoirs."}
                  {inviteRole === 'support' && "Accès limité pour aider les utilisateurs."}
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold border transition-colors"
                  style={{ 
                    color: theme.colors.ink,
                    borderColor: theme.colors.surface
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  {isInviting ? 'Invitation...' : "Envoyer l'invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRevenueModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div 
            className="w-full max-w-md rounded-3xl p-6 shadow-2xl relative"
            style={{ backgroundColor: theme.colors.surface }}
          >
            <button
              onClick={() => setShowRevenueModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 transition-colors"
              style={{ color: theme.colors.muted }}
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold mb-2" style={{ color: theme.colors.ink }}>
              Partage de revenus
            </h3>
            <p className="text-sm mb-6" style={{ color: theme.colors.muted }}>
              Configurez le pourcentage reversé à {selectedMember.email} sur la vente de ses cours.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: theme.colors.ink }}>
                  Pourcentage de commission
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={revenueShare}
                    onChange={(e) => setRevenueShare(parseInt(e.target.value))}
                    className="flex-1 accent-blue-500"
                  />
                  <div 
                    className="w-16 px-3 py-2 rounded-xl border text-center font-bold"
                    style={{ 
                      borderColor: theme.colors.surface,
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.ink,
                    }}
                  >
                    {revenueShare}%
                  </div>
                </div>
              </div>

              <div 
                className="p-4 rounded-xl border flex items-start gap-3"
                style={{ 
                  backgroundColor: `${theme.colors.success}10`,
                  borderColor: `${theme.colors.success}20`,
                }}
              >
                <DollarSign className="w-5 h-5 mt-0.5" style={{ color: theme.colors.success }} />
                <div className="text-sm">
                  <span className="font-bold block mb-1" style={{ color: theme.colors.success }}>
                    Simulation (Cours à 100$)
                  </span>
                  <div style={{ color: theme.colors.ink }}>
                    Le créateur reçoit: <strong>{revenueShare}$</strong><br/>
                    La plateforme garde: <strong>{100 - revenueShare}$</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => setShowRevenueModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold border transition-colors"
                  style={{ 
                    color: theme.colors.ink,
                    borderColor: theme.colors.surface
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    alert(`Accord de partage enregistré: ${revenueShare}% pour ${selectedMember.email}`);
                    setShowRevenueModal(false);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
