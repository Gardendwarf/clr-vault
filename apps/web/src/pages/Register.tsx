import { RegisterForm } from '@/components/auth/RegisterForm';
import { Card, CardContent } from '@/components/ui/Card';

interface RegisterPageProps {
  onNavigate: (path: string) => void;
}

export function RegisterPage({ onNavigate }: RegisterPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <RegisterForm onSwitchToLogin={() => onNavigate('/login')} />
        </CardContent>
      </Card>
    </div>
  );
}
