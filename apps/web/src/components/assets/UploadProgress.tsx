import { formatBytes } from '@/lib/utils';
import { CheckCircle2, XCircle, Loader2, File } from 'lucide-react';

export interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
  assetId?: string;
}

interface UploadProgressProps {
  items: UploadItem[];
  onRemove: (id: string) => void;
}

export function UploadProgress({ items, onRemove }: UploadProgressProps) {
  if (items.length === 0) return null;

  const completed = items.filter((i) => i.status === 'complete').length;
  const total = items.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          Uploading {completed}/{total} files
        </h3>
        {completed === total && (
          <span className="text-sm text-green-600 font-medium">All complete</span>
        )}
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
            <File className="h-5 w-5 shrink-0 text-muted-foreground" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">{item.file.name}</p>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatBytes(item.file.size)}
                </span>
              </div>

              {item.status === 'uploading' && (
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}

              {item.error && (
                <p className="mt-1 text-xs text-destructive">{item.error}</p>
              )}
            </div>

            <div className="shrink-0">
              {item.status === 'pending' && (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              )}
              {item.status === 'uploading' && (
                <span className="text-xs font-medium text-primary">{item.progress}%</span>
              )}
              {item.status === 'complete' && (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
              {item.status === 'error' && (
                <button onClick={() => onRemove(item.id)}>
                  <XCircle className="h-5 w-5 text-destructive" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
