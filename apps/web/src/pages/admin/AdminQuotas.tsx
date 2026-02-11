import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { QuotaDto } from '@clr-vault/shared';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import { formatBytes, percentUsed } from '@/lib/utils';
import { Pencil } from 'lucide-react';

export function AdminQuotasPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [editQuota, setEditQuota] = useState<QuotaDto | null>(null);
  const [quotaGb, setQuotaGb] = useState('');
  const [rateLimit, setRateLimit] = useState('');

  const quotasQuery = useQuery({
    queryKey: ['admin-quotas'],
    queryFn: () => api.get<QuotaDto[]>('/api/admin/quotas'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ apiKeyId, data }: { apiKeyId: string; data: Record<string, unknown> }) =>
      api.put(`/api/admin/quotas/${apiKeyId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quotas'] });
      setEditQuota(null);
      addToast({ title: 'Quota updated', variant: 'success' });
    },
    onError: () => {
      addToast({ title: 'Failed to update quota', variant: 'destructive' });
    },
  });

  const handleEdit = (quota: QuotaDto) => {
    setEditQuota(quota);
    setQuotaGb(String(Math.round(parseInt(quota.quotaBytes) / 1024 / 1024 / 1024)));
    setRateLimit(String(quota.rateLimit));
  };

  const handleSave = () => {
    if (!editQuota) return;

    const data: Record<string, unknown> = {};
    if (quotaGb) data.quotaBytes = parseInt(quotaGb) * 1024 * 1024 * 1024;
    if (rateLimit) data.rateLimit = parseInt(rateLimit);

    updateMutation.mutate({ apiKeyId: editQuota.apiKeyId, data });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quota Management</h1>
        <p className="text-sm text-muted-foreground">
          Manage storage quotas and rate limits for API keys
        </p>
      </div>

      {quotasQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (quotasQuery.data || []).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No API keys found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(quotasQuery.data || []).map((quota) => {
            const usage = percentUsed(quota.usedBytes, quota.quotaBytes);
            return (
              <Card key={quota.apiKeyId}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{quota.name}</h3>
                        <span className="text-xs font-mono text-muted-foreground">
                          {quota.appId}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Owner: {quota.userName || quota.userEmail}
                      </p>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>
                            {formatBytes(quota.usedBytes)} / {formatBytes(quota.quotaBytes)}
                          </span>
                          <span className="font-medium">{usage}%</span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
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
                          Rate limit: {quota.rateLimit} req/min
                        </p>
                      </div>
                    </div>

                    <Button variant="ghost" size="icon" onClick={() => handleEdit(quota)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editQuota} onOpenChange={() => setEditQuota(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Quota</DialogTitle>
            <DialogDescription>
              Update storage quota and rate limit for {editQuota?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              id="quotaGb"
              label="Storage Quota (GB)"
              type="number"
              value={quotaGb}
              onChange={(e) => setQuotaGb(e.target.value)}
              min="1"
            />
            <Input
              id="rateLimit"
              label="Rate Limit (req/min)"
              type="number"
              value={rateLimit}
              onChange={(e) => setRateLimit(e.target.value)}
              min="1"
              max="10000"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditQuota(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} isLoading={updateMutation.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
