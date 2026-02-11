import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AssetDto, PaginatedData, TagDto, CollectionDto } from '@clr-vault/shared';
import { api } from '@/lib/api';
import { AssetGrid } from '@/components/assets/AssetGrid';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Search as SearchIcon, X } from 'lucide-react';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [type, setType] = useState('');
  const [tag, setTag] = useState('');
  const [collection, setCollection] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const searchQuery = useQuery({
    queryKey: ['search', activeQuery, type, tag, collection, dateFrom, dateTo, page],
    queryFn: () =>
      api.get<PaginatedData<AssetDto>>('/api/search', {
        q: activeQuery || undefined,
        type: type && type !== 'all' ? type : undefined,
        tag: tag && tag !== 'all' ? tag : undefined,
        collection: collection && collection !== 'all' ? collection : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        pageSize: 24,
      }),
    enabled: !!(activeQuery || type || tag || collection || dateFrom || dateTo),
  });

  const tagsQuery = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.get<TagDto[]>('/api/tags'),
  });

  const collectionsQuery = useQuery({
    queryKey: ['collections'],
    queryFn: () => api.get<CollectionDto[]>('/api/collections'),
  });

  const handleSearch = () => {
    setActiveQuery(query);
    setPage(1);
  };

  const clearAll = () => {
    setQuery('');
    setActiveQuery('');
    setType('');
    setTag('');
    setCollection('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const flatCollections: CollectionDto[] = [];
  const flatten = (cols: CollectionDto[]) => {
    for (const c of cols) {
      flatCollections.push(c);
      if (c.children) flatten(c.children);
    }
  };
  if (collectionsQuery.data) flatten(collectionsQuery.data);

  const hasFilters = activeQuery || type || tag || collection || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Search</h1>
        <p className="text-sm text-muted-foreground">
          Find assets by name, type, tags, collections, and dates
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search assets..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <Button onClick={handleSearch}>Search</Button>
        {hasFilters && (
          <Button variant="ghost" onClick={clearAll}>
            <X className="mr-1 h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="File Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
          </SelectContent>
        </Select>

        <Select value={tag} onValueChange={(v) => { setTag(v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {(tagsQuery.data || []).map((t) => (
              <SelectItem key={t.id} value={t.slug}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={collection} onValueChange={(v) => { setCollection(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Collection" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Collections</SelectItem>
            {flatCollections.map((c) => (
              <SelectItem key={c.id} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          placeholder="From"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          placeholder="To"
        />
      </div>

      {/* Results */}
      {hasFilters ? (
        <AssetGrid
          data={searchQuery.data}
          isLoading={searchQuery.isLoading}
          onSelect={() => {}}
          page={page}
          onPageChange={setPage}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <SearchIcon className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">
            Search for assets
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter a search term or select filters to find assets
          </p>
        </div>
      )}
    </div>
  );
}
