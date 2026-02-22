import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImportResidents, useGenerateResidentProfile } from '@/hooks/caerhold/useCaerholdResidentImport';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImportResult {
  mediaId: string;
  jobId: string;
  status: 'queued' | 'processing' | 'complete' | 'failed';
  fileName: string;
  residentName?: string;
  error?: string;
}

export default function ResidentImport() {
  const [results, setResults] = useState<ImportResult[]>([]);
  const [uploading, setUploading] = useState(false);
  const importMutation = useImportResidents();
  const generateMutation = useGenerateResidentProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFiles = useCallback(async (fileList: FileList) => {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    setUploading(true);
    const batchId = crypto.randomUUID();

    try {
      const importResults = await importMutation.mutateAsync({ files, batchId });
      
      const initialResults: ImportResult[] = importResults.map((r, i) => ({
        mediaId: r.mediaId,
        jobId: r.jobId,
        status: 'queued' as const,
        fileName: files[i]?.name || 'Unknown',
      }));
      setResults(initialResults);

      // Process each job sequentially to avoid rate limits
      for (let i = 0; i < initialResults.length; i++) {
        const result = initialResults[i];
        setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'processing' } : r));
        
        try {
          const data = await generateMutation.mutateAsync(result.jobId);
          setResults(prev => prev.map((r, idx) => 
            idx === i ? { ...r, status: 'complete', residentName: data?.profile?.first_name + ' ' + data?.profile?.last_name } : r
          ));
        } catch (err: any) {
          setResults(prev => prev.map((r, idx) => 
            idx === i ? { ...r, status: 'failed', error: err.message } : r
          ));
        }
      }

      toast({ title: 'Import complete', description: `Processed ${files.length} portraits.` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: err.message });
    } finally {
      setUploading(false);
    }
  }, [importMutation, generateMutation, toast]);

  const completedCount = results.filter(r => r.status === 'complete').length;
  const processingIndex = results.findIndex(r => r.status === 'processing');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-widest uppercase">Import Residents</h1>
        {results.length > 0 && completedCount > 0 && (
          <Button onClick={() => navigate('/admin/caerhold/residents/drafts')} variant="outline">
            View Drafts <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Upload minifigure portrait photos. The system will analyze each image and generate a draft resident profile.
      </p>

      {/* Upload Area */}
      <label className="flex flex-col items-center justify-center gap-4 border-2 border-dashed border-border rounded-none p-12 cursor-pointer hover:border-primary transition-colors">
        <Upload className="h-8 w-8 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {uploading ? 'Uploading...' : 'Drop portrait photos here or click to browse'}
        </span>
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </label>

      {/* Progress */}
      {results.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {processingIndex >= 0
                ? `Generating ${processingIndex + 1} of ${results.length} profiles...`
                : `${completedCount} of ${results.length} profiles generated`}
            </span>
          </div>

          <div className="space-y-1">
            {results.map((result, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border border-border bg-card">
                {result.status === 'queued' && <div className="h-4 w-4 rounded-full bg-muted" />}
                {result.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                {result.status === 'complete' && <CheckCircle className="h-4 w-4 text-primary" />}
                {result.status === 'failed' && <XCircle className="h-4 w-4 text-destructive" />}
                <span className="text-sm flex-1">{result.fileName}</span>
                {result.residentName && (
                  <span className="text-sm text-muted-foreground">→ {result.residentName}</span>
                )}
                {result.error && (
                  <span className="text-xs text-destructive">{result.error}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
