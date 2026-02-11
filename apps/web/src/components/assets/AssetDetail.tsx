import { useState } from 'react';
import type { AssetDto, TagDto, CollectionDto } from '@clr-vault/shared';
import { api } from '@/lib/api';
import { formatBytes, formatDate } from '@/lib/utils';
import { isImage, isVideo, isAudio } from '@/lib/file-utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import {
  Download,
  Trash2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';

interface AssetDetailProps {
  asset: AssetDto;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
  tags?: TagDto[];
  collections?: CollectionDto[];
}

export function AssetDetail({
  asset,
  open,
  onClose,
  onUpdate,
  onDelete,
  tags = [],
  collections = [],
}: AssetDetailProps) {
  const { addToast } = useToast();
  const [alt, setAlt] = useState(asset.alt || '');
  const [caption, setCaption] = useState(asset.caption || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await api.put(`/api/assets/${asset.id}`, { alt, caption });
      addToast({ title: 'Asset updated', variant: 'success' });
      onUpdate();
    } catch {
      addToast({ title: 'Failed to update asset', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/assets/${asset.id}`);
      addToast({ title: 'Asset deleted', variant: 'success' });
      onDelete();
      onClose();
    } catch {
      addToast({ title: 'Failed to delete asset', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleVisibility = async () => {
    try {
      await api.put(`/api/assets/${asset.id}`, {
        visibility: asset.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC',
      });
      addToast({
        title: `Asset is now ${asset.visibility === 'PUBLIC' ? 'private' : 'public'}`,
        variant: 'success',
      });
      onUpdate();
    } catch {
      addToast({ title: 'Failed to update visibility', variant: 'destructive' });
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(api.getServeUrl(asset.id));
    addToast({ title: 'URL copied to clipboard', variant: 'success' });
  };

  const handleAddTag = async (tagId: string) => {
    try {
      await api.post(`/api/assets/${asset.id}/tags`, { tagId });
      onUpdate();
    } catch {
      addToast({ title: 'Failed to add tag', variant: 'destructive' });
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      await api.delete(`/api/assets/${asset.id}/tags/${tagId}`);
      onUpdate();
    } catch {
      addToast({ title: 'Failed to remove tag', variant: 'destructive' });
    }
  };

  const handleAddCollection = async (collectionId: string) => {
    try {
      await api.post(`/api/assets/${asset.id}/collections`, { collectionId });
      onUpdate();
    } catch {
      addToast({ title: 'Failed to add to collection', variant: 'destructive' });
    }
  };

  const handleRemoveCollection = async (collectionId: string) => {
    try {
      await api.delete(`/api/assets/${asset.id}/collections/${collectionId}`);
      onUpdate();
    } catch {
      addToast({ title: 'Failed to remove from collection', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{asset.originalName}</DialogTitle>
          <DialogDescription>
            {asset.mimeType} - {formatBytes(asset.sizeBytes)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Preview */}
          <div className="space-y-4">
            <div className="overflow-hidden rounded-lg border bg-muted">
              {isImage(asset.mimeType) ? (
                <img
                  src={api.getServeUrl(asset.id)}
                  alt={asset.alt || asset.originalName}
                  className="max-h-96 w-full object-contain"
                />
              ) : isVideo(asset.mimeType) ? (
                <video src={api.getServeUrl(asset.id)} controls className="w-full" />
              ) : isAudio(asset.mimeType) ? (
                <div className="flex items-center justify-center p-8">
                  <audio src={api.getServeUrl(asset.id)} controls className="w-full" />
                </div>
              ) : (
                <div className="flex items-center justify-center p-16 text-muted-foreground">
                  No preview available
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={copyUrl}>
                <Copy className="mr-2 h-4 w-4" /> Copy URL
              </Button>
              <a href={api.getServeUrl(asset.id)} download={asset.originalName} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" /> Download
                </Button>
              </a>
              <Button variant="outline" size="sm" onClick={handleToggleVisibility}>
                {asset.visibility === 'PUBLIC' ? (
                  <><EyeOff className="mr-2 h-4 w-4" /> Make Private</>
                ) : (
                  <><Eye className="mr-2 h-4 w-4" /> Make Public</>
                )}
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} isLoading={isDeleting}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Status</p>
                <Badge
                  variant={
                    asset.status === 'ACTIVE'
                      ? 'success'
                      : asset.status === 'ERROR'
                        ? 'destructive'
                        : 'secondary'
                  }
                >
                  {asset.status}
                </Badge>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">Dimensions</p>
                <p className="text-sm">
                  {asset.width && asset.height ? `${asset.width} x ${asset.height}` : 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">Content Hash</p>
                <p className="truncate font-mono text-xs text-muted-foreground">{asset.contentHash}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">Created</p>
                <p className="text-sm">{formatDate(asset.createdAt)}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">Updated</p>
                <p className="text-sm">{formatDate(asset.updatedAt)}</p>
              </div>
            </div>

            {/* Alt & Caption */}
            <div className="space-y-3 border-t pt-4">
              <Input
                id="alt"
                label="Alt Text"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Describe this asset"
              />
              <Input
                id="caption"
                label="Caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Optional caption"
              />
              <Button size="sm" onClick={handleUpdate} isLoading={isUpdating}>
                Save Changes
              </Button>
            </div>

            {/* Tags */}
            <div className="border-t pt-4">
              <p className="mb-2 text-sm font-medium">Tags</p>
              <div className="flex flex-wrap gap-1">
                {asset.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  >
                    {tag.name}
                    <button onClick={() => handleRemoveTag(tag.id)} className="hover:opacity-70">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              {tags.length > 0 && (
                <div className="mt-2">
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    onChange={(e) => {
                      if (e.target.value) handleAddTag(e.target.value);
                      e.target.value = '';
                    }}
                    defaultValue=""
                  >
                    <option value="">Add tag...</option>
                    {tags
                      .filter((t) => !asset.tags.some((at) => at.id === t.id))
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {/* Collections */}
            <div className="border-t pt-4">
              <p className="mb-2 text-sm font-medium">Collections</p>
              <div className="flex flex-wrap gap-1">
                {asset.collections.map((col) => (
                  <Badge key={col.id} variant="outline" className="gap-1">
                    {col.name}
                    <button onClick={() => handleRemoveCollection(col.id)} className="hover:opacity-70">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              {collections.length > 0 && (
                <div className="mt-2">
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    onChange={(e) => {
                      if (e.target.value) handleAddCollection(e.target.value);
                      e.target.value = '';
                    }}
                    defaultValue=""
                  >
                    <option value="">Add to collection...</option>
                    {collections
                      .filter((c) => !asset.collections.some((ac) => ac.id === c.id))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
