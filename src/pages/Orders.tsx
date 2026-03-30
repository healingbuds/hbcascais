import Header from '@/layout/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { OrdersTable } from '@/components/shop/OrdersTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Loader2, Package, ShoppingBag, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

export default function Orders() {
  const { orders, isLoading, isSyncing, lastSyncedAt, reorder, refreshOrders } = useOrderTracking();
  const navigate = useNavigate();
  const [isReordering, setIsReordering] = useState(false);
  const [syncLabel, setSyncLabel] = useState('');

  // Update the "X ago" label every 10 seconds
  useEffect(() => {
    if (!lastSyncedAt) return;
    const update = () => setSyncLabel(formatDistanceToNow(lastSyncedAt, { addSuffix: true }));
    update();
    const interval = setInterval(update, 10_000);
    return () => clearInterval(interval);
  }, [lastSyncedAt]);

  const handleReorder = async (order: any) => {
    setIsReordering(true);
    try {
      await reorder(order);
    } finally {
      setIsReordering(false);
    }
  };

  const handleRefresh = async () => {
    await refreshOrders();
  };

  return (
    <>
      <SEOHead
        title="Order History | Healing Buds"
        description="View your order history and track your medical cannabis orders."
      />

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-24 pb-16">
          <div className="container max-w-5xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold">Order History</h1>
                  <p className="text-muted-foreground mt-1">
                    View and manage your previous orders
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/shop')}
                  className="rounded-2xl"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Browse Shop
                </Button>
              </div>

              {/* Sync status bar */}
              {orders.length > 0 && (
                <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isSyncing}
                    className="h-7 px-2 gap-1.5"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing…' : 'Refresh'}
                  </Button>
                  {lastSyncedAt && !isSyncing && (
                    <span className="text-xs">Last synced {syncLabel}</span>
                  )}
                </div>
              )}

              {isLoading ? (
                <Card className="rounded-3xl border-border/50">
                  <CardContent className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </CardContent>
                </Card>
              ) : orders.length === 0 ? (
                <Card className="rounded-3xl border-border/50">
                  <CardContent className="text-center py-16">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Package className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-xl mb-2">No Orders Yet</CardTitle>
                    <CardDescription className="mb-6">
                      You haven't placed any orders. Start your wellness journey today.
                    </CardDescription>
                    <Button
                      onClick={() => navigate('/shop')}
                      className="rounded-2xl"
                    >
                      Browse Treatments
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <OrdersTable
                  orders={orders}
                  onReorder={handleReorder}
                  isReordering={isReordering}
                />
              )}
            </motion.div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
