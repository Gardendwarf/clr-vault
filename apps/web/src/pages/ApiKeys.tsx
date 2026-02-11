import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ApiKeyDto } from '@clr-vault/shared';
import { api } from '@/lib/api';
import { ApiKeyList } from '@/components/api-keys/ApiKeyList';
import { CreateApiKeyDialog } from '@/components/api-keys/CreateApiKeyDialog';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';

export function ApiKeysPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const keysQuery = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => api.get<ApiKeyDto[]>('/api/api-keys'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-sm text-muted-foreground">
            Manage API keys for external app integrations
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create API Key
        </Button>
      </div>

      <ApiKeyList
        keys={keysQuery.data || []}
        onRefresh={() => keysQuery.refetch()}
      />

      <CreateApiKeyDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => keysQuery.refetch()}
      />
    </div>
  );
}
