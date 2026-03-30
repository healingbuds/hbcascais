import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Search,
  RefreshCw,
  User,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileCheck,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';

interface JourneyLog {
  id: string;
  user_id: string;
  client_id: string;
  event_type: string;
  event_source: string;
  event_data: Record<string, unknown>;
  created_at: string;
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  'registration.started': <User className="h-4 w-4 text-blue-500" />,
  'registration.step_completed': <ArrowRight className="h-4 w-4 text-blue-400" />,
  'registration.submitted': <FileCheck className="h-4 w-4 text-purple-500" />,
  'registration.success': <CheckCircle2 className="h-4 w-4 text-green-500" />,
  'registration.error': <AlertTriangle className="h-4 w-4 text-red-500" />,
  'kyc.link_received': <Mail className="h-4 w-4 text-teal-500" />,
  'kyc.link_generated': <Mail className="h-4 w-4 text-teal-500" />,
  'kyc.verified': <CheckCircle2 className="h-4 w-4 text-green-500" />,
  'kyc.approved': <CheckCircle2 className="h-4 w-4 text-green-500" />,
  'kyc.rejected': <XCircle className="h-4 w-4 text-red-500" />,
  'kyc.failed': <XCircle className="h-4 w-4 text-red-500" />,
  'client.approved': <CheckCircle2 className="h-4 w-4 text-green-600" />,
  'client.rejected': <XCircle className="h-4 w-4 text-red-600" />,
  'email.welcome_sent': <Mail className="h-4 w-4 text-blue-500" />,
  'email.kyc-link_sent': <Mail className="h-4 w-4 text-teal-500" />,
  'email.kyc-approved_sent': <Mail className="h-4 w-4 text-green-500" />,
  'email.kyc-rejected_sent': <Mail className="h-4 w-4 text-red-500" />,
  'email.eligibility-approved_sent': <Mail className="h-4 w-4 text-green-600" />,
  'email.eligibility-rejected_sent': <Mail className="h-4 w-4 text-red-600" />,
};

const EVENT_COLORS: Record<string, string> = {
  'registration': 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  'kyc': 'bg-teal-500/10 text-teal-700 border-teal-500/20',
  'client': 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  'email': 'bg-amber-500/10 text-amber-700 border-amber-500/20',
};

function getEventCategory(eventType: string): string {
  return eventType.split('.')[0];
}

function getEventBadgeClass(eventType: string): string {
  const category = getEventCategory(eventType);
  return EVENT_COLORS[category] || 'bg-muted text-muted-foreground';
}

export function KYCJourneyViewer() {
  const [logs, setLogs] = useState<JourneyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = (supabase.from('kyc_journey_logs') as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (searchQuery) {
        query = query.or(`client_id.ilike.%${searchQuery}%,event_type.ilike.%${searchQuery}%`);
      }

      if (eventFilter !== 'all') {
        query = query.ilike('event_type', `${eventFilter}%`);
      }

      if (sourceFilter !== 'all') {
        query = query.eq('event_source', sourceFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch journey logs:', error);
        return;
      }

      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [eventFilter, sourceFilter]);

  const handleSearch = () => {
    fetchLogs();
  };

  // Group logs by client_id for timeline view
  const groupedLogs = logs.reduce((acc, log) => {
    if (!acc[log.client_id]) {
      acc[log.client_id] = [];
    }
    acc[log.client_id].push(log);
    return acc;
  }, {} as Record<string, JourneyLog[]>);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          KYC Journey Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex gap-2 flex-1 min-w-[200px]">
            <Input
              placeholder="Search by client ID or event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button variant="outline" size="icon" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Event type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="registration">Registration</SelectItem>
              <SelectItem value="kyc">KYC</SelectItem>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="drgreen-proxy">Proxy</SelectItem>
              <SelectItem value="drgreen-webhook">Webhook</SelectItem>
              <SelectItem value="send-client-email">Email</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="text-2xl font-bold text-blue-700">{Object.keys(groupedLogs).length}</div>
            <div className="text-sm text-blue-600">Unique Clients</div>
          </div>
          <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20">
            <div className="text-2xl font-bold text-teal-700">
              {logs.filter(l => l.event_type.startsWith('kyc.')).length}
            </div>
            <div className="text-sm text-teal-600">KYC Events</div>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="text-2xl font-bold text-green-700">
              {logs.filter(l => l.event_type.includes('approved') || l.event_type.includes('verified')).length}
            </div>
            <div className="text-sm text-green-600">Approvals</div>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="text-2xl font-bold text-amber-700">
              {logs.filter(l => l.event_type.startsWith('email.')).length}
            </div>
            <div className="text-sm text-amber-600">Emails Sent</div>
          </div>
        </div>

        {/* Timeline */}
        <ScrollArea className="h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No journey logs found
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="mt-0.5">
                    {EVENT_ICONS[log.event_type] || <Clock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="outline" className={getEventBadgeClass(log.event_type)}>
                        {log.event_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        via {log.event_source}
                      </span>
                    </div>
                    <div className="text-sm font-mono text-muted-foreground truncate">
                      {log.client_id}
                    </div>
                    {Object.keys(log.event_data).length > 0 && (
                      <div className="mt-2 text-xs bg-muted/50 rounded p-2 font-mono overflow-x-auto">
                        {JSON.stringify(log.event_data, null, 2)}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
