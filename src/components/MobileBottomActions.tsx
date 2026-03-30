import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import EligibilityDialog from "./EligibilityDialog";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { LogOut, ArrowRight, User as UserIcon, Leaf, LayoutDashboard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useShop } from "@/context/ShopContext";

interface MobileBottomActionsProps {
  menuOpen?: boolean;
}

const MobileBottomActions = ({ menuOpen = false }: MobileBottomActionsProps) => {
  const [eligibilityDialogOpen, setEligibilityDialogOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation('common');
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { isEligible, drGreenClient } = useShop();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: t('nav.signOut'),
      description: "You have been successfully signed out.",
    });
    navigate("/");
  };

  return (
    <>
      {/* Fixed Bottom Action Bar - Premium Pharmaceutical Design */}
      <AnimatePresence>
        {!menuOpen && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
            className="lg:hidden fixed bottom-0 left-0 right-0 z-[60]"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 12px)' }}
          >
            {/* Premium Pharmaceutical Container */}
            <div className="mx-4 mb-3">
              <div className={cn(
                "rounded-3xl overflow-hidden backdrop-blur-xl",
                isDark 
                  ? "bg-[hsl(180,8%,10%)]/98 border border-white/20 shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                  : "bg-gradient-to-r from-[hsl(var(--pharma-teal-dark))] via-[hsl(178,48%,21%)] to-[hsl(var(--pharma-teal-dark))] border border-white/10 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.15),inset_0_1px_0_0_rgba(255,255,255,0.1)]"
              )}>
                {/* Subtle top accent line */}
                <div className={cn(
                  "h-[1px] bg-gradient-to-r from-transparent to-transparent",
                  isDark ? "via-emerald-400/60" : "via-emerald-400/40"
                )} />
                
                <div className="px-5 py-4">
                  <div className="flex gap-3">
                    {/* State-aware CTAs */}
                    {user && isEligible ? (
                      <>
                        {/* Verified patient: Browse Strains + Dashboard */}
                        <Link
                          to="/shop"
                          className={cn(
                            "flex-[1.2] group relative overflow-hidden",
                            "font-jakarta font-semibold px-6 py-4 rounded-2xl",
                            "text-white min-h-[56px] flex items-center justify-center gap-2.5 touch-manipulation",
                            "transition-all duration-300 ease-out active:scale-[0.97]",
                            isDark
                              ? "bg-gradient-to-r from-teal-700 via-teal-600 to-teal-700 shadow-[0_4px_20px_-4px_rgba(13,148,136,0.3)]"
                              : "bg-gradient-to-r from-[hsl(178,48%,28%)] via-[hsl(175,42%,35%)] to-[hsl(178,48%,28%)] shadow-[0_4px_16px_-4px_rgba(13,148,136,0.35)]"
                          )}
                        >
                          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-active:translate-x-full transition-transform duration-500" />
                          <Leaf className="relative w-4 h-4" />
                          <span className="relative tracking-wide text-[15px] drop-shadow-sm">
                            Browse Strains
                          </span>
                        </Link>
                        <Link
                          to="/dashboard"
                          className={cn(
                            "flex-1 group relative overflow-hidden",
                            "font-jakarta font-medium px-5 py-4 rounded-2xl backdrop-blur-sm",
                            "transition-all duration-300 ease-out active:scale-[0.97]",
                            "min-h-[56px] flex items-center justify-center gap-2 touch-manipulation",
                            isDark
                              ? "bg-white/10 text-white/95 border border-white/25 active:bg-white/15"
                              : "bg-white/8 text-white/90 hover:text-white border border-white/15 active:bg-white/12"
                          )}
                        >
                          <LayoutDashboard className="w-4 h-4 opacity-80" />
                          <span className="tracking-wide text-[14px]">Dashboard</span>
                        </Link>
                      </>
                    ) : user && drGreenClient ? (
                      <>
                        {/* Logged in, pending verification: Browse Strains + Sign Out */}
                        <Link
                          to="/shop"
                          className={cn(
                            "flex-[1.2] group relative overflow-hidden",
                            "font-jakarta font-semibold px-6 py-4 rounded-2xl",
                            "text-white min-h-[56px] flex items-center justify-center gap-2.5 touch-manipulation",
                            "transition-all duration-300 ease-out active:scale-[0.97]",
                            isDark
                              ? "bg-gradient-to-r from-teal-700 via-teal-600 to-teal-700 shadow-[0_4px_20px_-4px_rgba(13,148,136,0.3)]"
                              : "bg-gradient-to-r from-[hsl(178,48%,28%)] via-[hsl(175,42%,35%)] to-[hsl(178,48%,28%)] shadow-[0_4px_16px_-4px_rgba(13,148,136,0.35)]"
                          )}
                        >
                          <Leaf className="relative w-4 h-4" />
                          <span className="relative tracking-wide text-[15px] drop-shadow-sm">
                            Browse Strains
                          </span>
                        </Link>
                        <button 
                          type="button"
                          onClick={handleLogout}
                          className={cn(
                            "flex-1 group relative overflow-hidden",
                            "font-jakarta font-medium px-5 py-4 rounded-2xl backdrop-blur-sm",
                            "transition-all duration-300 ease-out active:scale-[0.97]",
                            "min-h-[56px] flex items-center justify-center gap-2 touch-manipulation",
                            isDark
                              ? "bg-white/10 text-white/95 border border-white/25 active:bg-white/15"
                              : "bg-white/8 text-white/90 hover:text-white border border-white/15 active:bg-white/12"
                          )}
                        >
                          <LogOut className="w-4 h-4 opacity-80" />
                          <span className="tracking-wide text-[14px]">{t('nav.signOut')}</span>
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Visitor: Check Eligibility + Login */}
                        <button 
                          type="button"
                          onClick={() => setEligibilityDialogOpen(true)}
                          className={cn(
                            "flex-[1.2] group relative overflow-hidden",
                            "font-jakarta font-semibold px-6 py-4 rounded-2xl",
                            "text-white min-h-[56px] flex items-center justify-center gap-2.5 touch-manipulation",
                            "transition-all duration-300 ease-out active:scale-[0.97]",
                            isDark
                              ? "bg-gradient-to-r from-teal-700 via-teal-600 to-teal-700 shadow-[0_4px_20px_-4px_rgba(13,148,136,0.3),inset_0_1px_0_0_rgba(255,255,255,0.15)] active:shadow-[0_2px_12px_-2px_rgba(13,148,136,0.25)]"
                              : "bg-gradient-to-r from-[hsl(178,48%,28%)] via-[hsl(175,42%,35%)] to-[hsl(178,48%,28%)] shadow-[0_4px_16px_-4px_rgba(13,148,136,0.35),inset_0_1px_0_0_rgba(255,255,255,0.2)] active:shadow-[0_2px_10px_-2px_rgba(13,148,136,0.3)]"
                          )}
                        >
                          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-active:translate-x-full transition-transform duration-500" />
                          <span className="relative tracking-wide text-[15px] drop-shadow-sm">
                            {t('nav.checkEligibility')}
                          </span>
                          <ArrowRight className="relative w-4 h-4 transition-transform duration-300 group-active:translate-x-1" />
                        </button>
                        
                        {user ? (
                          <button 
                            type="button"
                            onClick={handleLogout}
                            className={cn(
                              "flex-1 group relative overflow-hidden",
                              "font-jakarta font-medium px-5 py-4 rounded-2xl backdrop-blur-sm",
                              "transition-all duration-300 ease-out active:scale-[0.97]",
                              "min-h-[56px] flex items-center justify-center gap-2 touch-manipulation",
                              isDark
                                ? "bg-white/10 text-white/95 border border-white/25 hover:border-white/35 active:bg-white/15"
                                : "bg-white/8 text-white/90 hover:text-white border border-white/15 hover:border-white/25 active:bg-white/12"
                            )}
                          >
                            <LogOut className="w-4 h-4 opacity-80 group-hover:opacity-100 transition-opacity" />
                            <span className="tracking-wide text-[14px]">{t('nav.signOut')}</span>
                          </button>
                        ) : (
                          <Link 
                            to="/auth"
                            className={cn(
                              "flex-1 group relative overflow-hidden",
                              "font-jakarta font-medium px-5 py-4 rounded-2xl backdrop-blur-sm",
                              "transition-all duration-300 ease-out active:scale-[0.97]",
                              "min-h-[56px] flex items-center justify-center gap-2 touch-manipulation",
                              isDark
                                ? "bg-white/10 text-white/95 border border-white/25 hover:border-amber-400/40 active:bg-white/15"
                                : "bg-white/8 text-white/90 hover:text-white border border-white/15 hover:border-amber-400/30 active:bg-white/12"
                            )}
                          >
                            <span className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-400/10 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <UserIcon className="relative w-4 h-4 opacity-80 group-hover:opacity-100 transition-opacity" />
                            <span className="relative tracking-wide text-[14px]">{t('nav.patientLogin')}</span>
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Eligibility Dialog */}
      <EligibilityDialog open={eligibilityDialogOpen} onOpenChange={setEligibilityDialogOpen} />
    </>
  );
};

export default MobileBottomActions;
