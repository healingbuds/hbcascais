/**
 * AdminLayout Component
 * 
 * Dedicated layout for admin pages with sidebar navigation,
 * breadcrumbs, and environment indicator.
 */

import React, { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useTenant } from "@/hooks/useTenant";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "next-themes";
import { useApiEnvironment, ApiEnvironment } from "@/context/ApiEnvironmentContext";
import { EnvironmentSelector } from "@/components/admin/EnvironmentSelector";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import {
  LayoutDashboard,
  FileText,
  Leaf,
  RefreshCw,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Menu,
  X,
  User,
  Users,
  ShoppingCart,
  Bug,
  Wallet,
  BookOpen,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string | number;
}

const managementNavItems: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/revenue", label: "Revenue", icon: DollarSign },
  { to: "/admin/clients", label: "Clients", icon: Users },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/prescriptions", label: "Prescriptions", icon: FileText },
];

const productNavItems: NavItem[] = [
  { to: "/admin/strains", label: "Strains", icon: Leaf },
  { to: "/admin/strain-sync", label: "Strain Sync", icon: RefreshCw },
  { to: "/admin/strain-knowledge", label: "Strain Knowledge", icon: BookOpen },
];

const systemNavItems: NavItem[] = [
  { to: "/admin/roles", label: "User Roles", icon: Shield },
  { to: "/admin/wallet-mappings", label: "Wallet Mappings", icon: Wallet },
  { to: "/admin/settings", label: "Settings", icon: Settings },
  { to: "/admin/tools", label: "Developer Tools", icon: Bug },
];

// Route segment → breadcrumb label mapping
const ROUTE_LABELS: Record<string, string> = {
  admin: "Admin",
  clients: "Clients",
  orders: "Orders",
  prescriptions: "Prescriptions",
  strains: "Strains",
  "strain-sync": "Strain Sync",
  "strain-knowledge": "Strain Knowledge",
  roles: "User Roles",
  "wallet-mappings": "Wallet Mappings",
  settings: "Settings",
  tools: "Developer Tools",
};

const ENV_BANNER_STYLES: Record<ApiEnvironment, { bg: string; text: string; label: string } | null> = {
  production: null,
  staging: { bg: "bg-amber-500/15 border-b border-amber-500/30", text: "text-amber-700 dark:text-amber-400", label: "⚠ STAGING ENVIRONMENT" },
  railway: { bg: "bg-purple-500/15 border-b border-purple-500/30", text: "text-purple-700 dark:text-purple-400", label: "⚙ RAILWAY (DEV)" },
};

