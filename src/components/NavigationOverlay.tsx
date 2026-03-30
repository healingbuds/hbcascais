/**
 * NavigationOverlay Component
 * 
 * Fully responsive mobile navigation drawer with glassmorphism.
 * Flex layout ensures action buttons are always visible, even on iPhone SE.
 */

import { Link, useLocation } from "react-router-dom";
import { X, LogOut, LayoutDashboard, User, FileText, ClipboardCheck, Leaf, HeadphonesIcon, Home, Shield, Newspaper } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useTranslation } from "react-i18next";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useUserRole } from "@/hooks/useUserRole";
import { useShop } from "@/context/ShopContext";
import hbLogoWhite from "@/assets/hb-logo-white-full.png";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";

interface NavigationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  user: SupabaseUser | null;
  onLogout: () => void;
  onEligibilityClick: () => void;
  scrolled: boolean;
}

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/research", label: "Research", icon: FileText },
  { to: "/the-wire", label: "The Wire", icon: Newspaper },
  { to: "/eligibility", label: "Eligibility", icon: ClipboardCheck },
  { to: "/shop", label: "Strains", icon: Leaf },
  { to: "/support", label: "Support", icon: HeadphonesIcon },
];

const itemVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 400, damping: 25 },
  },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.08 },
  },
};

