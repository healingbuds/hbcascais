import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Package,
  Clock,
  Calendar,
  Zap,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/layout/AdminLayout';

interface CountryStatus {
  code: string;
  alpha3: string;
  name: string;
  flag: string;
  restricted: boolean;
  strainCount: number;
  lastSync: string | null;
  isLoading: boolean;
  error: string | null;
}

const COUNTRIES: Omit<CountryStatus, 'strainCount' | 'lastSync' | 'isLoading' | 'error'>[] = [
  { code: 'PT', alpha3: 'PRT', name: 'Portugal', flag: '🇵🇹', restricted: true },
  { code: 'GB', alpha3: 'GBR', name: 'United Kingdom', flag: '🇬🇧', restricted: true },
  { code: 'ZA', alpha3: 'ZAF', name: 'South Africa', flag: '🇿🇦', restricted: false },
  { code: 'TH', alpha3: 'THA', name: 'Thailand', flag: '🇹🇭', restricted: false },
];

const AdminStrainSync = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [countries, setCountries] = useState<CountryStatus[]>([]);
  const [syncingAll, setSyncingAll] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCountryStatuses();
  }, []);

  const fetchCountryStatuses = async () => {
    setIsLoading(true);
    
    const statusPromises = COUNTRIES.map(async (country) => {
      try {
        const { data, error } = await supabase.functions.invoke('drgreen-proxy', {
          body: {
            action: 'get-strains-legacy',
            countryCode: country.alpha3,
            orderBy: 'desc',
            take: 100,
            page: 1,
          },
        });

        if (error) {
          return {
            ...country,
            strainCount: 0,
            lastSync: null,
            isLoading: false,
            error: error.message,
          };
        }

        const strains = data?.data?.strains || [];
        return {
          ...country,
          strainCount: strains.length,
          lastSync: new Date().toISOString(),
          isLoading: false,
          error: null,
        };
      } catch (err: any) {
        return {
          ...country,
          strainCount: 0,
          lastSync: null,
          isLoading: false,
          error: err.message || 'Failed to fetch',
        };
      }
    });

    const results = await Promise.all(statusPromises);
    setCountries(results);
    setIsLoading(false);
  };

  const syncCountry = async (countryCode: string, alpha3: string) => {
    setCountries(prev => prev.map(c => 
      c.code === countryCode ? { ...c, isLoading: true, error: null } : c
    ));

    try {
      const { data, error } = await supabase.functions.invoke('sync-strains', {
        body: {
          countryCode: alpha3,
          take: 100,
          page: 1,
        },
      });

      if (error) throw error;

      if (data?.success) {
        // Refetch the count for this country
        const { data: fetchData } = await supabase.functions.invoke('drgreen-proxy', {
          body: {
            action: 'get-strains-legacy',
            countryCode: alpha3,
            orderBy: 'desc',
            take: 100,
            page: 1,
          },
        });

        const strains = fetchData?.data?.strains || [];

        setCountries(prev => prev.map(c => 
          c.code === countryCode ? { 
            ...c, 
            strainCount: strains.length,
            lastSync: new Date().toISOString(),
            isLoading: false, 
            error: null 
          } : c
        ));

        toast({
          title: 'Sync Complete',
          description: `Synced ${data.synced || strains.length} strains for ${countryCode}`,
        });
      } else {
        throw new Error(data?.error || 'Sync failed');
      }
    } catch (err: any) {
      setCountries(prev => prev.map(c => 
        c.code === countryCode ? { ...c, isLoading: false, error: err.message } : c
      ));

      toast({
        title: 'Sync Failed',
        description: err.message || `Failed to sync strains for ${countryCode}`,
        variant: 'destructive',
      });
    }
  };

  const syncAllCountries = async () => {
    setSyncingAll(true);
    
    for (const country of COUNTRIES) {
      await syncCountry(country.code, country.alpha3);
    }
    
    setSyncingAll(false);
    toast({
      title: 'Sync All Complete',
      description: 'All countries have been synced.',
    });
  };

  const totalStrains = countries.reduce((sum, c) => sum + c.strainCount, 0);
  const countriesWithStrains = countries.filter(c => c.strainCount > 0).length;

  if (isLoading) {
    return (
      <AdminLayout title="Strain Sync Dashboard" description="View strain availability by country and trigger manual API syncs">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Strain Sync Dashboard" description="View strain availability by country and trigger manual API syncs">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Sync All Button */}
        <div className="flex justify-end mb-6">
          <Button
            onClick={syncAllCountries}
            disabled={syncingAll || countries.some(c => c.isLoading)}
          >
            {syncingAll ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync All Countries
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Countries Active</p>
                  <p className="text-2xl font-bold text-foreground">{countriesWithStrains} / {COUNTRIES.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Package className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Strains</p>
                  <p className="text-2xl font-bold text-foreground">{totalStrains}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Shield className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Restricted Markets</p>
                  <p className="text-2xl font-bold text-foreground">{COUNTRIES.filter(c => c.restricted).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 border-cyan-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <Zap className="h-5 w-5 text-cyan-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Auto-Sync</p>
                  <p className="text-lg font-bold text-foreground">Daily 6 AM UTC</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scheduled Jobs Info */}
        <Card className="bg-gradient-to-r from-cyan-500/5 to-primary/5 border-cyan-500/20 mb-8">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-cyan-500" />
              <CardTitle className="text-lg">Scheduled Auto-Sync</CardTitle>
            </div>
            <CardDescription>
              Strains are automatically synced from the Dr. Green API daily
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-background/50">
                <p className="text-xs text-muted-foreground mb-1">🇵🇹 Portugal</p>
                <p className="font-mono text-sm">06:00 UTC</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50">
                <p className="text-xs text-muted-foreground mb-1">🇬🇧 United Kingdom</p>
                <p className="font-mono text-sm">06:05 UTC</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50">
                <p className="text-xs text-muted-foreground mb-1">🇿🇦 South Africa</p>
                <p className="font-mono text-sm">06:10 UTC</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50">
                <p className="text-xs text-muted-foreground mb-1">🇹🇭 Thailand</p>
                <p className="font-mono text-sm">06:15 UTC</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Jobs are staggered by 5 minutes to avoid API rate limits. Manual sync is always available above.
            </p>
          </CardContent>
        </Card>

        {/* Country Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {countries.map((country) => (
            <Card 
              key={country.code} 
              className={`bg-card/50 backdrop-blur-sm border-border/50 transition-all ${
                country.error ? 'border-destructive/50' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{country.flag}</span>
                    <div>
                      <CardTitle className="text-lg">{country.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <span>{country.code}</span>
                        {country.restricted ? (
                          <Badge variant="secondary" className="text-xs">
                            Restricted
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/30">
                            Open
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncCountry(country.code, country.alpha3)}
                    disabled={country.isLoading || syncingAll}
                  >
                    {country.isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Strain Count */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Strains Available</span>
                  <div className="flex items-center gap-2">
                    {country.strainCount > 0 ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="font-bold text-foreground">{country.strainCount}</span>
                      </>
                    ) : country.error ? (
                      <>
                        <XCircle className="h-4 w-4 text-destructive" />
                        <span className="text-destructive">Error</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">0</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <Progress 
                    value={totalStrains > 0 ? (country.strainCount / totalStrains) * 100 : 0} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {totalStrains > 0 
                      ? `${((country.strainCount / totalStrains) * 100).toFixed(1)}% of total`
                      : 'No strains loaded'
                    }
                  </p>
                </div>

                {/* Last Sync */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {country.lastSync 
                    ? `Last synced: ${new Date(country.lastSync).toLocaleString()}`
                    : 'Never synced'
                  }
                </div>

                {/* Error Message */}
                {country.error && (
                  <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-xs text-destructive">{country.error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminStrainSync;
