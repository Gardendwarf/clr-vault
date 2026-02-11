import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  maxSize?: number;
}

export function UploadZone({ onFilesSelected, disabled, maxSize = 500 * 1024 * 1024 }: UploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFilesSelected(acceptedFiles);
      }
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    maxSize,
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors',
        isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4 text-center">
        {isDragActive ? (
          <>
            <FileUp className="h-12 w-12 text-primary" />
            <div>
              <p className="text-lg font-semibold text-primary">Drop files here</p>
              <p className="mt-1 text-sm text-muted-foreground">Release to upload</p>
            </div>
          </>
        ) : (
          <>
            <Upload className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="text-lg font-semibold">
                Drag & drop files here, or click to browse
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Supports images, videos, documents, fonts, and more. Max {Math.round(maxSize / 1024 / 1024)}MB per file.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