const AdminLayout = ({ children, title, description }: AdminLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, isLoading } = useUserRole();
  const { tenant } = useTenant();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { environment } = useApiEnvironment();

  const envBanner = ENV_BANNER_STYLES[environment];

  useEffect(() => {
    if (!isLoading && !user) {
      const returnUrl = encodeURIComponent(location.pathname + location.search);
      navigate(`/auth?redirect=${returnUrl}`, { replace: true });
    }
  }, [isLoading, user, location.pathname, location.search, navigate]);

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out", description: "You have been successfully signed out." });
    navigate("/");
  };

  // Generate breadcrumbs from pathname
  const breadcrumbs = (() => {
    const segments = location.pathname.split("/").filter(Boolean);
    if (segments.length <= 1) return []; // Just "/admin" — no breadcrumbs needed
    return segments.slice(1).map((seg, i) => ({
      label: ROUTE_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
      path: "/" + segments.slice(0, i + 2).join("/"),
      isLast: i === segments.length - 2,
    }));
  })();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="w-64 border-r border-border bg-card p-4">
          <Skeleton className="h-10 w-32 mb-8" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-64 mb-8" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md p-8">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You do not have administrator privileges to access this area.</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
            <Button onClick={() => navigate("/")}>Return Home</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const SidebarNavLink = ({ item, collapsed = false }: { item: NavItem; collapsed?: boolean }) => {
    const active = isActive(item.to);
    const Icon = item.icon;

    const linkContent = (
      <Link
        to={item.to}
        onClick={() => setMobileMenuOpen(false)}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          active
            ? "bg-primary text-primary-foreground font-medium shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <Icon className={cn("w-4 h-4 flex-shrink-0", active && "text-primary-foreground")} />
        {!collapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
            {item.badge && ` (${item.badge})`}
          </TooltipContent>
        </Tooltip>
      );
    }
    return linkContent;
  };

  const SectionLabel = ({ label, collapsed }: { label: string; collapsed?: boolean }) => {
    if (collapsed) return <div className="my-2 border-t border-border" />;
    return (
      <p className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </p>
    );
  };

  const renderNavSections = (collapsed = false) => (
    <>
      <SectionLabel label="Management" collapsed={collapsed} />
      {managementNavItems.map((item) => (
        <SidebarNavLink key={item.to} item={item} collapsed={collapsed} />
      ))}

      <SectionLabel label="Products" collapsed={collapsed} />
      {productNavItems.map((item) => (
        <SidebarNavLink key={item.to} item={item} collapsed={collapsed} />
      ))}

      <SectionLabel label="System" collapsed={collapsed} />
      {systemNavItems.map((item) => (
        <SidebarNavLink key={item.to} item={item} collapsed={collapsed} />
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Environment Banner */}
      {envBanner && (
        <div className={cn("px-4 py-1.5 text-center text-xs font-semibold tracking-wide z-50", envBanner.bg, envBanner.text)}>
          {envBanner.label}
        </div>
      )}

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden lg:flex flex-col border-r border-border bg-card transition-all duration-300",
            sidebarCollapsed ? "w-[72px]" : "w-60"
          )}
        >
          {/* Logo */}
          <div className={cn("flex items-center border-b border-border", sidebarCollapsed ? "h-14 justify-center px-2" : "h-14 px-4")}>
            <Link to="/admin" className="flex items-center gap-2.5">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                environment === 'production' ? "bg-primary" : environment === 'staging' ? "bg-amber-500" : "bg-purple-500"
              )}>
                <Shield className="w-4 h-4 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground text-sm leading-tight">Admin</span>
                  <span className="text-[10px] text-muted-foreground">{tenant.name}</span>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            {renderNavSections(sidebarCollapsed)}
          </nav>

          {/* User Section */}
          <div className={cn("border-t border-border p-2", sidebarCollapsed && "flex flex-col items-center gap-1")}>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/50 mb-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{user?.email?.split('@')[0] || 'Admin'}</p>
                  <p className="text-[10px] text-muted-foreground">Administrator</p>
                </div>
              </div>
            )}

            <div className={cn("flex gap-1", sidebarCollapsed ? "flex-col" : "flex-row")}>
              <ThemeToggle isDark={isDark} />
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive h-8 w-8">
                    <LogOut className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={sidebarCollapsed ? "right" : "top"}>Sign Out</TooltipContent>
              </Tooltip>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={cn("mt-1 w-full text-muted-foreground hover:text-foreground h-7 text-xs", sidebarCollapsed && "px-0")}
            >
              {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <><ChevronLeft className="w-3.5 h-3.5 mr-1" />Collapse</>}
            </Button>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border flex items-center justify-between px-4"
          style={envBanner ? { top: '30px' } : undefined}
        >
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center",
              environment === 'production' ? "bg-primary" : environment === 'staging' ? "bg-amber-500" : "bg-purple-500"
            )}>
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-foreground text-sm">Admin</span>
            {environment !== 'production' && (
              <span className={cn(
                "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                environment === 'staging' ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-purple-500/20 text-purple-600 dark:text-purple-400"
              )}>
                {environment === 'staging' ? 'STG' : 'DEV'}
              </span>
            )}
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="h-8 w-8">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 z-40 bg-black/50"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="lg:hidden fixed top-0 left-0 bottom-0 w-72 z-50 bg-card border-r border-border flex flex-col"
              >
                <div className="h-14 flex items-center px-4 border-b border-border">
                  <Link to="/admin" className="flex items-center gap-2.5" onClick={() => setMobileMenuOpen(false)}>
                    <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                      <Shield className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                    <span className="font-semibold text-foreground text-sm">Admin Portal</span>
                  </Link>
                </div>

                <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                  {renderNavSections(false)}
                </nav>

                <div className="border-t border-border p-3">
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/50 mb-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{user?.email?.split('@')[0] || 'Admin'}</p>
                      <p className="text-[10px] text-muted-foreground">Administrator</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
                    <LogOut className="w-3.5 h-3.5 mr-2" />Sign Out
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className={cn("flex-1 min-h-screen", "lg:pt-0", envBanner ? "pt-[74px]" : "pt-14")}>
          {/* Page Header with Breadcrumbs */}
          <div className="border-b border-border bg-card/50 px-6 py-3 lg:px-8">
            <div className="max-w-7xl mx-auto">
              {/* Breadcrumbs */}
              {breadcrumbs.length > 0 && (
                <Breadcrumb className="mb-1.5">
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to="/admin" className="text-xs">Admin</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    {breadcrumbs.map((crumb) => (
                      <React.Fragment key={crumb.path}>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          {crumb.isLast ? (
                            <BreadcrumbPage className="text-xs">{crumb.label}</BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink asChild>
                              <Link to={crumb.path} className="text-xs">{crumb.label}</Link>
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </React.Fragment>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              )}

              <div className="flex items-center justify-between gap-4">
                <div>
                  {title && <h1 className="text-xl font-bold text-foreground">{title}</h1>}
                  {description && <p className="text-sm text-muted-foreground">{description}</p>}
                </div>
                <EnvironmentSelector />
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
};


export default AdminLayout;
