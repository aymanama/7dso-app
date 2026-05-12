import { renderHook, act } from '@testing-library/react';
import { vi, it, expect, describe, beforeEach } from 'vitest';

const mockUpsert = vi.fn().mockResolvedValue({ error: null });
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: (_table: string) => ({ upsert: mockUpsert }),
  }),
}));

import { useRoster } from './useRoster';

describe('useRoster', () => {
  beforeEach(() => mockUpsert.mockClear());

  it('initializes from initial prop', () => {
    const { result } = renderHook(() => useRoster(null, { escanor: true }));
    expect(result.current.owned['escanor']).toBe(true);
  });

  it('optimistically toggles false → true', async () => {
    const { result } = renderHook(() => useRoster(null, { escanor: false }));
    await act(async () => { await result.current.toggle('escanor'); });
    expect(result.current.owned['escanor']).toBe(true);
  });

  it('optimistically toggles true → false', async () => {
    const { result } = renderHook(() => useRoster(null, { escanor: true }));
    await act(async () => { await result.current.toggle('escanor'); });
    expect(result.current.owned['escanor']).toBe(false);
  });

  it('does not call supabase when userId is null', async () => {
    const { result } = renderHook(() => useRoster(null, {}));
    await act(async () => { await result.current.toggle('escanor'); });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('calls supabase upsert with correct payload', async () => {
    const { result } = renderHook(() => useRoster('user-789', { escanor: false }));
    await act(async () => { await result.current.toggle('escanor'); });
    expect(mockUpsert).toHaveBeenCalledWith(
      { user_id: 'user-789', character_id: 'escanor', owned: true },
      { onConflict: 'user_id,character_id' }
    );
  });

  it('rapid double-toggle produces correct DB calls', async () => {
    const { result } = renderHook(() => useRoster('user-789', { escanor: false }));
    await act(async () => {
      result.current.toggle('escanor');
      result.current.toggle('escanor');
    });
    expect(mockUpsert).toHaveBeenCalledTimes(2);
    expect(mockUpsert).toHaveBeenNthCalledWith(1,
      { user_id: 'user-789', character_id: 'escanor', owned: true },
      { onConflict: 'user_id,character_id' }
    );
    expect(mockUpsert).toHaveBeenNthCalledWith(2,
      { user_id: 'user-789', character_id: 'escanor', owned: false },
      { onConflict: 'user_id,character_id' }
    );
  });

  it('setMany replaces entire owned state', () => {
    const { result } = renderHook(() => useRoster(null, {}));
    act(() => { result.current.setMany({ escanor: true, meliodas: false }); });
    expect(result.current.owned['escanor']).toBe(true);
    expect(result.current.owned['meliodas']).toBe(false);
  });
});
