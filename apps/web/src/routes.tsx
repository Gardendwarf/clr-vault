import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/Login';
import LandingPage from '@/components/LandingPage';
import { AssetsPage } from '@/pages/Assets';
import { UploadPage } from '@/pages/Upload';
import { CollectionsPage } from '@/pages/Collections';
import { SearchPage } from '@/pages/Search';
import { ApiKeysPage } from '@/pages/ApiKeys';
import { AnalyticsPage } from '@/pages/Analytics';
import { AdminUsersPage } from '@/pages/admin/AdminUsers';
import { AdminQuotasPage } from '@/pages/admin/AdminQuotas';

export function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState(() => {
    const path = window.location.pathname;
    return path === '/' ? '/assets' : path;
  });

  const navigate = useCallback((path: string) => {
    setCurrentPath(path);
    window.history.pushState({}, '', path);
  }, []);

  // Handle browser back/forward
  useState(() => {
    const handler = () => {
      setCurrentPath(window.location.pathname === '/' ? '/assets' : window.location.pathname);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const [showLanding, setShowLanding] = useState(true);

  if (!isAuthenticated && showLanding) {
    return <LandingPage onSignIn={() => setShowLanding(false)} />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const pageContent = useMemo(() => {
    switch (true) {
      case currentPath === '/assets':
        return <AssetsPage onNavigate={navigate} />;
      case currentPath === '/upload':
        return <UploadPage onNavigate={navigate} />;
      case currentPath === '/collections':
        return <CollectionsPage />;
      case currentPath === '/search':
        return <SearchPage />;
      case currentPath === '/api-keys':
        return <ApiKeysPage />;
      case currentPath === '/analytics':
        return <AnalyticsPage />;
      case currentPath === '/admin/users':
        return <AdminUsersPage />;
      case currentPath === '/admin/quotas':
        return <AdminQuotasPage />;
      default:
        return <AssetsPage onNavigate={navigate} />;
    }
  }, [currentPath, navigate]);

  return (
    <AppLayout currentPath={currentPath} onNavigate={navigate}>
      {pageContent}
    </AppLayout>
  );
}
