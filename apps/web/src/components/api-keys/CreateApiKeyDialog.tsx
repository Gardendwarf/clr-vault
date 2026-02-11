import { useState, type FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import type { ApiKeyCreatedResponse } from '@clr-vault/shared';
import { Copy, Check } from 'lucide-react';

interface CreateApiKeyDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const PERMISSIONS = ['read', 'write', 'delete', 'transform'] as const;

export function CreateApiKeyDialog({ open, onClose, onCreated }: CreateApiKeyDialogProps) {
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState<string[]>(['read']);
  const [rateLimit, setRateLimit] = useState('100');
  const [quotaGb, setQuotaGb] = useState('5');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const togglePermission = (perm: string) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await api.post<ApiKeyCreatedResponse>('/api/api-keys', {
        name: name.trim(),
        permissions,
        rateLimit: parseInt(rateLimit) || 100,
        quotaBytes: (parseInt(quotaGb) || 5) * 1024 * 1024 * 1024,
      });
      setCreatedKey(result.rawKey);
      onCreated();
    } catch {
      addToast({ title: 'Failed to create API key', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyKey = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setName('');
    setPermissions(['read']);
    setRateLimit('100');
    setQuotaGb('5');
    setCreatedKey(null);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{createdKey ? 'API Key Created' : 'Create API Key'}</DialogTitle>
          <DialogDescription>
            {createdKey
              ? 'Copy this key now. It will not be shown again.'
              : 'Create an API key for external app integrations'}
          </DialogDescription>
        </DialogHeader>

        {createdKey ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border bg-muted p-3">
              <code className="flex-1 break-all text-sm font-mono">{createdKey}</code>
              <Button variant="ghost" size="icon" onClick={copyKey}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Store this key securely. Use it in the <code className="text-xs bg-muted px-1 py-0.5 rounded">X-API-Key</code> header.
            </p>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="keyName"
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., clrOS Production"
              required
            />

            <div className="space-y-2">
              <label className="text-sm font-medium">Permissions</label>
              <div className="flex flex-wrap gap-2">
                {PERMISSIONS.map((perm) => (
                  <button
                    key={perm}
                    type="button"
                    onClick={() => togglePermission(perm)}
                    className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      permissions.includes(perm)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-input text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {perm}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                id="rateLimit"
                label="Rate Limit (req/min)"
                type="number"
                value={rateLimit}
                onChange={(e) => setRateLimit(e.target.value)}
                min="1"
                max="10000"
              />
              <Input
                id="quotaGb"
                label="Storage Quota (GB)"
                type="number"
                value={quotaGb}
                onChange={(e) => setQuotaGb(e.target.value)}
                min="1"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Create Key
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
