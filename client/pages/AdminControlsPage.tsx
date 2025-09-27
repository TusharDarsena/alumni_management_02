import React, { useState } from "react";
import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { type UserInfo } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PendingUsersTable from "@/components/PendingUsersTable";
import { useToast } from "@/hooks/use-toast";

interface NewUser {
  name: string;
  email: string;
  company: string;
  job: string;
  phone: string;
  password: string;
  dob: string;
  country: string;
  graduationYear: string;
  branch: string;
  photo?: File | null;
}

export default function AdminControlsPage() {
  const [user] = useState<UserInfo>({ name: "Merna", email: "merna@example.com" });
  const [form, setForm] = useState<NewUser>({
    name: "",
    email: "",
    company: "",
    job: "",
    phone: "",
    password: "",
    dob: "",
    country: "",
    graduationYear: "",
    branch: "",
    photo: null,
  });

  const [mode, setMode] = useState<"add" | "requests">("add");

  const handleChange = (key: keyof NewUser, value: string | File | null) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.phone || !form.branch || !form.password) {
      toast({ title: "Missing fields", description: "Please fill name, email, phone, password and branch." });
      return;
    }

    if (!["CSE", "DSAI", "ECE"].includes(form.branch)) {
      toast({ title: "Invalid branch" });
      return;
    }

    if (!window.confirm("Are you sure you want to add this user?")) return;

    try {
      const res = await fetch("/api/admin/add-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          username: form.name,
          password: form.password,
          role: form.job === "admin" ? "admin" : form.job === "faculty" ? "faculty" : "student",
          phone: form.phone,
          branch: form.branch,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast({ title: "Error", description: data.message || "Failed to create user" });
        return;
      }
      toast({ title: "User created", description: "User created and notification email sent." });
      setForm({ name: "", email: "", company: "", job: "", phone: "", password: "", dob: "", country: "", graduationYear: "", branch: "", photo: null });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Request failed" });
    }
  };

  return (
    <DashboardLayout activePage="Admin Controls" onNavigate={(p) => console.log("navigate", p)} user={user} fullWidth>
      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{mode === "add" ? "Add User" : "Requests"}</h2>
        <div className="flex items-center gap-3">
          <Button variant={mode === "add" ? "default" : "ghost"} onClick={() => setMode("add")}>
            Add User
          </Button>
          <Button variant={mode === "requests" ? "secondary" : "ghost"} onClick={() => setMode("requests")}>
            Requests
          </Button>
        </div>
      </div>

      {mode === "add" ? (
        <Card className="mt-6 w-full">
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => handleChange("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Current Company</Label>
              <Input id="company" value={form.company} onChange={(e) => handleChange("company", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job">Role</Label>
              <select id="job" value={form.job} onChange={(e) => handleChange("job", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="alumni">Alumni</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date Of Birth</Label>
              <Input id="dob" type="date" value={form.dob} onChange={(e) => handleChange("dob", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country Of Residence</Label>
              <Input id="country" value={form.country} onChange={(e) => handleChange("country", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year Of Graduation</Label>
              <Input id="year" value={form.graduationYear} onChange={(e) => handleChange("graduationYear", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <select id="branch" value={form.branch} onChange={(e) => handleChange("branch", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Select branch</option>
                <option value="CSE">CSE</option>
                <option value="DSAI">DSAI</option>
                <option value="ECE">ECE</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="photo">Add Photo</Label>
              <Input id="photo" type="file" onChange={(e) => handleChange("photo", e.target.files?.[0] ?? null)} />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <Button variant="ghost" onClick={() => setForm({ name: "", email: "", company: "", job: "", phone: "", password: "", dob: "", country: "", graduationYear: "", branch: "", photo: null })}>
                Reset
              </Button>
              <Button onClick={handleSubmit}>Add User</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <PendingUsersTable />
      )}
    </DashboardLayout>
  );
}
