import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useDrGreenApi } from "@/hooks/useDrGreenApi";
import type { PageMetaDto } from "@/lib/drgreen/types";

interface SaleRecord {
  id: string;
  stage: string;
  description: string | null;
  orderId: string | null;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneCountryCode: string;
    phoneCode: string;
    contactNumber: string;
    isActive: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

const STAGES = ["", "LEADS", "ONGOING", "CLOSED"] as const;
const STAGE_LABELS: Record<string, string> = {
  "": "All",
  LEADS: "Leads",
  ONGOING: "Ongoing",
  CLOSED: "Closed",
};

const stageBadgeVariant = (stage: string) => {
  switch (stage) {
    case "LEADS":
      return "default";
    case "ONGOING":
      return "secondary";
    case "CLOSED":
      return "outline";
    default:
      return "default";
  }
};

const stageBadgeClass = (stage: string) => {
  switch (stage) {
    case "LEADS":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "ONGOING":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    case "CLOSED":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    default:
      return "";
  }
};

const SalesPipelineTable = () => {
  const api = useDrGreenApi();
  const [records, setRecords] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageMeta, setPageMeta] = useState<PageMetaDto | null>(null);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<string>("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchSales = useCallback(
    async (p = 1, s = "", st = "") => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = {
          page: p,
          take: 10,
          orderBy: "desc",
        };
        if (s) params.search = s;
        if (st) params.stage = st;

        const res = await api.getSales(params as any);
        if (res.data) {
          setRecords(res.data.sales ?? []);
          setPageMeta(res.data.pageMetaDto ?? null);
        }
      } catch (err) {
        console.error("[SalesPipelineTable] fetch error:", err);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  useEffect(() => {
    fetchSales(1, search, stage);
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchSales();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchSales(1, value, stage);
    }, 400);
  };

  const handleStageChange = (s: string) => {
    setStage(s);
    setPage(1);
  };

  const goToPage = (p: number) => {
    setPage(p);
    fetchSales(p, search, stage);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Sales Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex gap-1.5">
              {STAGES.map((s) => (
                <Button
                  key={s}
                  variant={stage === s ? "default" : "outline"}
                  size="sm"
                  className="h-9 text-xs"
                  onClick={() => handleStageChange(s)}
                >
                  {STAGE_LABELS[s]}
                </Button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Order ID
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Skeleton className="h-4 w-36" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-16" />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      </TableRow>
                    ))
                  : records.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground py-8"
                        >
                          No sales records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      records.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">
                            {r.client.firstName} {r.client.lastName}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">
                            {r.client.email}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={stageBadgeVariant(r.stage)}
                              className={stageBadgeClass(r.stage)}
                            >
                              {r.stage}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground font-mono text-xs">
                            {r.orderId
                              ? r.orderId.length > 12
                                ? `${r.orderId.slice(0, 12)}…`
                                : r.orderId
                              : "—"}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">
                            {format(new Date(r.createdAt), "dd MMM yyyy")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pageMeta && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-muted-foreground">
                Page {pageMeta.page} of {pageMeta.pageCount} ({pageMeta.itemCount} records)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pageMeta.hasPreviousPage || loading}
                  onClick={() => goToPage(page - 1)}
                  className="h-8"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pageMeta.hasNextPage || loading}
                  onClick={() => goToPage(page + 1)}
                  className="h-8"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SalesPipelineTable;
