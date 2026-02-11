import type { AssetDto, PaginatedData } from '@clr-vault/shared';
import { AssetCard } from './AssetCard';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AssetGridProps {
  data: PaginatedData<AssetDto> | undefined;
  isLoading: boolean;
  onSelect: (asset: AssetDto) => void;
  selectedIds?: string[];
  page: number;
  onPageChange: (page: number) => void;
}

export function AssetGrid({ data, isLoading, onSelect, selectedIds, page, onPageChange }: AssetGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-muted-foreground">No assets found</p>
        <p className="mt-1 text-sm text-muted-foreground">Upload some files to get started</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {data.items.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            onSelect={onSelect}
            isSelected={selectedIds?.includes(asset.id)}
          />
        ))}
      </div>

      {data.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * data.pageSize + 1}-
            {Math.min(page * data.pageSize, data.total)} of {data.total} assets
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= data.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
