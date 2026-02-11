import { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Card, CardContent } from '@/components/ui/Card';

export function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          {isRegister ? (
            <RegisterForm onSwitchToLogin={() => setIsRegister(false)} />
          ) : (
            <LoginForm onSwitchToRegister={() => setIsRegister(true)} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
