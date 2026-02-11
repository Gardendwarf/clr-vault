import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CollectionDto, AssetDto, PaginatedData } from '@clr-vault/shared';
import { api } from '@/lib/api';
import { CollectionTree } from '@/components/collections/CollectionTree';
import { CollectionBrowser } from '@/components/collections/CollectionBrowser';
import { AssetGrid } from '@/components/assets/AssetGrid';
import { Card, CardContent } from '@/components/ui/Card';

export function CollectionsPage() {
  const [selectedCollection, setSelectedCollection] = useState<CollectionDto | null>(null);
  const [assetPage, setAssetPage] = useState(1);

  const collectionsQuery = useQuery({
    queryKey: ['collections'],
    queryFn: () => api.get<CollectionDto[]>('/api/collections'),
  });

  const assetsQuery = useQuery({
    queryKey: ['collection-assets', selectedCollection?.id, assetPage],
    queryFn: () =>
      api.get<PaginatedData<AssetDto>>(
        `/api/collections/${selectedCollection!.id}/assets`,
        { page: assetPage, pageSize: 20 }
      ),
    enabled: !!selectedCollection,
  });

  const handleSelectCollection = (collection: CollectionDto) => {
    setSelectedCollection(collection);
    setAssetPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Collections</h1>
          <p className="text-sm text-muted-foreground">
            Organize your assets into collections
          </p>
        </div>
        <CollectionBrowser
          collection={selectedCollection}
          onRefresh={() => {
            collectionsQuery.refetch();
            if (selectedCollection) {
              assetsQuery.refetch();
            }
          }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Collection Tree */}
        <Card>
          <CardContent className="p-4">
            {collectionsQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-8 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : collectionsQuery.data && collectionsQuery.data.length > 0 ? (
              <CollectionTree
                collections={collectionsQuery.data}
                selectedId={selectedCollection?.id || null}
                onSelect={handleSelectCollection}
              />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No collections yet. Create one to get started.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Assets in Collection */}
        <div>
          {selectedCollection ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">{selectedCollection.name}</h2>
                <p className="text-sm text-muted-foreground">
                  Path: {selectedCollection.path}
                </p>
              </div>
              <AssetGrid
                data={assetsQuery.data}
                isLoading={assetsQuery.isLoading}
                onSelect={() => {}}
                page={assetPage}
                onPageChange={setAssetPage}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                Select a collection
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose a collection from the tree to view its assets
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
