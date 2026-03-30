import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Send, 
  Loader2, 
  User, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Search
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ClientRecord {
  id: string;
  user_id: string;
  drgreen_client_id: string;
  email: string | null;
  full_name: string | null;
  country_code: string;
  is_kyc_verified: boolean;
  admin_approval: string;
  kyc_link: string | null;
  created_at: string;
}

type EmailType = 'welcome' | 'kyc-link' | 'kyc-approved' | 'kyc-rejected' | 'eligibility-approved' | 'eligibility-rejected';

const emailTypes: { value: EmailType; label: string; description: string }[] = [
  { value: 'welcome', label: 'Welcome Email', description: 'Initial welcome after registration' },
  { value: 'kyc-link', label: 'KYC Verification Link', description: 'Send/resend KYC verification link' },
  { value: 'kyc-approved', label: 'KYC Approved', description: 'Notify client their KYC is approved' },
  { value: 'kyc-rejected', label: 'KYC Rejected', description: 'Notify client their KYC was rejected' },
  { value: 'eligibility-approved', label: 'Eligibility Approved', description: 'Full eligibility confirmation' },
  { value: 'eligibility-rejected', label: 'Eligibility Rejected', description: 'Eligibility rejection notice' },
];

export function AdminEmailTrigger() {
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmailType, setSelectedEmailType] = useState<EmailType>('welcome');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      // Fetch clients with email stored (admin only via RLS)
      const { data, error } = await supabase
        .from('drgreen_clients')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching clients:', error);
        toast({
          title: 'Error',
          description: 'Failed to load client list. Admin access required.',
          variant: 'destructive',
        });
        return;
      }

      setClients(data || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async (client: ClientRecord) => {
    if (!client.email) {
      toast({
        title: 'No Email',
        description: 'This client has no email stored. Cannot send email.',
        variant: 'destructive',
      });
      return;
    }

    setSending(client.id);
    try {
      const { data, error } = await supabase.functions.invoke('send-client-email', {
        body: {
          type: selectedEmailType,
          email: client.email,
          name: client.full_name || 'Valued Patient',
          region: client.country_code || 'global',
          kycLink: client.kyc_link || undefined,
          clientId: client.drgreen_client_id,
        },
      });

      if (error) {
        console.error('Email error:', error);
        toast({
          title: 'Email Failed',
          description: `Failed to send ${selectedEmailType} email: ${error.message}`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Email Sent!',
        description: `${emailTypes.find(e => e.value === selectedEmailType)?.label} sent to ${client.email}`,
      });
    } catch (err) {
      console.error('Send error:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setSending(null);
    }
  };

  const filteredClients = clients.filter(client => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      client.email?.toLowerCase().includes(query) ||
      client.full_name?.toLowerCase().includes(query) ||
      client.drgreen_client_id.toLowerCase().includes(query) ||
      client.country_code.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (client: ClientRecord) => {
    if (client.is_kyc_verified && client.admin_approval === 'VERIFIED') {
      return <Badge variant="default" className="bg-green-500">Verified</Badge>;
    }
    if (client.admin_approval === 'REJECTED') {
      return <Badge variant="destructive">Rejected</Badge>;
    }
    if (client.drgreen_client_id.startsWith('local-')) {
      return <Badge variant="outline" className="border-amber-500 text-amber-600">API Failed</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Manual Email Trigger</CardTitle>
              <CardDescription>Send emails to clients when automatic emails fail</CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchClients}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Type Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Email Type to Send</Label>
            <Select value={selectedEmailType} onValueChange={(v) => setSelectedEmailType(v as EmailType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select email type" />
              </SelectTrigger>
              <SelectContent>
                {emailTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <span className="font-medium">{type.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">- {type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Search Clients</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name, or client ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Info about API failures */}
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="font-medium text-amber-700 dark:text-amber-400">
              Clients with "API Failed" status have IDs starting with "local-"
            </span>
          </div>
          <p className="text-muted-foreground mt-1">
            These clients didn't receive KYC links from First AML because the Dr. Green API call failed. 
            You can manually send them emails, but they may need to re-register once the API is fixed.
          </p>
        </div>

        {/* Client Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No clients found</p>
            <p className="text-sm">Clients will appear here once they register</p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Has KYC Link</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{client.full_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {client.drgreen_client_id.slice(0, 16)}...
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.email ? (
                        <span className="text-sm">{client.email}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">No email stored</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{client.country_code}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(client)}</TableCell>
                    <TableCell>
                      {client.kyc_link ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!client.email || sending === client.id}
                        onClick={() => sendEmail(client)}
                      >
                        {sending === client.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-1" />
                            Send
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
