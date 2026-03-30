import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Pill, 
  Plus, 
  TrendingUp, 
  Calendar,
  Loader2,
  Trash2,
  Star,
  Leaf
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DosageLog {
  id: string;
  strain_name: string;
  dosage_amount: number;
  dosage_unit: string;
  consumption_method: string;
  effects_noted: string | null;
  symptom_relief: number | null;
  side_effects: string | null;
  logged_at: string;
  notes: string | null;
}

const consumptionMethods = [
  { value: 'inhalation', label: 'Inhalation (Vape/Smoke)' },
  { value: 'oral', label: 'Oral (Edible/Oil)' },
  { value: 'sublingual', label: 'Sublingual' },
  { value: 'topical', label: 'Topical' },
  { value: 'other', label: 'Other' },
];

const DosageTracker = () => {
  const [logs, setLogs] = useState<DosageLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form state
  const [strainName, setStrainName] = useState('');
  const [dosageAmount, setDosageAmount] = useState('');
  const [dosageUnit, setDosageUnit] = useState('g');
  const [consumptionMethod, setConsumptionMethod] = useState('inhalation');
  const [effectsNoted, setEffectsNoted] = useState('');
  const [symptomRelief, setSymptomRelief] = useState([5]);
  const [sideEffects, setSideEffects] = useState('');
  const [notes, setNotes] = useState('');

  const fetchLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('dosage_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching dosage logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const resetForm = () => {
    setStrainName('');
    setDosageAmount('');
    setDosageUnit('g');
    setConsumptionMethod('inhalation');
    setEffectsNoted('');
    setSymptomRelief([5]);
    setSideEffects('');
    setNotes('');
  };

  const handleSave = async () => {
    if (!strainName || !dosageAmount) {
      toast({
        title: 'Missing information',
        description: 'Please enter strain name and dosage amount.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('dosage_logs')
        .insert({
          user_id: user.id,
          strain_name: strainName.trim(),
          dosage_amount: parseFloat(dosageAmount),
          dosage_unit: dosageUnit,
          consumption_method: consumptionMethod,
          effects_noted: effectsNoted.trim() || null,
          symptom_relief: symptomRelief[0],
          side_effects: sideEffects.trim() || null,
          notes: notes.trim() || null,
        });

      if (error) throw error;

      toast({
        title: 'Dosage logged',
        description: 'Your usage has been recorded successfully.',
      });

      resetForm();
      setDialogOpen(false);
      fetchLogs();
    } catch (error) {
      console.error('Error saving dosage log:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your dosage log.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('dosage_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Entry deleted',
        description: 'Dosage log has been removed.',
      });

      fetchLogs();
    } catch (error) {
      console.error('Error deleting log:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the entry.',
        variant: 'destructive',
      });
    }
  };

  const getReliefColor = (relief: number) => {
    if (relief >= 8) return 'text-green-500';
    if (relief >= 5) return 'text-yellow-500';
    return 'text-red-500';
  };

  const averageRelief = logs.length > 0
    ? logs.reduce((sum, log) => sum + (log.symptom_relief || 0), 0) / logs.length
    : 0;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Dosage Tracker
          </CardTitle>
          <CardDescription>
            Track your cannabis usage and symptom relief
          </CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Log Dose
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Log Cannabis Usage</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Strain Name *</Label>
                <Input
                  placeholder="e.g., Blue Dream"
                  value={strainName}
                  onChange={(e) => setStrainName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0.5"
                    value={dosageAmount}
                    onChange={(e) => setDosageAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select value={dosageUnit} onValueChange={setDosageUnit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">Grams (g)</SelectItem>
                      <SelectItem value="mg">Milligrams (mg)</SelectItem>
                      <SelectItem value="ml">Millilitres (ml)</SelectItem>
                      <SelectItem value="puffs">Puffs</SelectItem>
                      <SelectItem value="drops">Drops</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Consumption Method</Label>
                <Select value={consumptionMethod} onValueChange={setConsumptionMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {consumptionMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Symptom Relief (1-10)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={symptomRelief}
                    onValueChange={setSymptomRelief}
                    min={1}
                    max={10}
                    step={1}
                    className="flex-1"
                  />
                  <span className={`font-bold text-lg ${getReliefColor(symptomRelief[0])}`}>
                    {symptomRelief[0]}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Effects Noted</Label>
                <Input
                  placeholder="e.g., Relaxed, Pain-free, Focused"
                  value={effectsNoted}
                  onChange={(e) => setEffectsNoted(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Side Effects (if any)</Label>
                <Input
                  placeholder="e.g., Dry mouth, Drowsiness"
                  value={sideEffects}
                  onChange={(e) => setSideEffects(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Additional Notes</Label>
                <Textarea
                  placeholder="Any other observations..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Log Dose
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {/* Stats Summary */}
        {logs.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-primary">{logs.length}</p>
              <p className="text-xs text-muted-foreground">Recent Entries</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className={`text-2xl font-bold ${getReliefColor(averageRelief)}`}>
                {averageRelief.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">Avg Relief</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8">
            <Leaf className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">No usage logged yet</p>
            <Button 
              variant="link" 
              className="mt-2"
              onClick={() => setDialogOpen(true)}
            >
              Log your first dose
            </Button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{log.strain_name}</p>
                      <Badge variant="outline" className="text-xs">
                        {log.dosage_amount}{log.dosage_unit}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(log.logged_at).toLocaleDateString()}</span>
                      {log.effects_noted && (
                        <>
                          <span>•</span>
                          <span className="truncate">{log.effects_noted}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    {log.symptom_relief && (
                      <div className={`flex items-center gap-1 ${getReliefColor(log.symptom_relief)}`}>
                        <Star className="h-3 w-3 fill-current" />
                        <span className="text-sm font-medium">{log.symptom_relief}</span>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(log.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
};

export default DosageTracker;