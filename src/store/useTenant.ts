import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export type TenantType = 'saas' | 'tenant';

export interface TenantContext {
  id: string;
  name: string;
  type: TenantType;
  plan: 'free' | 'basic' | 'premium' | 'enterprise';
  isActive: boolean;
  themeColor: string;
  domain?: string;
}

interface TenantState {
  currentTenant: TenantContext | null;
  setCurrentTenant: (tenant: TenantContext | null) => void;
  simulateTenantSwitch: (tenantId: string) => void;
  resolveTenantFromDomain: () => Promise<void>;
  isLoadingTenant: boolean;
}

export const useTenant = create<TenantState>()(
  persist(
    (set) => ({
      currentTenant: {
        id: 'eduforge',
        name: 'EduForge SaaS',
        type: 'saas',
        plan: 'enterprise',
        isActive: true,
        themeColor: '#3b82f6',
      },
      isLoadingTenant: false,
      setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
      resolveTenantFromDomain: async () => {
        if (typeof window === 'undefined') return;
        
        const hostname = window.location.hostname;
        
        // Domaines principaux de la plateforme SaaS (ne pas réécrire le tenant)
        const mainDomains = ['localhost', '127.0.0.1', 'run.app'];
        const isMainDomain = mainDomains.some(d => hostname.includes(d));
        
        if (isMainDomain) {
          // On garde le tenant courant ou on repasse au saas principal
          return;
        }

        set({ isLoadingTenant: true });
        try {
          const tenantsRef = collection(db, 'tenants');
          const q = query(tenantsRef, where('domain', '==', hostname), limit(1));
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            set({ 
              currentTenant: { 
                id: snapshot.docs[0].id, 
                name: data.name || 'Tenant', 
                type: 'tenant', 
                plan: data.plan || 'basic', 
                isActive: true, 
                themeColor: data.theme?.primary || '#10b981',
                domain: data.domain
              } 
            });
          }
        } catch (e) {
          console.error("Failed to resolve tenant from domain", e);
        } finally {
          set({ isLoadingTenant: false });
        }
      },
      simulateTenantSwitch: (tenantId) => {
        if (tenantId === 'eduforge') {
          set({ currentTenant: { id: 'eduforge', name: 'EduForge SaaS', type: 'saas', plan: 'enterprise', isActive: true, themeColor: '#3b82f6' } });
        } else if (tenantId === 'mots_blocs') {
          set({ currentTenant: { id: 'mots_blocs', name: 'Mots & Blocs Québec', type: 'tenant', plan: 'premium', isActive: true, themeColor: '#10b981' } });
        } else if (tenantId === 'labo_test') {
          set({ currentTenant: { id: 'labo_test', name: 'Labo Pédagogique', type: 'tenant', plan: 'basic', isActive: true, themeColor: '#8b5cf6' } });
        }
      }
    }),
    {
      name: 'quebec-tenant',
    }
  )
);
