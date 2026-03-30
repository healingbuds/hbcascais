/**
 * Admin Orders Table Component
 * 
 * Displays orders in a data table with sorting, selection, and actions.
 */

import { format } from "date-fns";
import { formatPrice } from "@/lib/currency";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  RefreshCw,
  MoreHorizontal,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
  Flag,
  PlayCircle,
} from "lucide-react";
import { LocalOrder, SyncStatus, OrderStatus, PaymentStatus } from "@/hooks/useAdminOrderSync";
import { cn } from "@/lib/utils";

interface AdminOrdersTableProps {
  orders: LocalOrder[];
  isLoading: boolean;
  selectedOrders: string[];
  onToggleSelect: (orderId: string) => void;
  onSelectAll: (orderIds: string[]) => void;
  onViewOrder: (order: LocalOrder) => void;
  onSyncOrder: (orderId: string) => void;
  onResetSync: (orderId: string) => void;
  onFlagForReview: (orderId: string) => void;
  onProcessOrder?: (orderId: string) => void;
  isSyncing: boolean;
  isProcessing?: boolean;
}

const getSyncStatusBadge = (status: SyncStatus) => {
  switch (status) {
    case "synced":
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
          <CheckCircle className="w-3 h-3 mr-1" />
          Synced
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      );
    case "manual_review":
      return (
        <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Review
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getOrderStatusBadge = (status: OrderStatus) => {
  const statusConfig: Record<OrderStatus, { className: string; label: string }> = {
    PENDING: { className: "bg-amber-500/10 text-amber-600 dark:text-amber-400", label: "Pending" },
    CONFIRMED: { className: "bg-blue-500/10 text-blue-600 dark:text-blue-400", label: "Confirmed" },
    PROCESSING: { className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400", label: "Processing" },
    SHIPPED: { className: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400", label: "Shipped" },
    DELIVERED: { className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", label: "Delivered" },
    CANCELLED: { className: "bg-destructive/10 text-destructive", label: "Cancelled" },
  };

  const config = statusConfig[status] || { className: "", label: status };

  return (
    <Badge variant="outline" className={cn("border-transparent", config.className)}>
      {config.label}
    </Badge>
  );
};

const getPaymentStatusBadge = (status: PaymentStatus) => {
  const statusConfig: Record<PaymentStatus, { className: string; label: string }> = {
    PENDING: { className: "bg-amber-500/10 text-amber-600 dark:text-amber-400", label: "Pending" },
    PAID: { className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", label: "Paid" },
    FAILED: { className: "bg-destructive/10 text-destructive", label: "Failed" },
    REFUNDED: { className: "bg-purple-500/10 text-purple-600 dark:text-purple-400", label: "Refunded" },
  };

  const config = statusConfig[status] || { className: "", label: status };

  return (
    <Badge variant="outline" className={cn("border-transparent", config.className)}>
      {config.label}
    </Badge>
  );
};

export function AdminOrdersTable({
  orders,
  isLoading,
  selectedOrders,
  onToggleSelect,
  onSelectAll,
  onViewOrder,
  onSyncOrder,
  onResetSync,
  onFlagForReview,
  onProcessOrder,
  isSyncing,
  isProcessing,
}: AdminOrdersTableProps) {
  const allSelected = orders.length > 0 && selectedOrders.length === orders.length;
  const someSelected = selectedOrders.length > 0 && selectedOrders.length < orders.length;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No orders found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) {
                    (el as HTMLButtonElement & { indeterminate?: boolean }).indeterminate = someSelected;
                  }
                }}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onSelectAll(orders.map((o) => o.id));
                  } else {
                    onSelectAll([]);
                  }
                }}
              />
            </TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Order Ref</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Items</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Sync</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order, index) => (
            <motion.tr
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className={cn(
                "border-b transition-colors hover:bg-muted/50",
                selectedOrders.includes(order.id) && "bg-primary/5"
              )}
            >
              <TableCell>
                <Checkbox
                  checked={selectedOrders.includes(order.id)}
                  onCheckedChange={() => onToggleSelect(order.id)}
                />
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {format(new Date(order.created_at), "dd MMM yyyy")}
                <br />
                <span className="text-xs">
                  {format(new Date(order.created_at), "HH:mm")}
                </span>
              </TableCell>
              <TableCell>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-mono text-sm cursor-pointer hover:text-primary">
                      {order.drgreen_order_id?.slice(0, 12) || order.id.slice(0, 8)}...
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {order.drgreen_order_id || order.id}
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell>
                <div className="max-w-[150px]">
                  <p className="font-medium truncate">
                    {order.customer_name || "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {order.customer_email || "No email"}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {order.items?.length || 0} items
                </span>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatPrice(order.total_amount ?? 0, order.country_code || 'ZA')}
              </TableCell>
              <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
              <TableCell>{getPaymentStatusBadge(order.payment_status)}</TableCell>
              <TableCell>
                {order.sync_error ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>{getSyncStatusBadge(order.sync_status)}</div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-destructive">{order.sync_error}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  getSyncStatusBadge(order.sync_status)
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {/* Quick Process button for pending orders */}
                  {order.sync_status === "pending" && order.status === "PENDING" && onProcessOrder && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                          onClick={() => onProcessOrder(order.id)}
                          disabled={isProcessing}
                        >
                          <PlayCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Confirm & Process</TooltipContent>
                    </Tooltip>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewOrder(order)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {order.sync_status === "pending" && order.status === "PENDING" && onProcessOrder && (
                        <DropdownMenuItem onClick={() => onProcessOrder(order.id)}>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Confirm & Process
                        </DropdownMenuItem>
                      )}
                      {order.sync_status !== "synced" && (
                        <DropdownMenuItem
                          onClick={() => onSyncOrder(order.id)}
                          disabled={isSyncing}
                        >
                          <RefreshCw className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")} />
                          Sync to API
                        </DropdownMenuItem>
                      )}
                      {order.sync_status === "failed" && (
                        <DropdownMenuItem onClick={() => onResetSync(order.id)}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset Status
                        </DropdownMenuItem>
                      )}
                      {order.sync_status !== "manual_review" && (
                        <DropdownMenuItem onClick={() => onFlagForReview(order.id)}>
                          <Flag className="h-4 w-4 mr-2" />
                          Flag for Review
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
