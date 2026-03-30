import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Loader2,
  Download,
  Eye,
  User,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/layout/AdminLayout';

interface PrescriptionDocument {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  upload_date: string;
  expiry_date: string | null;
  document_type: string;
  status: string;
  notes: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  user_email?: string;
}

const documentTypeLabels: Record<string, string> = {
  prescription: 'Prescription',
  medical_certificate: 'Medical Certificate',
  referral: 'Doctor Referral',
  id_document: 'ID Document',
  other: 'Other',
};

const AdminPrescriptions = () => {
  const [documents, setDocuments] = useState<PrescriptionDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<PrescriptionDocument | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('prescription_documents')
        .select('*')
        .order('upload_date', { ascending: false });

      if (error) throw error;

      // Fetch user emails for each document
      const docsWithEmails = await Promise.all(
        (data || []).map(async (doc) => {
          return { ...doc, user_email: doc.user_id.slice(0, 8) + '...' };
        })
      );

      setDocuments(docsWithEmails);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load prescription documents.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!selectedDoc) return;

    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('prescription_documents')
        .update({
          status,
          review_notes: reviewNotes.trim() || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedDoc.id);

      if (error) throw error;

      toast({
        title: status === 'approved' ? 'Document Approved' : 'Document Rejected',
        description: `The ${documentTypeLabels[selectedDoc.document_type]} has been ${status}.`,
      });

      setSelectedDoc(null);
      setReviewNotes('');
      fetchDocuments();
    } catch (error) {
      console.error('Error updating document:', error);
      toast({
        title: 'Error',
        description: 'Failed to update document status.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async (doc: PrescriptionDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('prescriptions')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Download failed',
        description: 'Failed to download the document.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  const filteredDocs = documents.filter(doc => {
    if (activeTab === 'pending') return doc.status === 'pending';
    if (activeTab === 'approved') return doc.status === 'approved';
    if (activeTab === 'rejected') return doc.status === 'rejected';
    return true;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <AdminLayout title="Document Review" description="Review and approve patient prescription documents">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Document Review" description="Review and approve patient prescription documents">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="pending" className="relative">
              Pending
              {documents.filter(d => d.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] flex items-center justify-center text-primary-foreground">
                  {documents.filter(d => d.status === 'pending').length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {activeTab === 'pending' ? 'Pending Review' : 
                   activeTab === 'approved' ? 'Approved Documents' :
                   activeTab === 'rejected' ? 'Rejected Documents' : 'All Documents'}
                </CardTitle>
                <CardDescription>
                  {filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredDocs.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No documents in this category</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          <div className={`p-2 rounded-lg ${
                            doc.file_type.includes('pdf') ? 'bg-red-500/10' : 'bg-blue-500/10'
                          }`}>
                            <FileText className={`h-6 w-6 ${
                              doc.file_type.includes('pdf') ? 'text-red-500' : 'text-blue-500'
                            }`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium truncate">{doc.file_name}</p>
                              {getStatusBadge(doc.status)}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {doc.user_email}
                              </span>
                              <span>{documentTypeLabels[doc.document_type]}</span>
                              <span>{formatFileSize(doc.file_size)}</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(doc.upload_date).toLocaleDateString()}
                              </span>
                              {doc.expiry_date && (
                                <span className={new Date(doc.expiry_date) < new Date() ? 'text-destructive' : ''}>
                                  Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {doc.review_notes && (
                              <p className="text-sm text-muted-foreground mt-2 italic">
                                Note: {doc.review_notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {doc.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedDoc(doc);
                                setReviewNotes('');
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Review Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Document</DialogTitle>
          </DialogHeader>
          {selectedDoc && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <p><strong>File:</strong> {selectedDoc.file_name}</p>
                <p><strong>Type:</strong> {documentTypeLabels[selectedDoc.document_type]}</p>
                <p><strong>Uploaded:</strong> {new Date(selectedDoc.upload_date).toLocaleString()}</p>
                {selectedDoc.expiry_date && (
                  <p><strong>Expires:</strong> {new Date(selectedDoc.expiry_date).toLocaleDateString()}</p>
                )}
                {selectedDoc.notes && (
                  <p><strong>Patient Notes:</strong> {selectedDoc.notes}</p>
                )}
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleDownload(selectedDoc)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download & View Document
              </Button>

              <div className="space-y-2">
                <Label>Review Notes (Optional)</Label>
                <Textarea
                  placeholder="Add notes about your decision..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => handleReview('rejected')}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
              Reject
            </Button>
            <Button
              onClick={() => handleReview('approved')}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPrescriptions;
