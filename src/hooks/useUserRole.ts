/**
 * useUserRole Hook
 * 
 * Detects user roles from the database and provides role-based state.
 * Simple model: admin (NFT holders) and user (patients).
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export type AppRole = 'admin' | 'moderator' | 'user';

interface UserRoleState {
  user: User | null;
  /** True if user has admin access (NFT-verified wallet holder) */
  isAdmin: boolean;
  isModerator: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useUserRole = (): UserRoleState => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkRoles = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setIsAdmin(false);
      setIsModerator(false);
      setIsLoading(false);
      return;
    }

    try {
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id);

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        setError(rolesError.message);
        setIsLoading(false);
        return;
      }

      const roleNames = (roles || []).map(r => r.role as string);
      
      const hasAdmin = roleNames.includes('admin');
      const hasModerator = roleNames.includes('moderator');

      setIsAdmin(hasAdmin);
      setIsModerator(hasModerator);
    } catch (err) {
      console.error('Error checking roles:', err);
      setError(err instanceof Error ? err.message : 'Failed to check roles');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    await checkRoles(user);
  }, [user, checkRoles]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          setTimeout(() => {
            checkRoles(currentUser);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsModerator(false);
          setIsLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      checkRoles(currentUser);
    });

    return () => subscription.unsubscribe();
  }, [checkRoles]);

  return {
    user,
    isAdmin,
    isModerator,
    isLoading,
    error,
    refetch
  };
};

export default useUserRole;
