import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (k: string, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Image/Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-slate-900/90 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1920&q=80" 
          alt="University" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 flex flex-col justify-between p-12 h-full text-white">
          <div className="text-2xl font-bold tracking-wider">IIITNR ALUMNI</div>
          <div>
            <h2 className="text-4xl font-bold mb-4">Join the Community</h2>
            <p className="text-slate-300 text-lg max-w-md">
              Be part of a growing network of professionals. Share your journey, mentor students, and stay connected.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-xl space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold text-slate-900">Create your account</h1>
            <p className="mt-2 text-slate-600">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="h-11 mt-1"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="h-11 mt-1"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={form.dob}
                  onChange={(e) => handleChange("dob", e.target.value)}
                  className="h-11 mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="h-11 mt-1"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <Label htmlFor="graduationYear">Graduation Year</Label>
                <Input
                  id="graduationYear"
                  value={form.graduationYear}
                  onChange={(e) => handleChange("graduationYear", e.target.value)}
                  className="h-11 mt-1"
                  placeholder="2023"
                />
              </div>

              <div>
                <Label htmlFor="branch">Branch</Label>
                <Select value={form.branch} onValueChange={(v) => handleChange("branch", v)}>
                  <SelectTrigger className="h-11 mt-1">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CSE">CSE</SelectItem>
                    <SelectItem value="DSAI">DSAI</SelectItem>
                    <SelectItem value="ECE">ECE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="company">Current Company</Label>
                <Input
                  id="company"
                  value={form.company}
                  onChange={(e) => handleChange("company", e.target.value)}
                  className="h-11 mt-1"
                  placeholder="Acme Corp"
                />
              </div>

              <div>
                <Label htmlFor="job">Job Title</Label>
                <Input
                  id="job"
                  value={form.job}
                  onChange={(e) => handleChange("job", e.target.value)}
                  className="h-11 mt-1"
                  placeholder="Software Engineer"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="country">Country of Residence</Label>
                <Input
                  id="country"
                  value={form.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  className="h-11 mt-1"
                  placeholder="India"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-11 text-lg" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Register"}
            </Button>

            <p className="text-xs text-center text-slate-500 mt-4">
              By clicking register, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
