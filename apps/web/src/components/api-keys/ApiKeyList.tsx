import type { ApiKeyDto } from '@clr-vault/shared';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { formatBytes, formatRelativeTime, percentUsed } from '@/lib/utils';
import { Copy, RefreshCw, Trash2, Shield, Clock } from 'lucide-react';

interface ApiKeyListProps {
  keys: ApiKeyDto[];
  onRefresh: () => void;
}

export function ApiKeyList({ keys, onRefresh }: ApiKeyListProps) {
  const { addToast } = useToast();

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete API key "${name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/api/api-keys/${id}`);
      addToast({ title: 'API key deleted', variant: 'success' });
      onRefresh();
    } catch {
      addToast({ title: 'Failed to delete API key', variant: 'destructive' });
    }
  };

  const handleRegenerate = async (id: string, name: string) => {
    if (!confirm(`Regenerate API key "${name}"? The old key will stop working immediately.`))
      return;
    try {
      const result = await api.post<{ apiKey: ApiKeyDto; rawKey: string }>(
        `/api/api-keys/${id}/regenerate`
      );
      navigator.clipboard.writeText(result.rawKey);
      addToast({
        title: 'API key regenerated and copied to clipboard',
        description: 'Store this key securely. It will not be shown again.',
        variant: 'success',
      });
      onRefresh();
    } catch {
      addToast({ title: 'Failed to regenerate API key', variant: 'destructive' });
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await api.put(`/api/api-keys/${id}`, { isActive: !isActive });
      addToast({
        title: `API key ${isActive ? 'deactivated' : 'activated'}`,
        variant: 'success',
      });
      onRefresh();
    } catch {
      addToast({ title: 'Failed to update API key', variant: 'destructive' });
    }
  };

  if (keys.length === 0) {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-lg font-medium text-muted-foreground">No API keys yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create an API key to allow external apps to access your assets
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {keys.map((key) => {
        const usage = percentUsed(key.usedBytes, key.quotaBytes);
        return (
          <Card key={key.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{key.name}</h3>
                  <Badge variant={key.isActive ? 'success' : 'secondary'}>
                    {key.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="font-mono text-xs">{key.keyPrefix}...</span>
                  <span>App ID: {key.appId}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {key.lastUsedAt ? formatRelativeTime(key.lastUsedAt) : 'Never used'}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  {key.permissions.map((p) => (
                    <Badge key={p} variant="outline" className="text-xs">
                      {p}
                    </Badge>
                  ))}
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Storage: {formatBytes(key.usedBytes)} / {formatBytes(key.quotaBytes)}</span>
                    <span>{usage}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${
                        usage > 90
                          ? 'bg-destructive'
                          : usage > 70
                            ? 'bg-yellow-500'
                            : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(usage, 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Rate limit: {key.rateLimit} req/min
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  title="Toggle active"
                  onClick={() => handleToggle(key.id, key.isActive)}
                >
                  <Shield className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Regenerate"
                  onClick={() => handleRegenerate(key.id, key.name)}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Delete"
                  onClick={() => handleDelete(key.id, key.name)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
