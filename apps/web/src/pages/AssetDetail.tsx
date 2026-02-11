import { useQuery } from '@tanstack/react-query';
import type { AssetDto, TagDto, CollectionDto } from '@clr-vault/shared';
import { api } from '@/lib/api';
import { AssetDetail as AssetDetailComponent } from '@/components/assets/AssetDetail';

interface AssetDetailPageProps {
  assetId: string;
  onNavigate: (path: string) => void;
}

export function AssetDetailPage({ assetId, onNavigate }: AssetDetailPageProps) {
  const assetQuery = useQuery({
    queryKey: ['asset', assetId],
    queryFn: () => api.get<AssetDto>(`/api/assets/${assetId}`),
  });

  const tagsQuery = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.get<TagDto[]>('/api/tags'),
  });

  const collectionsQuery = useQuery({
    queryKey: ['collections'],
    queryFn: () => api.get<CollectionDto[]>('/api/collections'),
  });

  if (assetQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!assetQuery.data) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-medium text-muted-foreground">Asset not found</p>
      </div>
    );
  }

  const flatCollections: CollectionDto[] = [];
  const flatten = (cols: CollectionDto[]) => {
    for (const c of cols) {
      flatCollections.push(c);
      if (c.children) flatten(c.children);
    }
  };
  if (collectionsQuery.data) flatten(collectionsQuery.data);

  return (
    <AssetDetailComponent
      asset={assetQuery.data}
      open={true}
      onClose={() => onNavigate('/assets')}
      onUpdate={() => assetQuery.refetch()}
      onDelete={() => onNavigate('/assets')}
      tags={tagsQuery.data || []}
      collections={flatCollections}
    />
  );
}
