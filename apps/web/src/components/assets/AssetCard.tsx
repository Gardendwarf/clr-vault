import type { AssetDto } from '@clr-vault/shared';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatBytes, formatRelativeTime } from '@/lib/utils';
import { isImage } from '@/lib/file-utils';
import { api } from '@/lib/api';
import { Image, FileText, Film, Music, File, Archive, Type } from 'lucide-react';

interface AssetCardProps {
  asset: AssetDto;
  onSelect: (asset: AssetDto) => void;
  isSelected?: boolean;
}

function FileTypeIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  if (mimeType.startsWith('image/')) return <Image className={className} />;
  if (mimeType.startsWith('video/')) return <Film className={className} />;
  if (mimeType.startsWith('audio/')) return <Music className={className} />;
  if (mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('text'))
    return <FileText className={className} />;
  if (mimeType.includes('font')) return <Type className={className} />;
  if (mimeType.includes('zip') || mimeType.includes('tar')) return <Archive className={className} />;
  return <File className={className} />;
}

export function AssetCard({ asset, onSelect, isSelected }: AssetCardProps) {
  const showPreview = isImage(asset.mimeType) && asset.thumbnailKey;

  return (
    <Card
      className={`group cursor-pointer overflow-hidden transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => onSelect(asset)}
    >
      <div className="relative aspect-square bg-muted">
        {showPreview ? (
          <img
            src={api.getThumbnailUrl(asset.id)}
            alt={asset.alt || asset.originalName}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FileTypeIcon mimeType={asset.mimeType} className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {asset.status === 'PROCESSING' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
          <p className="truncate text-xs text-white">{formatBytes(asset.sizeBytes)}</p>
        </div>
      </div>

      <div className="p-3">
        <p className="truncate text-sm font-medium" title={asset.originalName}>
          {asset.originalName}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{formatRelativeTime(asset.createdAt)}</span>
          {asset.visibility === 'PUBLIC' && (
            <Badge variant="secondary" className="text-[10px]">
              Public
            </Badge>
          )}
        </div>
        {asset.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {asset.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: tag.color + '20', color: tag.color }}
              >
                {tag.name}
              </span>
            ))}
            {asset.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{asset.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
