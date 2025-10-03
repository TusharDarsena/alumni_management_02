import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function VerifyOtpPage() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState("");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let t: any;
    if (expiresAt) {
      t = setInterval(() => {
        const rem = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        setCountdown(rem);
        if (rem <= 0) clearInterval(t);
      }, 1000);
    }
    return () => clearInterval(t);
  }, [expiresAt]);

  const handleVerify = async () => {
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const d = await res.json();
      if (!res.ok)
        return toast({
          title: "Error",
          description: d.message || "Verification failed",
        });
      toast({ title: "Verified", description: d.message });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Network error" });
    }
  };

  const handleResend = async () => {
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await res.json();
      if (!res.ok)
        return toast({
          title: "Error",
          description: d.message || "Failed to resend",
        });
      toast({ title: "OTP sent", description: d.message });
      // naive: set expiry to now + 10min
      setExpiresAt(Date.now() + 10 * 60 * 1000);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Network error" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Verify Email</h2>
        <div className="space-y-3">
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>OTP</Label>
            <Input value={otp} onChange={(e) => setOtp(e.target.value)} />
          </div>
          {countdown > 0 && (
            <div className="text-sm text-muted-foreground">
              OTP expires in: {countdown}s
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={handleVerify}>Verify</Button>
            <Button variant="ghost" onClick={handleResend}>
              Resend OTP
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
