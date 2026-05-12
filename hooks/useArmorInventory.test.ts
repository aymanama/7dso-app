import { renderHook, act } from '@testing-library/react';
import { vi, it, expect, describe, beforeEach } from 'vitest';

const mockFetch = vi.fn().mockResolvedValue({ ok: true });
vi.stubGlobal('fetch', mockFetch);

import { useArmorInventory } from './useArmorInventory';

describe('useArmorInventory', () => {
  beforeEach(() => mockFetch.mockClear());

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

  it('does not call API when userId is null', async () => {
    const { result } = renderHook(() => useArmorInventory(null, {}));
    await act(async () => { await result.current.toggle('armor1'); });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('calls PATCH /api/inventory?type=armor with correct payload when userId provided', async () => {
    const { result } = renderHook(() =>
      useArmorInventory('user-123', { armor1: false })
    );
    await act(async () => { await result.current.toggle('armor1'); });
    expect(mockFetch).toHaveBeenCalledWith('/api/inventory?type=armor', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user-123', itemId: 'armor1', owned: true }),
    });
  });

  it('setMany replaces the entire owned state', () => {
    const { result } = renderHook(() => useArmorInventory(null, {}));
    act(() => { result.current.setMany({ armor1: true, armor2: false }); });
    expect(result.current.owned['armor1']).toBe(true);
    expect(result.current.owned['armor2']).toBe(false);
  });

  it('rapid double-toggle produces correct API calls (no stale closure)', async () => {
    const { result } = renderHook(() =>
      useArmorInventory('user-123', { armor1: false })
    );
    await act(async () => {
      result.current.toggle('armor1');
      result.current.toggle('armor1');
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/inventory?type=armor', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user-123', itemId: 'armor1', owned: true }),
    });
    expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/inventory?type=armor', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user-123', itemId: 'armor1', owned: false }),
    });
    expect(result.current.owned['armor1']).toBe(false);
  });
});