const NavigationOverlay = ({
  isOpen,
  onClose,
  user,
  onLogout,
  onEligibilityClick,
}: NavigationOverlayProps) => {
  const location = useLocation();
  const { t } = useTranslation('common');
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const { isEligible, drGreenClient } = useShop();

  const shouldHideEligibilityCTA = isAdmin || isEligible || !!drGreenClient;
  const focusTrapRef = useFocusTrap(isOpen);

  const isActive = (path: string) => location.pathname === path;
  const isShopActive = location.pathname === '/shop' || location.pathname.startsWith('/shop/');
  const isAdminActive = location.pathname.startsWith('/admin');

  // Lock body scroll
  useEffect(() => {
    const scrollY = window.scrollY;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.touchAction = 'none';
      document.documentElement.style.overflow = 'hidden';
    } else {
      const savedScrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.top = '';
      document.body.style.touchAction = '';
      document.documentElement.style.overflow = '';
      if (savedScrollY) {
        window.scrollTo(0, parseInt(savedScrollY || '0') * -1);
      }
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.top = '';
      document.body.style.touchAction = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleEligibility = () => { onEligibilityClick(); onClose(); };
  const handleLogout = () => { onLogout(); onClose(); };

  const activeItems = navItems.map((item) => ({
    ...item,
    active: item.to === '/shop' ? isShopActive
      : item.to === '/the-wire' ? (isActive('/the-wire') || location.pathname.startsWith('/the-wire/'))
      : isActive(item.to),
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="xl:hidden fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            ref={focusTrapRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="xl:hidden fixed top-0 right-0 bottom-0 w-[82%] max-w-[360px] z-[9999] flex flex-col"
            style={{
              background: 'rgba(6, 44, 35, 0.92)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '-8px 0 40px rgba(0, 0, 0, 0.4)',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* ── Header (fixed height) ── */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/15">
              <Link
                to="/"
                onClick={onClose}
                className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-lg"
              >
                <img src={hbLogoWhite} alt="Healing Buds" className="h-9 w-auto object-contain" />
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 rounded-lg bg-white/8 hover:bg-white/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]/50"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* ── Scrollable nav links (takes remaining space) ── */}
            <div className="flex-1 min-h-0 overflow-y-auto px-3 py-4">
              <motion.nav
                className="flex flex-col gap-0.5"
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
              >
                {activeItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.div key={item.to} variants={itemVariants}>
                      <Link
                        to={item.to}
                        className={cn(
                          "flex items-center gap-3.5 px-4 py-3 rounded-xl text-[15px] transition-all duration-200",
                          "touch-manipulation min-h-[48px] active:scale-[0.98]",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]/50",
                          item.active
                            ? "text-white font-semibold bg-white/12 border-l-[3px] border-[hsl(var(--primary))] shadow-[inset_0_0_12px_rgba(234,179,8,0.06)]"
                            : "text-white/80 hover:text-white hover:bg-white/8"
                        )}
                        onClick={onClose}
                      >
                        <Icon className={cn("w-5 h-5 flex-shrink-0", item.active ? "text-[hsl(var(--primary))]" : "text-white/50")} />
                        {item.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.nav>

              {/* Portal link for logged-in users */}
              {user && (
                <div className="mt-4 px-1">
                  <div className="h-px bg-white/10 mb-3" />
                  {/* User greeting */}
                  <div className="px-3 mb-3">
                    <p className="text-white/50 text-[11px] uppercase tracking-wider">Signed in as</p>
                    <p className="text-white font-medium text-sm truncate">
                      {drGreenClient?.full_name || user.email?.split('@')[0] || 'Patient'}
                    </p>
                  </div>
                  {isAdmin && !roleLoading ? (
                    <Link
                      to="/admin"
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3.5 px-4 py-3 rounded-xl text-[15px] transition-all duration-200",
                        "touch-manipulation min-h-[48px] active:scale-[0.98]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]/50",
                        isAdminActive
                          ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-semibold"
                          : "bg-white/8 text-white hover:bg-white/12 border border-white/10"
                      )}
                    >
                      <Shield className={cn("w-5 h-5", isAdminActive ? "text-[hsl(var(--primary-foreground))]" : "text-[hsl(var(--primary))]")} />
                      <span className="font-medium">Admin Portal</span>
                    </Link>
                  ) : (
                    <Link
                      to="/dashboard"
                      onClick={onClose}
                      className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-[15px] transition-all duration-200 touch-manipulation min-h-[48px] active:scale-[0.98] bg-white/8 text-white hover:bg-white/12 border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]/50"
                    >
                      <LayoutDashboard className="w-5 h-5 text-[hsl(var(--primary))]" />
                      <span className="font-medium">Patient Portal</span>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* ── Bottom pinned section (never cut off) ── */}
            <div
              className="flex-shrink-0 border-t border-white/15 px-4 pt-3 pb-3 space-y-2"
              style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
            >
              {user ? (
                <button
                  onClick={handleLogout}
                  className={cn(
                    "w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm transition-all duration-200",
                    "touch-manipulation min-h-[44px] active:scale-[0.97]",
                    "bg-white/8 text-white/90 hover:bg-white/15 border border-white/10",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  )}
                >
                  <LogOut className="w-4 h-4 text-white/60" />
                  Sign Out
                </button>
              ) : (
                <>
                  {!shouldHideEligibilityCTA && (
                    <button
                      onClick={handleEligibility}
                      className={cn(
                        "w-full flex items-center justify-center gap-2.5 rounded-xl transition-all duration-200",
                        "touch-manipulation active:scale-[0.97]",
                        "bg-white text-[hsl(178,48%,16%)] font-bold",
                        "shadow-lg shadow-white/10",
                        "hover:bg-white/95 hover:shadow-xl hover:shadow-white/15",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#062C23]",
                        "py-3.5 px-5 text-base min-h-[48px]",
                        "max-[667px]:py-2.5 max-[667px]:text-sm max-[667px]:min-h-[40px]"
                      )}
                    >
                      Check Eligibility
                    </button>
                  )}
                  <Link
                    to="/auth"
                    onClick={onClose}
                    className={cn(
                      "flex items-center justify-center gap-2.5 rounded-xl transition-all duration-200",
                      "touch-manipulation active:scale-[0.97]",
                      "text-[hsl(var(--primary))] font-semibold border-2 border-[hsl(var(--primary))]/50",
                      "bg-[hsl(var(--primary))]/10 hover:bg-[hsl(var(--primary))]/20 hover:border-[hsl(var(--primary))]/80",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#062C23]",
                      "py-3.5 px-5 text-base min-h-[48px]",
                      "max-[667px]:py-2.5 max-[667px]:text-sm max-[667px]:min-h-[40px]"
                    )}
                  >
                    <User className="w-5 h-5 max-[667px]:w-4 max-[667px]:h-4" />
                    Patient Login
                  </Link>
                </>
              )}

              {/* Settings row */}
              <div className="flex items-center justify-between gap-3 pt-1 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-white/40 text-xs">Language:</span>
                  <LanguageSwitcher />
                </div>
                <ThemeToggle />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NavigationOverlay;
