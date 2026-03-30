import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  RefreshCw,
  Loader2,
  Globe,
  Clock,
  Calendar,
  Database,
  ExternalLink,
  Search,
  Trash2,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/layout/AdminLayout';
import { format } from 'date-fns';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface StrainKnowledge {
  id: string;
  strain_name: string;
  source_name: string;
  source_url: string;
  country_code: string;
  category: string;
  scraped_content: string | null;
  effects: string[] | null;
  medical_conditions: string[] | null;
  last_scraped_at: string;
  created_at: string;
}

const DISPENSARY_SOURCES = [
  { name: 'Ace Cann', url: 'https://acecann.com/', country: 'PT', category: 'dispensary' },
  { name: 'Canapac', url: 'https://canapac.pt/', country: 'PT', category: 'dispensary' },
  { name: 'Curaleaf Clinic', url: 'https://curaleafclinic.com/', country: 'GB', category: 'dispensary' },
  { name: 'Releaf', url: 'https://releaf.co.uk/', country: 'GB', category: 'dispensary' },
  { name: 'Medibiss', url: 'https://medibiss.com/', country: 'Network', category: 'drgreen' },
];

const AdminStrainKnowledge = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [scrapingSource, setScrapingSource] = useState<string | null>(null);
  const [knowledgeData, setKnowledgeData] = useState<StrainKnowledge[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [selectedKnowledge, setSelectedKnowledge] = useState<StrainKnowledge | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchKnowledgeData();
  }, []);

  const fetchKnowledgeData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('strain_knowledge')
        .select('*')
        .order('last_scraped_at', { ascending: false });

      if (error) throw error;
      setKnowledgeData(data || []);
    } catch (error) {
      console.error('Error fetching strain knowledge:', error);
      toast({ title: 'Error', description: 'Failed to fetch data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const scrapeAllSources = async () => {
    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke('strain-knowledge', {
        body: { action: 'scrape_all' },
      });
      if (error) throw error;
      toast({ title: 'Scraping Complete', description: `Scraped ${data?.scraped || 0} entries` });
      await fetchKnowledgeData();
    } catch (error: any) {
      toast({ title: 'Scraping Failed', description: error.message, variant: 'destructive' });
    } finally {
      setScraping(false);
    }
  };

  const filteredData = knowledgeData.filter(k => {
    const matchesSearch = k.strain_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = countryFilter === 'all' || k.country_code === countryFilter;
    return matchesSearch && matchesCountry;
  });

  if (isLoading) {
    return (
      <AdminLayout title="Strain Knowledge Base" description="AI-powered strain data from regional sources">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Strain Knowledge Base" description="AI-powered strain data from regional sources">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex justify-end mb-6">
          <Button onClick={scrapeAllSources} disabled={scraping}>
            {scraping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Scrape All Sources
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card><CardContent className="pt-6"><Database className="h-5 w-5 text-primary mb-2" /><p className="text-2xl font-bold">{knowledgeData.length}</p><p className="text-sm text-muted-foreground">Total Entries</p></CardContent></Card>
          <Card><CardContent className="pt-6"><span className="text-2xl">🇵🇹</span><p className="text-2xl font-bold">{knowledgeData.filter(k => k.country_code === 'PT').length}</p><p className="text-sm text-muted-foreground">Portugal</p></CardContent></Card>
          <Card><CardContent className="pt-6"><span className="text-2xl">🇬🇧</span><p className="text-2xl font-bold">{knowledgeData.filter(k => k.country_code === 'GB').length}</p><p className="text-sm text-muted-foreground">UK</p></CardContent></Card>
          <Card><CardContent className="pt-6"><Globe className="h-5 w-5 text-emerald-500 mb-2" /><p className="text-2xl font-bold">{knowledgeData.filter(k => k.category === 'drgreen').length}</p><p className="text-sm text-muted-foreground">Dr. Green Network</p></CardContent></Card>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search strains..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Country" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              <SelectItem value="PT">Portugal</SelectItem>
              <SelectItem value="GB">UK</SelectItem>
              <SelectItem value="ZA">South Africa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Strain</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Last Scraped</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.slice(0, 50).map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.strain_name}</TableCell>
                    <TableCell>{k.source_name}</TableCell>
                    <TableCell><Badge variant="outline">{k.country_code}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{format(new Date(k.last_scraped_at), 'PP')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedKnowledge(k)}><Eye className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={!!selectedKnowledge} onOpenChange={() => setSelectedKnowledge(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedKnowledge?.strain_name}</DialogTitle>
              <DialogDescription>From {selectedKnowledge?.source_name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedKnowledge?.effects && <div><p className="font-medium mb-1">Effects</p><div className="flex flex-wrap gap-1">{selectedKnowledge.effects.map(e => <Badge key={e} variant="secondary">{e}</Badge>)}</div></div>}
              {selectedKnowledge?.medical_conditions && <div><p className="font-medium mb-1">Medical Conditions</p><div className="flex flex-wrap gap-1">{selectedKnowledge.medical_conditions.map(c => <Badge key={c} variant="outline">{c}</Badge>)}</div></div>}
              {selectedKnowledge?.scraped_content && <div><p className="font-medium mb-1">Content</p><p className="text-sm text-muted-foreground max-h-40 overflow-y-auto">{selectedKnowledge.scraped_content}</p></div>}
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminStrainKnowledge;
