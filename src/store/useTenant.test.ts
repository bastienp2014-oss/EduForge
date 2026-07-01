import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTenant } from './useTenant';

// Mock Firebase module
vi.mock('../services/firebase', () => {
  return {
    db: {},
    auth: {}
  };
});

// Mock Firestore functions
vi.mock('firebase/firestore', () => {
  return {
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn(),
    limit: vi.fn()
  };
});

describe('useTenant Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useTenant.setState({
      currentTenant: {
        id: 'eduforge',
        name: 'EduForge SaaS',
        type: 'saas',
        plan: 'enterprise',
        isActive: true,
        themeColor: '#3b82f6',
      },
      isLoadingTenant: false
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('définit le tenant par défaut (saas)', () => {
    const state = useTenant.getState();
    expect(state.currentTenant?.id).toBe('eduforge');
    expect(state.currentTenant?.type).toBe('saas');
  });

  it('peut mettre à jour manuellement le tenant via setCurrentTenant', () => {
    const newTenant = {
      id: 'custom_tenant',
      name: 'Custom',
      type: 'tenant' as const,
      plan: 'premium' as const,
      isActive: true,
      themeColor: '#000000',
    };

    useTenant.getState().setCurrentTenant(newTenant);
    expect(useTenant.getState().currentTenant).toEqual(newTenant);
  });

  it('simule le switch de tenant correctement', () => {
    useTenant.getState().simulateTenantSwitch('mots_blocs');
    expect(useTenant.getState().currentTenant?.id).toBe('mots_blocs');
    expect(useTenant.getState().currentTenant?.name).toBe('Mots & Blocs Québec');
    
    useTenant.getState().simulateTenantSwitch('labo_test');
    expect(useTenant.getState().currentTenant?.id).toBe('labo_test');
    
    useTenant.getState().simulateTenantSwitch('eduforge');
    expect(useTenant.getState().currentTenant?.id).toBe('eduforge');
  });
});
