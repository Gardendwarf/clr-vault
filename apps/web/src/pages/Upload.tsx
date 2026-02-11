import { useState, useCallback } from 'react';
import { UploadZone } from '@/components/assets/UploadZone';
import { UploadProgress, type UploadItem } from '@/components/assets/UploadProgress';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import type { AssetDto } from '@clr-vault/shared';
import { ArrowLeft, Upload as UploadIcon } from 'lucide-react';

interface UploadPageProps {
  onNavigate: (path: string) => void;
}

let uploadCounter = 0;

export function UploadPage({ onNavigate }: UploadPageProps) {
  const { addToast } = useToast();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      const newItems: UploadItem[] = files.map((file) => ({
        id: `upload-${++uploadCounter}`,
        file,
        progress: 0,
        status: 'pending' as const,
      }));

      setUploads((prev) => [...newItems, ...prev]);
      setIsUploading(true);

      // Upload files sequentially
      for (const item of newItems) {
        setUploads((prev) =>
          prev.map((u) => (u.id === item.id ? { ...u, status: 'uploading', progress: 10 } : u))
        );

        try {
          // Simulate progress
          const progressInterval = setInterval(() => {
            setUploads((prev) =>
              prev.map((u) =>
                u.id === item.id && u.progress < 90
                  ? { ...u, progress: u.progress + 10 }
                  : u
              )
            );
          }, 200);

          const asset = await api.uploadFile<AssetDto>('/api/assets', item.file);

          clearInterval(progressInterval);

          setUploads((prev) =>
            prev.map((u) =>
              u.id === item.id
                ? { ...u, status: 'complete', progress: 100, assetId: asset.id }
                : u
            )
          );
        } catch (err) {
          setUploads((prev) =>
            prev.map((u) =>
              u.id === item.id
                ? {
                    ...u,
                    status: 'error',
                    error: err instanceof Error ? err.message : 'Upload failed',
                  }
                : u
            )
          );
        }
      }

      setIsUploading(false);
      const successCount = newItems.length;
      addToast({
        title: `${successCount} file(s) uploaded`,
        variant: 'success',
      });
    },
    [addToast]
  );

  const handleRemoveUpload = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const completedCount = uploads.filter((u) => u.status === 'complete').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => onNavigate('/assets')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Upload Files</h1>
            <p className="text-sm text-muted-foreground">
              Drag and drop files or click to browse
            </p>
          </div>
        </div>
        {completedCount > 0 && (
          <Button variant="outline" onClick={() => onNavigate('/assets')}>
            View Assets ({completedCount})
          </Button>
        )}
      </div>

      <UploadZone onFilesSelected={handleFilesSelected} disabled={isUploading} />

      <UploadProgress items={uploads} onRemove={handleRemoveUpload} />
    </div>
  );
}
