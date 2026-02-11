import { useState } from 'react';
import type { CollectionDto } from '@clr-vault/shared';
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
import { api } from '@/lib/api';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface CollectionBrowserProps {
  collection: CollectionDto | null;
  onRefresh: () => void;
}

export function CollectionBrowser({ collection, onRefresh }: CollectionBrowserProps) {
  const { addToast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post('/api/collections', {
        name: name.trim(),
        parentId: collection?.id,
      });
      addToast({ title: 'Collection created', variant: 'success' });
      setName('');
      setIsCreateOpen(false);
      onRefresh();
    } catch {
      addToast({ title: 'Failed to create collection', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!collection || !name.trim()) return;
    setIsSubmitting(true);
    try {
      await api.put(`/api/collections/${collection.id}`, { name: name.trim() });
      addToast({ title: 'Collection updated', variant: 'success' });
      setName('');
      setIsEditOpen(false);
      onRefresh();
    } catch {
      addToast({ title: 'Failed to update collection', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!collection) return;
    if (!confirm(`Delete "${collection.name}"? Assets will not be deleted.`)) return;
    try {
      await api.delete(`/api/collections/${collection.id}`);
      addToast({ title: 'Collection deleted', variant: 'success' });
      onRefresh();
    } catch (err) {
      addToast({
        title: 'Failed to delete collection',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setName('');
          setIsCreateOpen(true);
        }}
      >
        <Plus className="mr-1 h-4 w-4" /> New Collection
      </Button>

      {collection && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setName(collection.name);
              setIsEditOpen(true);
            }}
          >
            <Pencil className="mr-1 h-4 w-4" /> Rename
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-1 h-4 w-4" /> Delete
          </Button>
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Collection</DialogTitle>
            <DialogDescription>
              {collection
                ? `Create a sub-collection inside "${collection.name}"`
                : 'Create a new top-level collection'}
            </DialogDescription>
          </DialogHeader>
          <Input
            id="collectionName"
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Collection name"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} isLoading={isSubmitting}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Collection</DialogTitle>
            <DialogDescription>Change the name of this collection</DialogDescription>
          </DialogHeader>
          <Input
            id="editCollectionName"
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New name"
            onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} isLoading={isSubmitting}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
