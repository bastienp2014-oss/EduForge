import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTenant } from './useTenant';

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
    vi.unstubAllGlobals();
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

  it('resolveTenantFromDomain : sur un domaine custom, appelle /api/tenant-public et met à jour le tenant', async () => {
    vi.stubGlobal('location', { hostname: 'academie-custom.example.com' });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'academie-custom',
        name: 'Académie Custom',
        plan: 'premium',
        domain: 'academie-custom.example.com',
        theme: { primary: '#123456' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await useTenant.getState().resolveTenantFromDomain();

    expect(fetchMock).toHaveBeenCalledWith('/api/tenant-public?domain=academie-custom.example.com');
    const tenant = useTenant.getState().currentTenant;
    expect(tenant?.id).toBe('academie-custom');
    expect(tenant?.name).toBe('Académie Custom');
    expect(tenant?.type).toBe('tenant');
    expect(tenant?.themeColor).toBe('#123456');
  });

  it('resolveTenantFromDomain : ne fait aucun appel réseau sur un domaine principal (localhost)', async () => {
    vi.stubGlobal('location', { hostname: 'localhost' });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await useTenant.getState().resolveTenantFromDomain();

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
