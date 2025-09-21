
import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { type UserInfo } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NewUser {
  name: string;
  email: string;
  company: string;
  job: string;
  phone: string;
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
    dob: "",
    country: "",
    graduationYear: "",
    branch: "",
    photo: null,
  });

  const handleChange = (key: keyof NewUser, value: string | File | null) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = () => {
    const output = { ...form, photo: form.photo ? form.photo.name : undefined };
    console.log(output);
  };

  return (
    <DashboardLayout activePage="Admin Controls" onNavigate={(p) => console.log("navigate", p)} user={user}>
      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Add User</h2>
        <div className="flex items-center gap-3">
          <Button onClick={handleSubmit}>Add User</Button>
          <Button variant="secondary">Requests</Button>
        </div>
      </div>

      <Card className="mt-6">
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
            <Label htmlFor="job">Current job</Label>
            <Input id="job" value={form.job} onChange={(e) => handleChange("job", e.target.value)} />
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
            <Input id="branch" value={form.branch} onChange={(e) => handleChange("branch", e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="photo">Add Photo</Label>
            <Input id="photo" type="file" onChange={(e) => handleChange("photo", e.target.files?.[0] ?? null)} />
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
