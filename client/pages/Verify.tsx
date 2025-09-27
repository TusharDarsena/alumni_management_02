import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function VerifyPage() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [valid, setValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const verify = async () => {
      if (!token || !email) {
        setValid(false);
        return;
      }
      try {
        const res = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`);
        const d = await res.json();
        if (!res.ok) {
          toast({ title: "Invalid link", description: d.message || "Verification link invalid" });
          setValid(false);
          return;
        }
        setValid(true);
      } catch (e: any) {
        toast({ title: "Error", description: e.message || "Network error" });
        setValid(false);
      }
    };
    verify();
  }, [email, token, toast]);

  const handleSetPassword = async () => {
    if (!newPassword) return toast({ title: "Error", description: "Please enter a password" });
    setLoading(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword }),
      });
      const d = await res.json();
      if (!res.ok) return toast({ title: "Error", description: d.message || "Failed to set password" });
      toast({ title: "Success", description: d.message || "Account verified" });
      navigate("/login");
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Network error" });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await res.json();
      if (!res.ok) return toast({ title: "Error", description: d.message || "Failed to resend" });
      toast({ title: "Verification sent", description: d.message });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Network error" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Complete account setup</h2>
        {valid === null && <div>Checking link...</div>}
        {valid === false && (
          <div>
            <p className="text-sm text-muted-foreground mb-4">This verification link is invalid or expired.</p>
            <div>
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleResend}>Resend verification</Button>
              <Button variant="ghost" onClick={() => navigate('/signup')}>Sign up</Button>
            </div>
          </div>
        )}
        {valid === true && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Set a secure password to activate your account.</p>
            <div>
              <Label>New password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSetPassword} disabled={loading}>{loading ? 'Saving...' : 'Set password & activate'}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
