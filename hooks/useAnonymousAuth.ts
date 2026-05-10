'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useAnonymousAuth() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id);
        return;
      }
      supabase.auth.signInAnonymously().then(({ data }) => {
        setUserId(data.user?.id ?? null);
      });
    });
  }, []);

  return userId;
}
