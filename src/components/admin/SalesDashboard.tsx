import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDrGreenApi } from "@/hooks/useDrGreenApi";
import { formatPrice } from "@/lib/currency";

interface SalesSummary {
  ONGOING: number;
  LEADS: number;
  CLOSED: number;
  totalCount: number;
}

interface SalesItem {
  id: string;
  stage: string;
  description: string | null;
  orderId: string | null;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface ClientsSummary {
  PENDING: number;
  VERIFIED: number;
  REJECTED: number;
  totalCount: number;
}

export function SalesDashboard() {
  const { getSalesSummaryNew, getSales, getClientsSummary } = useDrGreenApi();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [clientsSummary, setClientsSummary] = useState<ClientsSummary | null>(null);
  const [recentSales, setRecentSales] = useState<SalesItem[]>([]);
  const [selectedStage, setSelectedStage] = useState<'LEADS' | 'ONGOING' | 'CLOSED' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (showRefreshToast = false) => {
    if (showRefreshToast) setRefreshing(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [salesSummaryRes, clientsSummaryRes, salesRes] = await Promise.all([
        getSalesSummaryNew(),
        getClientsSummary(),
        getSales({ take: 10, orderBy: 'desc' }),
      ]);

      if (salesSummaryRes.error) {
        console.error('Sales summary error:', salesSummaryRes.error);
      } else if (salesSummaryRes.data?.summary) {
        setSalesSummary(salesSummaryRes.data.summary);
      }

      if (clientsSummaryRes.error) {
        console.error('Clients summary error:', clientsSummaryRes.error);
      } else if (clientsSummaryRes.data?.summary) {
        setClientsSummary(clientsSummaryRes.data.summary);
      }

      if (salesRes.error) {
        console.error('Sales error:', salesRes.error);
      } else if (salesRes.data?.sales) {
        setRecentSales(salesRes.data.sales);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStageFilter = async (stage: 'LEADS' | 'ONGOING' | 'CLOSED' | null) => {
    setSelectedStage(stage);
    setLoading(true);

    try {
      const salesRes = await getSales({
        stage: stage || undefined,
        take: 10,
        orderBy: 'desc',
      });

      if (salesRes.data?.sales) {
        setRecentSales(salesRes.data.sales);
      }
    } catch (err) {
      console.error('Failed to filter sales:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'LEADS':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'ONGOING':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'CLOSED':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const totalSalesValue = salesSummary?.totalCount || 0;
  const leadsPercent = salesSummary && totalSalesValue > 0
    ? Math.round((salesSummary.LEADS / totalSalesValue) * 100)
    : 0;
  const ongoingPercent = salesSummary && totalSalesValue > 0
    ? Math.round((salesSummary.ONGOING / totalSalesValue) * 100)
    : 0;
  const closedPercent = salesSummary && totalSalesValue > 0
    ? Math.round((salesSummary.CLOSED / totalSalesValue) * 100)
    : 0;

  return (
    <Card className="border-2 border-dashed border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Sales Pipeline Dashboard</CardTitle>
              <CardDescription>
                Live sales data from Dr Green API
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Client Summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-cyan-500/5 to-transparent border-cyan-500/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-cyan-500" />
                  <span className="text-xs text-muted-foreground">Total Clients</span>
                </div>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">
                    {clientsSummary?.totalCount || 0}
                  </p>
                )}
                <div className="flex gap-2 mt-2 text-xs">
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                    {clientsSummary?.PENDING || 0} pending
                  </Badge>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                    {clientsSummary?.VERIFIED || 0} verified
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sales Pipeline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Leads</span>
                </div>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">
                    {salesSummary?.LEADS || 0}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{leadsPercent}% of pipeline</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-xs text-muted-foreground">Ongoing</span>
                </div>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">
                    {salesSummary?.ONGOING || 0}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{ongoingPercent}% of pipeline</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">Closed</span>
                </div>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">
                    {salesSummary?.CLOSED || 0}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{closedPercent}% of pipeline</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Pipeline Visualization */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Sales Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div
                className="h-3 bg-blue-500 rounded-l-full transition-all"
                style={{ width: `${leadsPercent || 33}%`, minWidth: '20px' }}
              />
              <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div
                className="h-3 bg-amber-500 transition-all"
                style={{ width: `${ongoingPercent || 33}%`, minWidth: '20px' }}
              />
              <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div
                className="h-3 bg-green-500 rounded-r-full transition-all"
                style={{ width: `${closedPercent || 33}%`, minWidth: '20px' }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>LEADS</span>
              <span>ONGOING</span>
              <span>CLOSED</span>
            </div>
          </CardContent>
        </Card>

        {/* Stage Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter:</span>
          <Button
            variant={selectedStage === null ? "default" : "outline"}
            size="sm"
            onClick={() => handleStageFilter(null)}
          >
            All
          </Button>
          <Button
            variant={selectedStage === 'LEADS' ? "default" : "outline"}
            size="sm"
            onClick={() => handleStageFilter('LEADS')}
            className={selectedStage === 'LEADS' ? '' : 'text-blue-600'}
          >
            Leads
          </Button>
          <Button
            variant={selectedStage === 'ONGOING' ? "default" : "outline"}
            size="sm"
            onClick={() => handleStageFilter('ONGOING')}
            className={selectedStage === 'ONGOING' ? '' : 'text-amber-600'}
          >
            Ongoing
          </Button>
          <Button
            variant={selectedStage === 'CLOSED' ? "default" : "outline"}
            size="sm"
            onClick={() => handleStageFilter('CLOSED')}
            className={selectedStage === 'CLOSED' ? '' : 'text-green-600'}
          >
            Closed
          </Button>
        </div>

        {/* Recent Sales Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Sales Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentSales.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No sales data available
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stage</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          <Badge variant="outline" className={getStageColor(sale.stage)}>
                            {sale.stage}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {sale.client?.firstName} {sale.client?.lastName}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {sale.client?.email}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
