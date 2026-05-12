'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Returns the authenticated userId string, null while loading, or '' if auth fails.
// '' is falsy, so all `if (!userId)` write-guards still work correctly.
// Pages that check `userId === null` can use it as a "still loading" signal.
export function useAnonymousAuth() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session) { setUserId(session.user.id); return; }
        return supabase.auth.signInAnonymously().then(({ data, error }) => {
          setUserId(error ? '' : (data.user?.id ?? ''));
        });
      })
      .catch(() => setUserId(''));
  }, []);

  return userId;
}
