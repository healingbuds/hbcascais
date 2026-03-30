import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import AdminLayout from "@/layout/AdminLayout";
import { useDrGreenApi } from "@/hooks/useDrGreenApi";
import { formatPrice } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  Users,
  ShoppingCart,
  AlertCircle,
  UserCheck,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DateRangeFilter from "@/components/admin/DateRangeFilter";

interface SalesSummary {
  totalSales: number;
  monthlySales: number;
  weeklySales: number;
  dailySales: number;
}

interface DashboardSummary {
  totalClients: number;
  totalOrders: number;
  totalSales: number;
  pendingOrders: number;
  verifiedClients: number;
  pendingClients: number;
}

interface AnalyticsData {
  salesData: Array<{ date: string; amount: number }>;
  ordersData: Array<{ date: string; count: number }>;
}

interface PipelineData {
  summary: { ONGOING: number; LEADS: number; CLOSED: number; totalCount: number };
  count: number;
}

const PIPELINE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--muted-foreground))"];

const salesChartConfig: ChartConfig = {
  amount: { label: "Revenue", color: "hsl(var(--primary))" },
};

const ordersChartConfig: ChartConfig = {
  count: { label: "Orders", color: "hsl(var(--accent))" },
};

const pipelineChartConfig: ChartConfig = {
  LEADS: { label: "Leads", color: "hsl(var(--primary))" },
  ONGOING: { label: "Ongoing", color: "hsl(var(--accent))" },
  CLOSED: { label: "Closed", color: "hsl(var(--muted-foreground))" },
};

const KpiCard = ({
  title,
  value,
  icon: Icon,
  loading,
  delay = 0,
}: {
  title: string;
  value: string;
  icon: typeof DollarSign;
  loading: boolean;
  delay?: number;
}) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{title}</p>
          {loading ? (
            <Skeleton className="h-6 w-24 mt-1" />
          ) : (
            <p className="text-lg font-semibold text-foreground truncate">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const AdminRevenue = () => {
  const api = useDrGreenApi();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<SalesSummary | null>(null);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const fetchAll = useCallback(async (filterStart?: Date, filterEnd?: Date) => {
    setLoading(true);
    try {
      const analyticsParams: Record<string, string> = {};
      if (filterStart) analyticsParams.startDate = format(filterStart, "yyyy-MM-dd");
      if (filterEnd) analyticsParams.endDate = format(filterEnd, "yyyy-MM-dd");

      const [salesRes, dashRes, analyticsRes, pipelineRes] = await Promise.allSettled([
        api.getSalesSummary(),
        api.getDashboardSummary(),
        api.getDashboardAnalytics(Object.keys(analyticsParams).length > 0 ? analyticsParams : undefined),
        api.getSalesSummaryNew(),
      ]);

      if (salesRes.status === "fulfilled" && salesRes.value.data) setSales(salesRes.value.data);
      if (dashRes.status === "fulfilled" && dashRes.value.data) setDashboard(dashRes.value.data);
      if (analyticsRes.status === "fulfilled" && analyticsRes.value.data) setAnalytics(analyticsRes.value.data);
      if (pipelineRes.status === "fulfilled" && pipelineRes.value.data) setPipeline(pipelineRes.value.data);

      const failures = [salesRes, dashRes, analyticsRes, pipelineRes].filter((r) => r.status === "rejected");
      if (failures.length > 0) {
        console.warn("[AdminRevenue] Some endpoints failed:", failures);
        toast({ title: "Partial data loaded", description: `${failures.length} endpoint(s) failed.`, variant: "destructive" });
      }
    } catch (err) {
      console.error("[AdminRevenue] Fatal fetch error:", err);
      toast({ title: "Failed to load dashboard", description: String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [api, toast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleApplyFilter = () => fetchAll(startDate, endDate);
  const handleClearFilter = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    fetchAll();
  };

  const fmt = (v: number | undefined) => formatPrice(v ?? 0, "ZA");

  const pipelinePieData = pipeline
    ? [
        { name: "Leads", value: pipeline.summary.LEADS },
        { name: "Ongoing", value: pipeline.summary.ONGOING },
        { name: "Closed", value: pipeline.summary.CLOSED },
      ]
    : [];

  return (
    <AdminLayout title="Revenue & Sales" description="Financial overview and sales pipeline">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Revenue & Sales</h1>
          <p className="text-sm text-muted-foreground mt-1">Financial overview and pipeline metrics</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchAll(startDate, endDate)} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Total Revenue" value={fmt(sales?.totalSales)} icon={DollarSign} loading={loading} delay={0} />
        <KpiCard title="Monthly Sales" value={fmt(sales?.monthlySales)} icon={TrendingUp} loading={loading} delay={0.05} />
        <KpiCard title="Weekly Sales" value={fmt(sales?.weeklySales)} icon={Calendar} loading={loading} delay={0.1} />
        <KpiCard title="Daily Sales" value={fmt(sales?.dailySales)} icon={Clock} loading={loading} delay={0.15} />
      </div>

      {/* Operations KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Total Clients" value={String(dashboard?.totalClients ?? "—")} icon={Users} loading={loading} delay={0.2} />
        <KpiCard title="Total Orders" value={String(dashboard?.totalOrders ?? "—")} icon={ShoppingCart} loading={loading} delay={0.25} />
        <KpiCard title="Pending Orders" value={String(dashboard?.pendingOrders ?? "—")} icon={AlertCircle} loading={loading} delay={0.3} />
        <KpiCard title="Verified Clients" value={String(dashboard?.verifiedClients ?? "—")} icon={UserCheck} loading={loading} delay={0.35} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Sales Trend */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Sales Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[260px] w-full" />
              ) : analytics?.salesData?.length ? (
                <ChartContainer config={salesChartConfig} className="h-[260px] w-full">
                  <AreaChart data={analytics.salesData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" fill="url(#salesGrad)" strokeWidth={2} />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">No sales data available</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Pipeline Breakdown */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Sales Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[260px] w-full" />
              ) : pipelinePieData.some((d) => d.value > 0) ? (
                <div>
                  <ChartContainer config={pipelineChartConfig} className="h-[180px] w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie data={pipelinePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} strokeWidth={2}>
                        {pipelinePieData.map((_, i) => (
                          <Cell key={i} fill={PIPELINE_COLORS[i]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <div className="mt-3 space-y-1.5">
                    {pipelinePieData.map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIPELINE_COLORS[i] }} />
                          <span className="text-muted-foreground">{d.name}</span>
                        </div>
                        <span className="font-medium text-foreground">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">No pipeline data</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Orders Chart */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Order Volume</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : analytics?.ordersData?.length ? (
              <ChartContainer config={ordersChartConfig} className="h-[220px] w-full">
                <BarChart data={analytics.ordersData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No order data available</div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminRevenue;
