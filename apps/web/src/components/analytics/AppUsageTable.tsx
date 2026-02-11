import type { PerAppUsageDto } from '@clr-vault/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatBytes, percentUsed } from '@/lib/utils';

interface AppUsageTableProps {
  data: PerAppUsageDto[] | undefined;
  isLoading: boolean;
}

export function AppUsageTable({ data, isLoading }: AppUsageTableProps) {
  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Per-App Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Per-App Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No API keys have been created yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Per-App Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4 font-medium text-muted-foreground">App</th>
                <th className="py-2 pr-4 font-medium text-muted-foreground">App ID</th>
                <th className="py-2 pr-4 font-medium text-muted-foreground text-right">Assets</th>
                <th className="py-2 pr-4 font-medium text-muted-foreground text-right">Requests</th>
                <th className="py-2 pr-4 font-medium text-muted-foreground text-right">Bandwidth</th>
                <th className="py-2 pr-4 font-medium text-muted-foreground">Storage</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const usage = percentUsed(row.usedBytes, row.quotaBytes);
                return (
                  <tr key={row.apiKeyId} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{row.name}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                      {row.appId}
                    </td>
                    <td className="py-3 pr-4 text-right">{row.assetCount}</td>
                    <td className="py-3 pr-4 text-right">{row.totalRequests.toLocaleString()}</td>
                    <td className="py-3 pr-4 text-right">
                      {formatBytes(row.totalBytesServed)}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              usage > 90
                                ? 'bg-destructive'
                                : usage > 70
                                  ? 'bg-yellow-500'
                                  : 'bg-primary'
                            }`}
                            style={{ width: `${Math.min(usage, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-16 text-right">
                          {formatBytes(row.usedBytes)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
