import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Images,
  Upload,
  FolderTree,
  Search,
  Key,
  BarChart3,
  Users,
  Gauge,
  Tag,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Assets', href: '/assets', icon: <Images className="h-5 w-5" /> },
  { label: 'Upload', href: '/upload', icon: <Upload className="h-5 w-5" /> },
  { label: 'Collections', href: '/collections', icon: <FolderTree className="h-5 w-5" /> },
  { label: 'Search', href: '/search', icon: <Search className="h-5 w-5" /> },
  { label: 'API Keys', href: '/api-keys', icon: <Key className="h-5 w-5" /> },
  { label: 'Analytics', href: '/analytics', icon: <BarChart3 className="h-5 w-5" /> },
  { label: 'Users', href: '/admin/users', icon: <Users className="h-5 w-5" />, adminOnly: true },
  { label: 'Quotas', href: '/admin/quotas', icon: <Gauge className="h-5 w-5" />, adminOnly: true },
];

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function Sidebar({ currentPath, onNavigate }: SidebarProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <aside className="flex w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">ClrVault</h1>
          <p className="text-xs text-muted-foreground">Digital Assets</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => {
            const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
            return (
              <button
                key={item.href}
                onClick={() => onNavigate(item.href)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
      </nav>

      <div className="border-t p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{user?.name || user?.email}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
