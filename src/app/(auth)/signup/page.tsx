import { SignupForm } from '@/components/auth/signup-form';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';

export default function SignupPage() {
  return (
    <Card className="w-full max-w-md shadow-xl">
       <CardHeader className="text-center">
        {/* Icon and App Name are now inside SignupForm for better alignment */}
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
    </Card>
  );
}