import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

function strengthInfo(pwd: string) {
  const length = pwd.length >= 8;
  const upper = /[A-Z]/.test(pwd);
  const lower = /[a-z]/.test(pwd);
  const digit = /\d/.test(pwd);
  const special = /[^A-Za-z0-9]/.test(pwd);
  const checks = [length, upper, lower, digit, special];
  const score = checks.filter(Boolean).length;
  return { length, upper, lower, digit, special, score };
}

export default function FirstLoginPasswordChange() {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const info = useMemo(() => strengthInfo(pwd), [pwd]);
  const canSubmit = pwd.length > 0 && pwd === confirm && info.score >= 4;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!canSubmit) return;
    try {
      setLoading(true);
      const res = await fetch("/api/auth/change-password-first", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword: pwd }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Failed to update password");
        return;
      }
      setSuccess("Password updated. Redirecting to portal...");
      await refresh();
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 space-y-4">
          <h1 className="text-2xl font-bold">Update your password</h1>
          <p className="text-sm text-slate-600">
            For security, you must set a new password before accessing the portal.
          </p>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pwd">New password</Label>
              <Input id="pwd" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <div className={info.length ? "text-green-600" : "text-slate-600"}>• At least 8 characters</div>
              <div className={info.upper ? "text-green-600" : "text-slate-600"}>• Contains an uppercase letter</div>
              <div className={info.lower ? "text-green-600" : "text-slate-600"}>• Contains a lowercase letter</div>
              <div className={info.digit ? "text-green-600" : "text-slate-600"}>• Contains a number</div>
              <div className={info.special ? "text-green-600" : "text-slate-600"}>• Contains a special character</div>
            </div>

            {pwd && confirm && pwd !== confirm && (
              <div className="text-xs text-destructive">Passwords do not match.</div>
            )}

            {error && <div className="text-sm text-destructive">{error}</div>}
            {success && <div className="text-sm text-green-600">{success}</div>}

            <Button type="submit" className="w-full" disabled={!canSubmit || loading}>
              {loading ? "Updating..." : "Update password"}
            </Button>
          </form>
          <div className="text-center text-sm">
            Need help? <a className="text-primary underline" href="/help">Visit support</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
