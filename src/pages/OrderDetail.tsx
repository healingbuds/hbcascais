import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Package, CreditCard, MapPin, RefreshCw, Printer, User, Mail, Globe, Receipt, Clock, Truck } from "lucide-react";
import { motion } from "framer-motion";

import Header from "@/layout/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import MobileBottomActions from "@/components/MobileBottomActions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";

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
  updated_at: string;
  country_code: string | null;
  currency: string | null;
  customer_name: string | null;
  customer_email: string | null;
  invoice_number: string | null;
  client_id: string | null;
  shipping_address: Record<string, string> | null;
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "paid":
    case "completed":
    case "delivered":
      return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "processing":
    case "shipped":
      return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30";
    case "pending":
    case "pending_sync":
    case "awaiting_processing":
      return "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case "cancelled":
    case "failed":
      return "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getDisplayStatus(status: string): string {
  if (status === "PENDING_SYNC") return "Awaiting Processing";
  if (status === "AWAITING_PROCESSING") return "Awaiting Processing";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

const TIMELINE_STEPS = [
  { key: "placed", label: "Order Placed", icon: Package },
  { key: "processing", label: "Processing", icon: RefreshCw },
  { key: "paid", label: "Payment Confirmed", icon: CreditCard },
  { key: "delivered", label: "Delivered", icon: Truck },
];

