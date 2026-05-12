import { renderHook, act } from '@testing-library/react';
import { vi, it, expect, describe, beforeEach } from 'vitest';

const mockUpsert = vi.fn().mockResolvedValue({ error: null });
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: (_table: string) => ({ upsert: mockUpsert }),
  }),
}));

import { useArmorInventory } from './useArmorInventory';

describe('useArmorInventory', () => {
  beforeEach(() => mockUpsert.mockClear());

  it('initializes owned state from initial prop', () => {
    const { result } = renderHook(() =>
      useArmorInventory(null, { armor1: true, armor2: false })
    );
    expect(result.current.owned['armor1']).toBe(true);
    expect(result.current.owned['armor2']).toBe(false);
  });

  it('optimistically toggles false → true', async () => {
    const { result } = renderHook(() =>
      useArmorInventory(null, { armor1: false })
    );
    await act(async () => { await result.current.toggle('armor1'); });
    expect(result.current.owned['armor1']).toBe(true);
  });

  it('optimistically toggles true → false', async () => {
    const { result } = renderHook(() =>
      useArmorInventory(null, { armor1: true })
    );
    await act(async () => { await result.current.toggle('armor1'); });
    expect(result.current.owned['armor1']).toBe(false);
  });

  it('does not call supabase when userId is null', async () => {
    const { result } = renderHook(() => useArmorInventory(null, {}));
    await act(async () => { await result.current.toggle('armor1'); });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('calls supabase upsert with correct payload when userId provided', async () => {
    const { result } = renderHook(() =>
      useArmorInventory('user-123', { armor1: false })
    );
    await act(async () => { await result.current.toggle('armor1'); });
    expect(mockUpsert).toHaveBeenCalledWith(
      { user_id: 'user-123', armor_id: 'armor1', owned: true },
      { onConflict: 'user_id,armor_id' }
    );
  });

  it('setMany replaces the entire owned state', () => {
    const { result } = renderHook(() => useArmorInventory(null, {}));
    act(() => { result.current.setMany({ armor1: true, armor2: false }); });
    expect(result.current.owned['armor1']).toBe(true);
    expect(result.current.owned['armor2']).toBe(false);
  });

  it('rapid double-toggle produces correct DB calls (no stale closure)', async () => {
    const { result } = renderHook(() =>
      useArmorInventory('user-123', { armor1: false })
    );
    await act(async () => {
      result.current.toggle('armor1');
      result.current.toggle('armor1');
    });
    expect(mockUpsert).toHaveBeenCalledTimes(2);
    expect(mockUpsert).toHaveBeenNthCalledWith(1,
      { user_id: 'user-123', armor_id: 'armor1', owned: true },
      { onConflict: 'user_id,armor_id' }
    );
    expect(mockUpsert).toHaveBeenNthCalledWith(2,
      { user_id: 'user-123', armor_id: 'armor1', owned: false },
      { onConflict: 'user_id,armor_id' }
    );
    expect(result.current.owned['armor1']).toBe(false);
  });
});
