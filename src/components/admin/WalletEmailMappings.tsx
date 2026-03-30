/**
 * WalletEmailMappings Component
 * 
 * Admin UI for managing wallet-to-email account linking.
 * Allows adding, editing, and deactivating mappings stored
 * in the wallet_email_mappings table.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Wallet,
  Plus,
  Pencil,
  RefreshCw,
  Loader2,
  Link2,
  Mail,
  Tag,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { z } from "zod";

// ─── Types ────────────────────────────────────────────────

interface WalletEmailMapping {
  id: string;
  wallet_address: string;
  email: string;
  label: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Validation ───────────────────────────────────────────

const mappingSchema = z.object({
  wallet_address: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address (0x + 40 hex chars)"),
  email: z
    .string()
    .trim()
    .email("Must be a valid email address")
    .max(255, "Email must be under 255 characters"),
  label: z
    .string()
    .trim()
    .max(100, "Label must be under 100 characters")
    .optional()
    .or(z.literal("")),
});

type MappingFormData = z.infer<typeof mappingSchema>;

// ─── Component ────────────────────────────────────────────

export function WalletEmailMappings() {
  const { toast } = useToast();
  const [mappings, setMappings] = useState<WalletEmailMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<MappingFormData>({
    wallet_address: "",
    email: "",
    label: "",
  });

  const fetchMappings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("wallet_email_mappings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMappings((data as WalletEmailMapping[]) || []);
    } catch (err: any) {
      console.error("Failed to fetch mappings:", err);
      toast({
        title: "Error",
        description: "Failed to load wallet-email mappings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMappings();
  }, [fetchMappings]);

  const resetForm = () => {
    setFormData({ wallet_address: "", email: "", label: "" });
    setFormErrors({});
    setEditingId(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (mapping: WalletEmailMapping) => {
    setFormData({
      wallet_address: mapping.wallet_address,
      email: mapping.email,
      label: mapping.label || "",
    });
    setFormErrors({});
    setEditingId(mapping.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    // Validate
    const result = mappingSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        errors[field] = issue.message;
      });
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    setFormErrors({});

    try {
      const payload = {
        wallet_address: result.data.wallet_address.toLowerCase(),
        email: result.data.email,
        label: result.data.label || null,
      };

      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from("wallet_email_mappings")
          .update(payload)
          .eq("id", editingId);

        if (error) throw error;

        toast({ title: "Mapping Updated", description: `${payload.wallet_address.slice(0, 10)}… → ${payload.email}` });
      } else {
        // Insert new
        const { error } = await supabase
          .from("wallet_email_mappings")
          .insert(payload);

        if (error) {
          if (error.code === "23505") {
            setFormErrors({ wallet_address: "This wallet address already has a mapping." });
            return;
          }
          throw error;
        }

        toast({ title: "Mapping Created", description: `${payload.wallet_address.slice(0, 10)}… → ${payload.email}` });
      }

      setDialogOpen(false);
      resetForm();
      await fetchMappings();
    } catch (err: any) {
      console.error("Save failed:", err);
      toast({
        title: "Error",
        description: err?.message || "Failed to save mapping.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (mapping: WalletEmailMapping) => {
    try {
      const { error } = await supabase
        .from("wallet_email_mappings")
        .update({ is_active: !mapping.is_active })
        .eq("id", mapping.id);

      if (error) throw error;

      setMappings((prev) =>
        prev.map((m) =>
          m.id === mapping.id ? { ...m, is_active: !m.is_active } : m
        )
      );

      toast({
        title: mapping.is_active ? "Mapping Deactivated" : "Mapping Activated",
        description: `${mapping.wallet_address.slice(0, 10)}… → ${mapping.email}`,
      });
    } catch (err: any) {
      console.error("Toggle failed:", err);
      toast({
        title: "Error",
        description: "Failed to update mapping status.",
        variant: "destructive",
      });
    }
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Link2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Wallet-Email Mappings</CardTitle>
              <CardDescription>
                Link wallet addresses to email accounts for unified admin login
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMappings}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={openAddDialog}>
              <Plus className="w-4 h-4 mr-1" />
              Add Mapping
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : mappings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Wallet className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No wallet-email mappings configured</p>
            <p className="text-sm mt-1">Add a mapping to link a wallet to an existing email account.</p>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Wallet Address</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping) => (
                  <TableRow key={mapping.id} className={!mapping.is_active ? "opacity-50" : ""}>
                    <TableCell>
                      {mapping.is_active ? (
                        <Badge variant="default" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-muted text-muted-foreground">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {formatAddress(mapping.wallet_address)}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm">{mapping.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {mapping.label ? (
                        <div className="flex items-center gap-1">
                          <Tag className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{mapping.label}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(mapping.created_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Switch
                          checked={mapping.is_active}
                          onCheckedChange={() => handleToggleActive(mapping)}
                          aria-label={`Toggle ${mapping.wallet_address}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(mapping)}
                          className="h-8 w-8"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { resetForm(); } setDialogOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Mapping" : "Add Wallet-Email Mapping"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the wallet-to-email account link."
                : "Link a wallet address to an existing email account so both auth methods resolve to the same user."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Wallet Address */}
            <div className="space-y-2">
              <Label htmlFor="wallet_address">Wallet Address</Label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="wallet_address"
                  placeholder="0x..."
                  value={formData.wallet_address}
                  onChange={(e) => setFormData({ ...formData, wallet_address: e.target.value })}
                  className="pl-10 font-mono text-sm"
                  disabled={!!editingId}
                />
              </div>
              {formErrors.wallet_address && (
                <p className="text-sm text-destructive">{formErrors.wallet_address}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                />
              </div>
              {formErrors.email && (
                <p className="text-sm text-destructive">{formErrors.email}</p>
              )}
            </div>

            {/* Label */}
            <div className="space-y-2">
              <Label htmlFor="label">Label (optional)</Label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="label"
                  placeholder="e.g. Primary Admin"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="pl-10"
                />
              </div>
              {formErrors.label && (
                <p className="text-sm text-destructive">{formErrors.label}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? "Update" : "Add Mapping"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
