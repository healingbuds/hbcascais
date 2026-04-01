import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RefreshCw, Eye } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

interface OrderItem {
  strain_id: string;
  strain_name: string;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: string;
  drgreen_order_id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  items: OrderItem[];
  created_at: string;
  country_code?: string | null;
  currency?: string | null;
}

interface OrdersTableProps {
  orders: Order[];
  onReorder?: (order: Order) => void;
  isReordering?: boolean;
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status.toLowerCase()) {
    case 'paid':
    case 'completed':
    case 'delivered':
      return 'default';
    case 'processing':
    case 'pending':
      return 'secondary';
    case 'cancelled':
    case 'failed':
      return 'destructive';
    default:
      return 'outline';
  }
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'paid':
    case 'completed':
    case 'delivered':
      return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    case 'processing':
      return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
    case 'pending':
      return 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30';
    case 'pending_sync':
    case 'awaiting_processing':
      return 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30';
    case 'cancelled':
    case 'failed':
      return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function getDisplayStatus(status: string): string {
  if (status === 'PENDING_SYNC') return 'Awaiting Processing';
  if (status === 'AWAITING_PROCESSING') return 'Awaiting Processing';
  return status;
}

function calculateTotalQty(items: OrderItem[]): number {
  if (!items || items.length === 0) return 0;
  return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

export function OrdersTable({ orders, onReorder, isReordering }: OrdersTableProps) {
  const navigate = useNavigate();
  return (
    <div className="rounded-2xl border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Date</TableHead>
            <TableHead className="font-semibold">Ref</TableHead>
            <TableHead className="font-semibold hidden md:table-cell">Invoice</TableHead>
            <TableHead className="font-semibold hidden md:table-cell">Payment</TableHead>
            <TableHead className="font-semibold hidden md:table-cell">Status</TableHead>
            <TableHead className="font-semibold hidden md:table-cell text-center">Qty</TableHead>
            <TableHead className="font-semibold text-right">Total</TableHead>
            <TableHead className="font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow
              key={order.id}
              className="hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => navigate(`/orders/${order.id}`)}
            >
              <TableCell className="font-medium">
                {format(new Date(order.created_at), 'dd MMM yyyy')}
              </TableCell>
              <TableCell>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {order.drgreen_order_id.slice(0, 8)}...
                </code>
                {/* Mobile-only status badge */}
                <div className="md:hidden mt-1">
                  <Badge className={`${getStatusColor(order.status)} border text-[10px]`}>
                    {getDisplayStatus(order.status)}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}`); }}
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  View
                </Button>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge className={`${getStatusColor(order.payment_status)} border`}>
                  {getDisplayStatus(order.payment_status)}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge className={`${getStatusColor(order.status)} border`}>
                  {getDisplayStatus(order.status)}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell text-center">
                {(() => { const qty = calculateTotalQty(order.items); return qty > 0 ? qty : '—'; })()}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {formatPrice(order.total_amount, order.country_code || 'ZA')}
              </TableCell>
              <TableCell className="text-right">
                {onReorder && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onReorder(order); }}
                    disabled={isReordering}
                    className="rounded-xl"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isReordering ? 'animate-spin' : ''}`} />
                    Reorder
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
