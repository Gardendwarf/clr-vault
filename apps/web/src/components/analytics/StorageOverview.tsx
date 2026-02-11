import type { StorageOverviewDto } from '@clr-vault/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatBytes } from '@/lib/utils';
import { HardDrive, Images, FolderTree, Tag } from 'lucide-react';

interface StorageOverviewProps {
  data: StorageOverviewDto | undefined;
  isLoading: boolean;
}

export function StorageOverview({ data, isLoading }: StorageOverviewProps) {
  if (isLoading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-20 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Assets',
      value: data.totalAssets.toLocaleString(),
      icon: Images,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'Storage Used',
      value: formatBytes(data.totalSizeBytes),
      icon: HardDrive,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      label: 'Collections',
      value: data.totalCollections.toLocaleString(),
      icon: FolderTree,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      label: 'Tags',
      value: data.totalTags.toLocaleString(),
      icon: Tag,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`rounded-lg p-3 ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Status breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assets by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.assetsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        status === 'ACTIVE'
                          ? 'bg-green-500'
                          : status === 'PROCESSING'
                            ? 'bg-yellow-500'
                            : status === 'ERROR'
                              ? 'bg-red-500'
                              : 'bg-gray-400'
                      }`}
                    />
                    <span className="text-sm capitalize">{status.toLowerCase()}</span>
                  </div>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Type breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assets by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.assetsByType.slice(0, 8).map((type) => (
                <div key={type.mimeType} className="flex items-center justify-between">
                  <span className="truncate text-sm">{type.mimeType}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {formatBytes(type.sizeBytes)}
                    </span>
                    <span className="text-sm font-medium">{type.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
