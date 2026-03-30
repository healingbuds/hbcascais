/**
 * Header Component - Pharmaceutical-Grade Design
 * 
 * Premium, trustworthy navbar with theme-aware styling.
 * Role-aware: Shows Admin Portal for admins, Patient Portal for patients.
 * Light mode: teal/dark text on light background
 * Dark mode: white text on dark background
 */

import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, LayoutDashboard, User, Shield, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { motion, useScroll, useSpring } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { useTenant } from "@/hooks/useTenant";
import { useUserRole } from "@/hooks/useUserRole";
import { useShop } from "@/context/ShopContext";

import EligibilityDialog from "@/components/EligibilityDialog";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import NavigationMenu from "@/components/NavigationMenu";
import NavigationOverlay from "@/components/NavigationOverlay";
import AnimatedMenuButton from "@/components/AnimatedMenuButton";

import { KYCStatusBadge } from "@/components/KYCStatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onMenuStateChange?: (isOpen: boolean) => void;
}

const Header = ({ onMenuStateChange }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [eligibilityDialogOpen, setEligibilityDialogOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation('common');
  const { resolvedTheme } = useTheme();
  const { tenant } = useTenant();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const { isEligible, drGreenClient, isLoading: shopLoading } = useShop();
  const headerRef = useRef<HTMLElement>(null);
  
  const isDark = resolvedTheme === 'dark';
  
  
  // Logo switches based on scroll: white when solid teal BG, teal when scrolled/faded
  const logoSrc = scrolled ? tenant.logo.light : tenant.logo.dark;
  
  // Scroll progress tracking
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auth state management
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

  // Notify parent of menu state changes
  useEffect(() => {
    onMenuStateChange?.(mobileMenuOpen);
  }, [mobileMenuOpen, onMenuStateChange]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    setMobileMenuOpen(false);
    navigate("/");
  };

  // Determine portal link based on role
  const portalLink = isAdmin && !roleLoading ? "/admin" : "/dashboard";
  const portalLabel = isAdmin && !roleLoading ? "Admin" : "Portal";
  const PortalIcon = isAdmin && !roleLoading ? Shield : LayoutDashboard;

  // Hide eligibility CTA for: admins (including while loading), verified clients, or clients with pending registration
  const shouldHideEligibilityCTA = isAdmin || roleLoading || isEligible || !!drGreenClient;
  
  // Truncate email for display
  const userEmail = user?.email || '';
  const truncatedEmail = userEmail.length > 18 ? userEmail.substring(0, 15) + '...' : userEmail;

  return (
    <>
      {/* Scroll Progress Bar */}
      <div className={cn(
        "fixed top-0 left-0 right-0 h-0.5 z-[100]",
        isDark ? "bg-white/10" : "bg-black/10"
      )}>
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 origin-left"
          style={{ scaleX }}
        />
      </div>

      {/* Main Header - Theme Aware */}
      <header 
        ref={headerRef}
        className={cn(
          "fixed top-0 left-0 right-0 z-50",
          "transition-all duration-500 ease-out"
        )}
      >
        {/* Navbar Background - Unified Teal Green for Both Modes */}
        <div 
          className={cn(
            "transition-all duration-500",
            scrolled 
              ? "bg-[#1A2E2A]/98 backdrop-blur-xl shadow-2xl shadow-black/30" 
              : "bg-[#1A2E2A]"
          )}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Main Navigation Row */}
            <div className={cn(
              "flex items-center justify-between",
              "transition-all duration-500 ease-out",
              scrolled ? "h-16" : "h-20"
            )}>
              
              {/* Logo - Far Left with Crossfade Transition */}
              <Link 
                to="/" 
                className="flex items-center flex-shrink-0 group relative"
              >
                {/* White logo (visible when not scrolled) */}
                <img 
                  src={tenant.logo.dark} 
                  alt={tenant.name}
                  className={cn(
                    "w-auto object-contain transition-all duration-500 ease-out group-hover:opacity-90",
                    scrolled ? "h-9 sm:h-10 opacity-0" : "h-11 sm:h-12 opacity-100"
                  )}
                />
                {/* Teal logo (visible when scrolled) - absolute positioned for crossfade */}
                <img 
                  src={tenant.logo.light} 
                  alt={tenant.name}
                  className={cn(
                    "w-auto object-contain transition-all duration-500 ease-out group-hover:opacity-90 absolute left-0",
                    scrolled ? "h-9 sm:h-10 opacity-100" : "h-11 sm:h-12 opacity-0"
                  )}
                />
              </Link>
              
            
              {/* Center Navigation - Desktop */}
              <NavigationMenu scrolled={scrolled} isDark={isDark} />
              
              {/* Right Actions - Desktop */}
              <div className="hidden xl:flex items-center gap-2 flex-shrink-0">
                <LanguageSwitcher scrolled={scrolled} />
                <ThemeToggle isDark={isDark} />


                {/* KYC Status Badge - only for non-admin logged-in users */}
                {user && !isAdmin && !roleLoading && <KYCStatusBadge />}

                {/* Check Eligibility CTA */}
                {!shouldHideEligibilityCTA && (
                  <button
                    onClick={() => setEligibilityDialogOpen(true)}
                    className={cn(
                      "font-semibold px-5 py-2.5 rounded-lg transition-all duration-300",
                      "bg-emerald-500 text-white hover:bg-emerald-400",
                      "shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/50",
                      "text-sm whitespace-nowrap hover:scale-[1.02] active:scale-[0.98]"
                    )}
                  >
                    {t('nav.checkEligibility')}
                  </button>
                )}

                {/* Account Dropdown - Unified for admin and patient */}
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          "font-medium px-3 py-2 rounded-lg transition-all duration-300",
                          "text-sm flex items-center gap-2",
                          isAdmin && !roleLoading
                            ? "bg-white/15 text-white hover:bg-white/25 border border-[#EAB308]/40"
                            : "bg-white/10 text-white hover:bg-white/20 border border-white/20 hover:border-[#EAB308]/50"
                        )}
                      >
                        <PortalIcon className="w-4 h-4" />
                        <span className="max-w-[120px] truncate text-xs">{truncatedEmail}</span>
                        <ChevronDown className="w-3 h-3 opacity-60" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 bg-popover border-border shadow-xl z-[100]">
                      <DropdownMenuLabel className="flex flex-col gap-1 pb-2">
                        <span className="text-sm font-medium text-foreground truncate">{userEmail}</span>
                        <span className={cn(
                          "text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full w-fit",
                          isAdmin && !roleLoading
                            ? "bg-[#EAB308]/20 text-[#EAB308]"
                            : "bg-emerald-500/20 text-emerald-400"
                        )}>
                          {isAdmin && !roleLoading ? 'Admin' : 'Patient'}
                        </span>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {isAdmin && !roleLoading && (
                        <DropdownMenuItem
                          onClick={() => navigate('/admin')}
                          className="cursor-pointer gap-2"
                        >
                          <Shield className="w-4 h-4" />
                          Admin Portal
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => navigate('/dashboard')}
                        className="cursor-pointer gap-2"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        {isAdmin && !roleLoading ? 'Patient Dashboard' : 'Dashboard'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('nav.signOut')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <button
                    onClick={() => navigate('/auth')}
                    className={cn(
                      "font-medium px-4 py-2.5 rounded-lg transition-all duration-300",
                      "bg-white/10 text-white hover:bg-white/20 border border-white/20",
                      "text-sm flex items-center gap-2"
                    )}
                  >
                    <User className="w-4 h-4" />
                    Patient Login
                  </button>
                )}
              </div>

              {/* Mobile Menu Button - EXTREME RIGHT */}
              <div className="xl:hidden flex items-center gap-2">
                <ThemeToggle isDark={isDark} />
                <AnimatedMenuButton
                  isOpen={mobileMenuOpen}
                  onClick={() => setMobileMenuOpen(prev => !prev)}
                  className="ml-auto"
                  isDark={isDark}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Separator Line - Consistent Gold Accent */}
        <div className="h-[2px] shadow-sm bg-[#EAB308]/60" />
      </header>

      {/* Mobile Navigation Overlay */}
      <NavigationOverlay
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        user={user}
        onLogout={handleLogout}
        onEligibilityClick={() => setEligibilityDialogOpen(true)}
        scrolled={scrolled}
      />

      {/* Eligibility Dialog */}
      <EligibilityDialog open={eligibilityDialogOpen} onOpenChange={setEligibilityDialogOpen} />
    </>
  );
};

export default Header;