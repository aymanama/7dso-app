import { renderHook, act } from '@testing-library/react';
import { vi, it, expect, describe, beforeEach } from 'vitest';

const mockFetch = vi.fn().mockResolvedValue({ ok: true });
vi.stubGlobal('fetch', mockFetch);

import { useWeaponInventory } from './useWeaponInventory';

describe('useWeaponInventory', () => {
  beforeEach(() => mockFetch.mockClear());

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

  it('does not call API when userId is null', async () => {
    const { result } = renderHook(() => useWeaponInventory(null, {}));
    await act(async () => { await result.current.toggle('wpn1'); });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('calls PATCH /api/inventory?type=weapon with correct payload when userId provided', async () => {
    const { result } = renderHook(() =>
      useWeaponInventory('user-456', { wpn1: false })
    );
    await act(async () => { await result.current.toggle('wpn1'); });
    expect(mockFetch).toHaveBeenCalledWith('/api/inventory?type=weapon', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user-456', itemId: 'wpn1', owned: true }),
    });
  });

  it('setMany replaces the entire owned state', () => {
    const { result } = renderHook(() => useWeaponInventory(null, {}));
    act(() => { result.current.setMany({ wpn1: true, wpn2: false }); });
    expect(result.current.owned['wpn1']).toBe(true);
    expect(result.current.owned['wpn2']).toBe(false);
  });

  it('rapid double-toggle produces correct API calls (no stale closure)', async () => {
    const { result } = renderHook(() =>
      useWeaponInventory('user-456', { wpn1: false })
    );
    await act(async () => {
      result.current.toggle('wpn1');
      result.current.toggle('wpn1');
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/inventory?type=weapon', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user-456', itemId: 'wpn1', owned: true }),
    });
    expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/inventory?type=weapon', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user-456', itemId: 'wpn1', owned: false }),
    });
    expect(result.current.owned['wpn1']).toBe(false);
  });
});
