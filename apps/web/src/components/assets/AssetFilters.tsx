import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

interface AssetFiltersProps {
  status: string;
  onStatusChange: (status: string) => void;
  mimeType: string;
  onMimeTypeChange: (type: string) => void;
  sort: string;
  onSortChange: (sort: string) => void;
  order: string;
  onOrderChange: (order: string) => void;
  onClear: () => void;
}

export function AssetFilters({
  status,
  onStatusChange,
  mimeType,
  onMimeTypeChange,
  sort,
  onSortChange,
  order,
  onOrderChange,
  onClear,
}: AssetFiltersProps) {
  const hasFilters = status || mimeType || sort !== 'createdAt' || order !== 'desc';

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="PROCESSING">Processing</SelectItem>
          <SelectItem value="ARCHIVED">Archived</SelectItem>
          <SelectItem value="ERROR">Error</SelectItem>
        </SelectContent>
      </Select>

      <Select value={mimeType} onValueChange={onMimeTypeChange}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="File Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="image">Images</SelectItem>
          <SelectItem value="video">Videos</SelectItem>
          <SelectItem value="audio">Audio</SelectItem>
          <SelectItem value="application">Documents</SelectItem>
          <SelectItem value="font">Fonts</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sort} onValueChange={onSortChange}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="createdAt">Date</SelectItem>
          <SelectItem value="filename">Filename</SelectItem>
          <SelectItem value="sizeBytes">Size</SelectItem>
        </SelectContent>
      </Select>

      <Select value={order} onValueChange={onOrderChange}>
        <SelectTrigger className="w-28">
          <SelectValue placeholder="Order" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="desc">Newest</SelectItem>
          <SelectItem value="asc">Oldest</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="mr-1 h-4 w-4" /> Clear
        </Button>
      )}
    </div>
  );
}
