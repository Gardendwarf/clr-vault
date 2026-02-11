import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AssetDto, PaginatedData, TagDto, CollectionDto } from '@clr-vault/shared';
import { api } from '@/lib/api';
import { AssetGrid } from '@/components/assets/AssetGrid';
import { AssetDetail } from '@/components/assets/AssetDetail';
import { AssetFilters } from '@/components/assets/AssetFilters';
import { Button } from '@/components/ui/Button';
import { Trash2, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface AssetsPageProps {
  onNavigate: (path: string) => void;
}

export function AssetsPage({ onNavigate }: AssetsPageProps) {
  const { addToast } = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [selectedAsset, setSelectedAsset] = useState<AssetDto | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const assetsQuery = useQuery({
    queryKey: ['assets', page, status, mimeType, sort, order],
    queryFn: () =>
      api.get<PaginatedData<AssetDto>>('/api/assets', {
        page,
        pageSize: 24,
        status: status && status !== 'all' ? status : undefined,
        mimeType: mimeType && mimeType !== 'all' ? mimeType : undefined,
        sort,
        order,
      }),
  });

  const tagsQuery = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.get<TagDto[]>('/api/tags'),
  });

  const collectionsQuery = useQuery({
    queryKey: ['collections'],
    queryFn: () => api.get<CollectionDto[]>('/api/collections'),
  });

  const handleSelect = useCallback((asset: AssetDto) => {
    setSelectedAsset(asset);
  }, []);

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} selected assets?`)) return;

    try {
      await api.post('/api/assets/bulk-delete', { ids: selectedIds });
      addToast({ title: `${selectedIds.length} assets deleted`, variant: 'success' });
      setSelectedIds([]);
      assetsQuery.refetch();
    } catch {
      addToast({ title: 'Failed to delete assets', variant: 'destructive' });
    }
  };

  const clearFilters = () => {
    setStatus('');
    setMimeType('');
    setSort('createdAt');
    setOrder('desc');
    setPage(1);
  };

  // Flatten collections for the dropdown
  const flatCollections: CollectionDto[] = [];
  const flatten = (cols: CollectionDto[]) => {
    for (const c of cols) {
      flatCollections.push(c);
      if (c.children) flatten(c.children);
    }
  };
  if (collectionsQuery.data) flatten(collectionsQuery.data);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assets</h1>
          <p className="text-sm text-muted-foreground">
            Manage your digital assets
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete {selectedIds.length}
            </Button>
          )}
          <Button onClick={() => onNavigate('/upload')}>
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

      <AssetFilters
        status={status}
        onStatusChange={setStatus}
        mimeType={mimeType}
        onMimeTypeChange={setMimeType}
        sort={sort}
        onSortChange={setSort}
        order={order}
        onOrderChange={setOrder}
        onClear={clearFilters}
      />

      <AssetGrid
        data={assetsQuery.data}
        isLoading={assetsQuery.isLoading}
        onSelect={handleSelect}
        selectedIds={selectedIds}
        page={page}
        onPageChange={setPage}
      />

      {selectedAsset && (
        <AssetDetail
          asset={selectedAsset}
          open={!!selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onUpdate={() => {
            assetsQuery.refetch();
            // Re-fetch selected asset
            api.get<AssetDto>(`/api/assets/${selectedAsset.id}`).then(setSelectedAsset);
          }}
          onDelete={() => assetsQuery.refetch()}
          tags={tagsQuery.data || []}
          collections={flatCollections}
        />
      )}
    </div>
  );
}
