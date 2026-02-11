import { useQuery } from '@tanstack/react-query';
import type { StorageOverviewDto, BandwidthDataPoint, PerAppUsageDto, TopAssetDto } from '@clr-vault/shared';
import { api } from '@/lib/api';
import { StorageOverview } from '@/components/analytics/StorageOverview';
import { BandwidthChart } from '@/components/analytics/BandwidthChart';
import { AppUsageTable } from '@/components/analytics/AppUsageTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatBytes } from '@/lib/utils';

export function AnalyticsPage() {
  const overviewQuery = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => api.get<StorageOverviewDto>('/api/analytics/overview'),
  });

  const bandwidthQuery = useQuery({
    queryKey: ['analytics-bandwidth'],
    queryFn: () => api.get<BandwidthDataPoint[]>('/api/analytics/bandwidth', { days: 30 }),
  });

  const perAppQuery = useQuery({
    queryKey: ['analytics-per-app'],
    queryFn: () => api.get<PerAppUsageDto[]>('/api/analytics/per-app'),
  });

  const topAssetsQuery = useQuery({
    queryKey: ['analytics-top-assets'],
    queryFn: () => api.get<TopAssetDto[]>('/api/analytics/top-assets', { limit: 10 }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Storage, bandwidth, and usage metrics
        </p>
      </div>

      <StorageOverview data={overviewQuery.data} isLoading={overviewQuery.isLoading} />

      <BandwidthChart data={bandwidthQuery.data} isLoading={bandwidthQuery.isLoading} />

      <AppUsageTable data={perAppQuery.data} isLoading={perAppQuery.isLoading} />

      {/* Top Assets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Most Accessed Assets</CardTitle>
        </CardHeader>
        <CardContent>
          {topAssetsQuery.isLoading ? (
            <div className="h-48 animate-pulse rounded bg-muted" />
          ) : topAssetsQuery.data && topAssetsQuery.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4 font-medium text-muted-foreground">File</th>
                    <th className="py-2 pr-4 font-medium text-muted-foreground">Type</th>
                    <th className="py-2 pr-4 font-medium text-muted-foreground text-right">
                      Accesses
                    </th>
                    <th className="py-2 font-medium text-muted-foreground text-right">
                      Bandwidth
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topAssetsQuery.data.map((asset) => (
                    <tr key={asset.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <p className="truncate font-medium max-w-xs">{asset.originalName}</p>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{asset.mimeType}</td>
                      <td className="py-3 pr-4 text-right">
                        {asset.accessCount.toLocaleString()}
                      </td>
                      <td className="py-3 text-right">{formatBytes(asset.bytesServed)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No access data yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
