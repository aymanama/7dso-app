import { renderHook, act } from '@testing-library/react';
import { vi, it, expect, describe, beforeEach } from 'vitest';

const mockUpsert = vi.fn().mockResolvedValue({ error: null });
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: (_table: string) => ({ upsert: mockUpsert }),
  }),
}));

import { useWeaponInventory } from './useWeaponInventory';

describe('useWeaponInventory', () => {
  beforeEach(() => mockUpsert.mockClear());

  it('initializes owned state from initial prop', () => {
    const { result } = renderHook(() =>
      useWeaponInventory(null, { wpn1: true })
    );
    expect(result.current.owned['wpn1']).toBe(true);
  });

  it('optimistically toggles false → true', async () => {
    const { result } = renderHook(() =>
      useWeaponInventory(null, { wpn1: false })
    );
    await act(async () => { await result.current.toggle('wpn1'); });
    expect(result.current.owned['wpn1']).toBe(true);
  });

  it('optimistically toggles true → false', async () => {
    const { result } = renderHook(() =>
      useWeaponInventory(null, { wpn1: true })
    );
    await act(async () => { await result.current.toggle('wpn1'); });
    expect(result.current.owned['wpn1']).toBe(false);
  });

  it('does not call supabase when userId is null', async () => {
    const { result } = renderHook(() => useWeaponInventory(null, {}));
    await act(async () => { await result.current.toggle('wpn1'); });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('calls supabase upsert with correct payload when userId provided', async () => {
    const { result } = renderHook(() =>
      useWeaponInventory('user-456', { wpn1: false })
    );
    await act(async () => { await result.current.toggle('wpn1'); });
    expect(mockUpsert).toHaveBeenCalledWith(
      { user_id: 'user-456', weapon_id: 'wpn1', owned: true },
      { onConflict: 'user_id,weapon_id' }
    );
  });

  it('setMany replaces the entire owned state', () => {
    const { result } = renderHook(() => useWeaponInventory(null, {}));
    act(() => { result.current.setMany({ wpn1: true, wpn2: false }); });
    expect(result.current.owned['wpn1']).toBe(true);
    expect(result.current.owned['wpn2']).toBe(false);
  });
});
