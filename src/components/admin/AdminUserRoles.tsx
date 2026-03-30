/**
 * AdminUserRoles Component
 * 
 * CRM-style user role management table with search, filter, and role assignment.
 * Allows admins to assign/remove roles with proper safeguards.
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import {
  Shield,
  ShieldCheck,
  User,
  Search,
  Plus,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Users
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AppRole = "admin" | "moderator" | "user";

interface UserRole {
  role: AppRole;
}

interface UserWithRoles {
  id: string;
  full_name: string | null;
  created_at: string;
  user_roles: UserRole[];
}

const ROLE_CONFIG: Record<AppRole, { label: string; icon: typeof Shield; className: string }> = {
  admin: {
    label: "Admin",
    icon: Shield,
    className: "bg-destructive/10 text-destructive border-destructive/20"
  },
  moderator: {
    label: "Moderator",
    icon: ShieldCheck,
    className: "bg-primary/10 text-primary border-primary/20"
  },
  user: {
    label: "User",
    icon: User,
    className: "bg-muted text-muted-foreground border-border"
  }
};

const ALL_ROLES: AppRole[] = ["admin", "moderator", "user"];

type FilterType = "all" | AppRole | "no-role";

const AdminUserRoles = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "add" | "remove";
    userId: string;
    userName: string;
    role: AppRole;
  } | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useUserRole();

  // Fetch users with their roles
  const { data: users, isLoading, error } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      // Fetch profiles and roles separately (no direct foreign key relation)
      const [profilesResult, rolesResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("user_roles")
          .select("user_id, role")
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (rolesResult.error) throw rolesResult.error;

      // Join profiles with their roles client-side
      const rolesByUserId = new Map<string, UserRole[]>();
      for (const roleRecord of rolesResult.data || []) {
        const existing = rolesByUserId.get(roleRecord.user_id) || [];
        existing.push({ role: roleRecord.role as AppRole });
        rolesByUserId.set(roleRecord.user_id, existing);
      }

      return (profilesResult.data || []).map(profile => ({
        id: profile.id,
        full_name: profile.full_name,
        created_at: profile.created_at,
        user_roles: rolesByUserId.get(profile.id) || []
      })) as UserWithRoles[];
    }
  });

  // Count admins for last-admin protection
  const adminCount = useMemo(() => {
    return users?.filter(u => u.user_roles.some(r => r.role === "admin")).length || 0;
  }, [users]);

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      
      if (error) throw error;
    },
    onSuccess: (_, { role }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast({
        title: "Role Assigned",
        description: `Successfully assigned ${ROLE_CONFIG[role].label} role.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Assign Role",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Remove role mutation
  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      
      if (error) throw error;
    },
    onSuccess: (_, { role }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast({
        title: "Role Removed",
        description: `Successfully removed ${ROLE_CONFIG[role].label} role.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Remove Role",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Filter and search users
  const filteredUsers = useMemo(() => {
    if (!users) return [];

    return users.filter(user => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery ||
        user.full_name?.toLowerCase().includes(searchLower) ||
        user.id.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Role filter
      const userRoles = user.user_roles.map(r => r.role);
      
      switch (activeFilter) {
        case "all":
          return true;
        case "no-role":
          return userRoles.length === 0;
        default:
          return userRoles.includes(activeFilter);
      }
    });
  }, [users, searchQuery, activeFilter]);

  // Role counts for filter tabs
  const roleCounts = useMemo(() => {
    if (!users) return { all: 0, admin: 0, moderator: 0, user: 0, "no-role": 0 };

    return {
      all: users.length,
      admin: users.filter(u => u.user_roles.some(r => r.role === "admin")).length,
      moderator: users.filter(u => u.user_roles.some(r => r.role === "moderator")).length,
      user: users.filter(u => u.user_roles.some(r => r.role === "user")).length,
      "no-role": users.filter(u => u.user_roles.length === 0).length
    };
  }, [users]);

  // Handle role action with confirmation
  const handleRoleAction = (action: "add" | "remove", userId: string, userName: string, role: AppRole) => {
    // Self-demotion prevention
    if (action === "remove" && role === "admin" && userId === currentUser?.id) {
      toast({
        title: "Cannot Remove Own Admin Role",
        description: "You cannot remove your own admin privileges.",
        variant: "destructive",
      });
      return;
    }

    // Last admin protection
    if (action === "remove" && role === "admin" && adminCount <= 1) {
      toast({
        title: "Cannot Remove Last Admin",
        description: "At least one admin must exist in the system.",
        variant: "destructive",
      });
      return;
    }

    setConfirmDialog({ open: true, action, userId, userName, role });
  };

  const confirmRoleAction = () => {
    if (!confirmDialog) return;

    const { action, userId, role } = confirmDialog;

    if (action === "add") {
      assignRoleMutation.mutate({ userId, role });
    } else {
      removeRoleMutation.mutate({ userId, role });
    }

    setConfirmDialog(null);
  };

  // Get available roles to add for a user
  const getAvailableRoles = (user: UserWithRoles): AppRole[] => {
    const existingRoles = user.user_roles.map(r => r.role);
    return ALL_ROLES.filter(role => !existingRoles.includes(role));
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-foreground">Failed to Load Users</h3>
        <p className="text-muted-foreground mt-1">{(error as Error).message}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] })}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as FilterType)}>
        <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Users className="h-4 w-4 mr-1.5" />
            All ({roleCounts.all})
          </TabsTrigger>
          {ALL_ROLES.map(role => {
            const config = ROLE_CONFIG[role];
            const Icon = config.icon;
            return (
              <TabsTrigger
                key={role}
                value={role}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Icon className="h-4 w-4 mr-1.5" />
                {config.label}s ({roleCounts[role]})
              </TabsTrigger>
            );
          })}
          <TabsTrigger
            value="no-role"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            No Role ({roleCounts["no-role"]})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Users Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>User</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  {searchQuery || activeFilter !== "all"
                    ? "No users match your search criteria."
                    : "No users found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map(user => {
                const userRoles = user.user_roles.map(r => r.role);
                const availableRoles = getAvailableRoles(user);
                const isCurrentUser = user.id === currentUser?.id;

                return (
                  <TableRow key={user.id}>
                    {/* User Info */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {user.full_name || "Unnamed User"}
                            {isCurrentUser && (
                              <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {user.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Created Date */}
                    <TableCell className="text-muted-foreground">
                      {format(new Date(user.created_at), "MMM d, yyyy")}
                    </TableCell>

                    {/* Current Roles */}
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {userRoles.length === 0 ? (
                          <span className="text-sm text-muted-foreground italic">No roles</span>
                        ) : (
                          userRoles.map(role => {
                            const config = ROLE_CONFIG[role];
                            const Icon = config.icon;
                            return (
                              <Badge
                                key={role}
                                variant="outline"
                                className={cn("gap-1", config.className)}
                              >
                                <Icon className="h-3 w-3" />
                                {config.label}
                              </Badge>
                            );
                          })
                        )}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Add Role Dropdown */}
                        {availableRoles.length > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-1" />
                                Add Role
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {availableRoles.map(role => {
                                const config = ROLE_CONFIG[role];
                                const Icon = config.icon;
                                return (
                                  <DropdownMenuItem
                                    key={role}
                                    onClick={() => handleRoleAction(
                                      "add",
                                      user.id,
                                      user.full_name || "Unnamed User",
                                      role
                                    )}
                                  >
                                    <Icon className="h-4 w-4 mr-2" />
                                    {config.label}
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}

                        {/* Remove Role Buttons */}
                        {userRoles.map(role => {
                          const config = ROLE_CONFIG[role];
                          const canRemove = !(role === "admin" && (isCurrentUser || adminCount <= 1));
                          
                          return (
                            <Button
                              key={role}
                              variant="ghost"
                              size="sm"
                              disabled={!canRemove}
                              onClick={() => handleRoleAction(
                                "remove",
                                user.id,
                                user.full_name || "Unnamed User",
                                role
                              )}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title={
                                !canRemove
                                  ? isCurrentUser
                                    ? "Cannot remove your own admin role"
                                    : "Cannot remove the last admin"
                                  : `Remove ${config.label} role`
                              }
                            >
                              <X className="h-4 w-4 mr-1" />
                              {config.label}
                            </Button>
                          );
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog 
        open={confirmDialog?.open ?? false} 
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.action === "add" ? "Assign Role" : "Remove Role"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.action === "add" ? (
                <>
                  Are you sure you want to assign the <strong>{confirmDialog?.role && ROLE_CONFIG[confirmDialog.role].label}</strong> role to <strong>{confirmDialog?.userName}</strong>?
                </>
              ) : (
                <>
                  Are you sure you want to remove the <strong>{confirmDialog?.role && ROLE_CONFIG[confirmDialog.role].label}</strong> role from <strong>{confirmDialog?.userName}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRoleAction}
              className={confirmDialog?.action === "remove" ? "bg-destructive hover:bg-destructive/90" : ""}
              disabled={assignRoleMutation.isPending || removeRoleMutation.isPending}
            >
              {(assignRoleMutation.isPending || removeRoleMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {confirmDialog?.action === "add" ? "Assign Role" : "Remove Role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUserRoles;
