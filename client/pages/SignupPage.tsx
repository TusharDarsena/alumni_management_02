import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function SignupPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "alumni",
    dob: "",
    graduationYear: "",
    branch: "",
    company: "",
    job: "",
    phone: "",
    country: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (k: string, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          username: form.name,
          role: form.role,
          phone: form.phone,
          branch: form.branch,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Signup failed");
        return;
      }
      toast({
        title: "OTP sent",
        description: "Please verify your email to complete registration.",
      });
      navigate(`/verify-otp?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-6">
      <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="px-6">
          <div className="h-12 w-12 rounded-full bg-slate-100 mb-6" />
          <h1 className="text-4xl font-serif font-bold">
            Let\'s Get you registered
          </h1>
          <p className="mt-4 text-slate-600 max-w-lg">
            The Alumni Management Cell is here to stay connected. Reach out with
            your queries, updates, or collaborations, and we'll get back to you
            promptly.
          </p>

          <div className="mt-8 text-sm text-slate-600">
            Contact us at - faculty@iiitnr.edu.in
          </div>
        </div>

        <form onSubmit={handleSignup} className="px-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>

            <div className="col-span-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>

            <div className="col-span-2">
              <Label>Role</Label>
              <div className="w-full px-3 py-2 border border-gray-100 rounded-md text-sm text-slate-600">
                Alumni (self-registration)
              </div>
            </div>

            <div>
              <Label>Date Of Birth</Label>
              <Input
                type="date"
                value={form.dob}
                onChange={(e) => handleChange("dob", e.target.value)}
              />
            </div>

            <div>
              <Label>Year Of Graduation</Label>
              <Input
                value={form.graduationYear}
                onChange={(e) => handleChange("graduationYear", e.target.value)}
              />
            </div>

            <div className="col-span-2">
              <Label>Branch</Label>
              <select
                value={form.branch}
                onChange={(e) => handleChange("branch", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select branch</option>
                <option value="CSE">CSE</option>
                <option value="DSAI">DSAI</option>
                <option value="ECE">ECE</option>
              </select>
            </div>

            <div>
              <Label>Current Company</Label>
              <Input
                value={form.company}
                onChange={(e) => handleChange("company", e.target.value)}
              />
            </div>

            <div>
              <Label>Current job</Label>
              <Input
                value={form.job}
                onChange={(e) => handleChange("job", e.target.value)}
              />
            </div>

            <div>
              <Label>Phone Number</Label>
              <Input
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>

            <div>
              <Label>Country Of Residence</Label>
              <Input
                value={form.country}
                onChange={(e) => handleChange("country", e.target.value)}
              />
            </div>

            {error && (
              <div className="col-span-2 text-sm text-destructive">{error}</div>
            )}

            <div className="col-span-2 mt-4">
              <Button type="submit" className="bg-black text-white">
                Register
              </Button>
            </div>

            <div className="col-span-2 text-sm text-center text-slate-600">
              Already registered?{" "}
              <Link to="/login" className="text-primary underline">
                Sign in
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
