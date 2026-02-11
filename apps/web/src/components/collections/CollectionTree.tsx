import { useState } from 'react';
import type { CollectionDto } from '@clr-vault/shared';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';

interface CollectionTreeProps {
  collections: CollectionDto[];
  selectedId: string | null;
  onSelect: (collection: CollectionDto) => void;
  level?: number;
}

export function CollectionTree({
  collections,
  selectedId,
  onSelect,
  level = 0,
}: CollectionTreeProps) {
  return (
    <div className="space-y-0.5">
      {collections.map((collection) => (
        <CollectionTreeItem
          key={collection.id}
          collection={collection}
          selectedId={selectedId}
          onSelect={onSelect}
          level={level}
        />
      ))}
    </div>
  );
}

function CollectionTreeItem({
  collection,
  selectedId,
  onSelect,
  level,
}: {
  collection: CollectionDto;
  selectedId: string | null;
  onSelect: (collection: CollectionDto) => void;
  level: number;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = collection.children && collection.children.length > 0;
  const isSelected = selectedId === collection.id;

  return (
    <div>
      <button
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
          isSelected
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-foreground hover:bg-accent'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(collection)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {isSelected ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}

        <span className="truncate">{collection.name}</span>

        {collection.assetCount !== undefined && collection.assetCount > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {collection.assetCount}
          </span>
        )}
      </button>

      {hasChildren && isExpanded && (
        <CollectionTree
          collections={collection.children!}
          selectedId={selectedId}
          onSelect={onSelect}
          level={level + 1}
        />
      )}
    </div>
  );
}
