import { useQuery } from '@tanstack/react-query';
import type { StorageOverviewDto, AdminUserDto } from '@clr-vault/shared';
import { api } from '@/lib/api';
import { StorageOverview } from '@/components/analytics/StorageOverview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

export function AdminDashboardPage() {
  const overviewQuery = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => api.get<StorageOverviewDto>('/api/analytics/overview'),
  });

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get<AdminUserDto[]>('/api/admin/users'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          System overview and management
        </p>
      </div>

      <StorageOverview data={overviewQuery.data} isLoading={overviewQuery.isLoading} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Users</CardTitle>
        </CardHeader>
        <CardContent>
          {usersQuery.isLoading ? (
            <div className="h-32 animate-pulse rounded bg-muted" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4 font-medium text-muted-foreground">User</th>
                    <th className="py-2 pr-4 font-medium text-muted-foreground">Role</th>
                    <th className="py-2 pr-4 font-medium text-muted-foreground">Status</th>
                    <th className="py-2 pr-4 font-medium text-muted-foreground text-right">
                      API Keys
                    </th>
                    <th className="py-2 font-medium text-muted-foreground">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {(usersQuery.data || []).slice(0, 10).map((user) => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <p className="font-medium">{user.name || user.email}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={user.isActive ? 'success' : 'destructive'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-right">{user.apiKeyCount}</td>
                      <td className="py-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
