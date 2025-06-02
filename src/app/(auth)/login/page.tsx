import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        {/* Icon and App Name are now inside LoginForm for better alignment */}
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card