function getTimelineIndex(status: string, paymentStatus: string): number {
  const s = status.toLowerCase();
  const p = paymentStatus.toLowerCase();
  if (s === "delivered" || s === "completed") return 3;
  if (s === "shipped") return 2;
  if (p === "paid" || p === "completed") return 2;
  if (s === "processing") return 1;
  return 0;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm text-foreground font-medium break-all">{value}</p>
      </div>
    </div>
  );
}

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drgreen_orders")
        .select("*")
        .eq("id", orderId)
        .single();
      if (error) throw error;
      return {
        ...data,
        items: (Array.isArray(data.items) ? data.items : []) as unknown as OrderItem[],
        shipping_address: data.shipping_address as Record<string, string> | null,
      } as Order;
    },
    enabled: !!orderId,
  });

  const cc = order?.country_code || "ZA";
  const timelineIdx = order ? getTimelineIndex(order.status, order.payment_status) : 0;

  return (
    <>
      <SEOHead title="Order Details | Healing Buds" description="View your order details" />
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-24 lg:pb-16">
          <div className="container max-w-3xl mx-auto px-4">
            <button
              onClick={() => navigate("/orders")}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Orders
            </button>

            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-48 w-full rounded-2xl" />
                <Skeleton className="h-48 w-full rounded-2xl" />
              </div>
            ) : !order ? (
              <Card className="rounded-2xl">
                <CardContent className="py-16 text-center">
                  <p className="text-muted-foreground">Order not found.</p>
                  <Button className="mt-4" onClick={() => navigate("/orders")}>
                    Back to Orders
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Order Details</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      <code className="bg-muted px-2 py-0.5 rounded text-xs">
                        {order.drgreen_order_id}
                      </code>
                      <span className="ml-3">
                        {format(new Date(order.created_at), "dd MMM yyyy, HH:mm")}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge className={cn("border", getStatusColor(order.status))}>
                      {getDisplayStatus(order.status)}
                    </Badge>
                    <Badge className={cn("border", getStatusColor(order.payment_status))}>
                      {getDisplayStatus(order.payment_status)}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => window.print()}
                    >
                      <Printer className="w-4 h-4 mr-1.5" />
                      Print Invoice
                    </Button>
                  </div>
                </div>

                {/* Status Banner */}
                {(() => {
                  const s = order.status.toLowerCase();
                  const p = order.payment_status.toLowerCase();
                  const isPaid = p === "paid" || p === "completed";
                  const isProcessing = s === "processing";
                  const isShipped = s === "shipped" || s === "dispatched";
                  const isDelivered = s === "delivered" || s === "completed";

                  let bannerClass = "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300";
                  let bannerIcon = <Clock className="w-5 h-5" />;
                  let bannerText = "Order Queued for Processing";
                  let bannerSub = "Our team will review your order and send a payment link via email.";

                  if (isDelivered) {
                    bannerClass = "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300";
                    bannerIcon = <Package className="w-5 h-5" />;
                    bannerText = "Order Delivered";
                    bannerSub = "";
                  } else if (isShipped) {
                    bannerClass = "bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-300";
                    bannerIcon = <Truck className="w-5 h-5" />;
                    bannerText = "Order Shipped";
                    bannerSub = "Your order is on its way!";
                  } else if (isPaid) {
                    bannerClass = "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300";
                    bannerIcon = <CreditCard className="w-5 h-5" />;
                    bannerText = "Payment Confirmed — Preparing Shipment";
                    bannerSub = "";
                  } else if (isProcessing) {
                    bannerClass = "bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-300";
                    bannerIcon = <RefreshCw className="w-5 h-5 animate-spin" />;
                    bannerText = "Order Being Processed";
                    bannerSub = "";
                  }

                  return (
                    <div className={cn("flex items-start gap-3 p-4 rounded-2xl border", bannerClass)}>
                      <div className="mt-0.5">{bannerIcon}</div>
                      <div>
                        <span className="font-semibold block">{bannerText}</span>
                        {bannerSub && <span className="text-sm opacity-80">{bannerSub}</span>}
                      </div>
                    </div>
                  );
                })()}

                {/* Timeline */}
                <Card className="rounded-2xl border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Order Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between relative">
                      <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
                      <div
                        className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
                        style={{ width: `${(timelineIdx / (TIMELINE_STEPS.length - 1)) * 100}%` }}
                      />
                      {TIMELINE_STEPS.map((step, i) => {
                        const active = i <= timelineIdx;
                        const Icon = step.icon;
                        return (
                          <div key={step.key} className="flex flex-col items-center z-10 relative">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                                active
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "bg-background border-border text-muted-foreground"
                              )}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <span
                              className={cn(
                                "text-xs mt-2 text-center max-w-[70px]",
                                active ? "text-foreground font-medium" : "text-muted-foreground"
                              )}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Order Summary + Customer Info grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Order Summary */}
                  <Card className="rounded-2xl border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Receipt className="w-4 h-4" /> Order Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <InfoRow icon={Package} label="Order ID" value={order.drgreen_order_id} />
                      {order.invoice_number && (
                        <InfoRow icon={Receipt} label="Invoice" value={order.invoice_number} />
                      )}
                      <InfoRow icon={Clock} label="Placed" value={format(new Date(order.created_at), "dd MMM yyyy, HH:mm")} />
                      {order.updated_at !== order.created_at && (
                        <InfoRow icon={RefreshCw} label="Last Updated" value={format(new Date(order.updated_at), "dd MMM yyyy, HH:mm")} />
                      )}
                      <InfoRow icon={Globe} label="Currency" value={order.currency?.toUpperCase()} />
                    </CardContent>
                  </Card>

                  {/* Customer Info */}
                  <Card className="rounded-2xl border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="w-4 h-4" /> Customer Info
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <InfoRow icon={User} label="Name" value={order.customer_name} />
                      <InfoRow icon={Mail} label="Email" value={order.customer_email} />
                      <InfoRow icon={Globe} label="Region" value={order.country_code?.toUpperCase()} />
                      {!order.customer_name && !order.customer_email && (
                        <p className="text-sm text-muted-foreground italic py-2">No customer details recorded.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Items */}
                <Card className="rounded-2xl border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="w-4 h-4" /> Items ({order.items.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {order.items.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic py-4 text-center">
                        No item details available for this order.
                      </p>
                    ) : (
                      <div className="space-y-0">
                        {/* Table header */}
                        <div className="grid grid-cols-12 gap-2 pb-2 border-b border-border/50 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                          <span className="col-span-6">Product</span>
                          <span className="col-span-2 text-center">Qty</span>
                          <span className="col-span-2 text-right">Price</span>
                          <span className="col-span-2 text-right">Total</span>
                        </div>
                        {(() => {
                          const totalQty = order.items.reduce((sum, i) => sum + (i.quantity || 0), 0);
                          const allZeroPrice = order.items.every(i => !i.unit_price || Number(i.unit_price) === 0);
                          const derivedUnitPrice = allZeroPrice && totalQty > 0 && order.total_amount > 0
                            ? order.total_amount / totalQty
                            : null;

                          return order.items.map((item, i) => {
                            const displayName = item.strain_name && item.strain_name !== 'Unknown'
                              ? item.strain_name
                              : 'Product';
                            const effectivePrice = (Number(item.unit_price) || 0) > 0
                              ? Number(item.unit_price)
                              : derivedUnitPrice ?? 0;
                            const lineTotal = item.quantity * effectivePrice;

                            return (
                              <div key={i} className="grid grid-cols-12 gap-2 py-3 border-b border-border/30 last:border-0 items-center">
                                <div className="col-span-6">
                                  <p className="font-medium text-foreground text-sm">{displayName}</p>
                                  {item.strain_id && (
                                    <p className="text-xs text-muted-foreground truncate">{item.strain_id}</p>
                                  )}
                                </div>
                                <p className="col-span-2 text-center text-sm text-muted-foreground">
                                  {item.quantity}
                                </p>
                                <p className="col-span-2 text-right text-sm text-muted-foreground">
                                  {formatPrice(effectivePrice, cc)}
                                </p>
                                <p className="col-span-2 text-right text-sm font-semibold text-foreground">
                                  {formatPrice(lineTotal, cc)}
                                </p>
                              </div>
                            );
                          });
                        })()}
                        <div className="flex items-center justify-between pt-4">
                          <span className="font-semibold text-foreground">Total</span>
                          <span className="text-lg font-bold text-foreground">
                            {formatPrice(order.total_amount, cc)}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Shipping Address */}
                {order.shipping_address && Object.keys(order.shipping_address).length > 0 && (
                  <Card className="rounded-2xl border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Delivery Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-1">
                      {order.customer_name && (
                        <p className="font-medium text-foreground">{order.customer_name}</p>
                      )}
                      {order.shipping_address.address1 && <p>{order.shipping_address.address1}</p>}
                      {order.shipping_address.address2 && <p>{order.shipping_address.address2}</p>}
                      {(order.shipping_address.city || order.shipping_address.state) && (
                        <p>
                          {[order.shipping_address.city, order.shipping_address.state]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                      {order.shipping_address.postalCode && <p>{order.shipping_address.postalCode}</p>}
                      {order.shipping_address.country && (
                        <p className="font-medium">{order.shipping_address.country}</p>
                      )}
                      {order.shipping_address.countryCode && !order.shipping_address.country && (
                        <p className="font-medium">{order.shipping_address.countryCode}</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Help notice */}
                <div className="text-center text-sm text-muted-foreground py-2">
                  Questions about this order? Contact{" "}
                  <a href="mailto:support@healingbuds.co.za" className="text-primary hover:underline font-medium">
                    support@healingbuds.co.za
                  </a>
                </div>
              </motion.div>
            )}
          </div>
        </main>
        <Footer />
        <MobileBottomActions />
      </div>
    </>
  );
}