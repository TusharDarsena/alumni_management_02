import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await login(email, password);
    if (!res.success) {
      setError(res.message || 'Login failed');
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="text-xl font-extrabold tracking-wide">UTOPIA</div>
            <Button variant="ghost" onClick={() => navigate("/")}>{"<"} Back</Button>
          </div>
          <h1 className="text-2xl font-bold">Account Login</h1>
          <p className="text-sm text-slate-600 mt-1">
            If you are already a member you can login with your email address and password.
          </p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" placeholder="sampleuser@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              Remember me
            </label>
            <Button type="submit" className="w-full">Login</Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account? <Link to="/signup" className="text-primary underline">Sign up here.</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
