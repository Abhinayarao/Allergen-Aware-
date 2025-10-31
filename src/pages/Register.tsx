import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { toast } from 'sonner@2.0.3';
import { registerUser, loginUser, setAccessToken } from '../lib/api';

interface RegisterProps {
  onSuccess: () => void;
  onNavigateLogin: () => void;
}

export default function Register({ onSuccess, onNavigateLogin }: RegisterProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await registerUser({ email, password, first_name: firstName, last_name: lastName });
      const res = await loginUser({ email, password });
      if (res?.access_token) {
        setAccessToken(res.access_token);
        toast.success('Account created');
        onSuccess();
      } else {
        toast.error('Registration succeeded but login failed');
      }
    } catch (e: any) {
      toast.error(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-6 space-y-4">
        <h1 className="text-foreground">Create Account</h1>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground">First name</label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Last name</label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button onClick={submit} disabled={loading || !email || !password} className="w-full bg-green-500 hover:bg-green-600 text-white">
            {loading ? 'Creating…' : 'Create Account'}
          </Button>
          <button onClick={onNavigateLogin} className="w-full text-sm text-green-600 hover:underline">Already have an account? Sign in</button>
        </div>
      </Card>
    </div>
  );
}







