import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { loginUser, setAccessToken } from '../lib/api';

interface LoginProps {
  onSuccess: () => void;
  onNavigateRegister: () => void;
}

export default function Login({ onSuccess, onNavigateRegister }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const res = await loginUser({ email, password });
      if (res?.access_token) {
        setAccessToken(res.access_token);
        toast.success('Logged in successfully');
        onSuccess();
      } else {
        toast.error('Login failed');
      }
    } catch (e: any) {
      toast.error(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-6 space-y-4">
        <h1 className="text-foreground">Login</h1>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button onClick={submit} disabled={loading || !email || !password} className="w-full bg-green-500 hover:bg-green-600 text-white">
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
          <button onClick={onNavigateRegister} className="w-full text-sm text-green-600 hover:underline">Create an account</button>
        </div>
      </Card>
    </div>
  );
}























