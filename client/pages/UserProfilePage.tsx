import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth, type Experience } from "@/hooks/useClerkAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Pencil,
  MapPin,
  Briefcase,
  GraduationCap,
  User,
  Mail,
  Phone,
  Calendar,
  Building2,
  Code,
  Plus,
  Trash2,
  X,
  Save,
  Linkedin
} from "lucide-react";

export default function UserProfilePage() {
  const { user, updateProfile, loading } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    username: user?.username || "",
    bio: user?.bio || "",
    graduationYear: user?.graduationYear || "",
    major: user?.major || "",
    company: user?.company || "",
    jobTitle: user?.jobTitle || "",
    phone: user?.phone || "",
    location: user?.location || "",
    linkedinUrl: user?.linkedinUrl || "",
    skills: user?.skills || [],
    experience: user?.experience || [],
  });

  const [newSkill, setNewSkill] = useState("");

  // Update form when user data loads
  React.useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        bio: user.bio || "",
        graduationYear: user.graduationYear || "",
        major: user.major || "",
        company: user.company || "",
        jobTitle: user.jobTitle || "",
        phone: user.phone || "",
        location: user.location || "",
        linkedinUrl: user.linkedinUrl || "",
        skills: user.skills || [],
        experience: user.experience || [],
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const handleAddExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        { company: "", title: "", from: "", to: "" },
      ],
    }));
  };

  const handleUpdateExperience = (index: number, field: keyof Experience, value: string) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      ),
    }));
  };

  const handleRemoveExperience = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await updateProfile(formData);
      if (success) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been saved successfully.",
        });
        setIsEditing(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to update profile. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to current user data
    if (user) {
      setFormData({
        username: user.username || "",
        bio: user.bio || "",
        graduationYear: user.graduationYear || "",
        major: user.major || "",
        company: user.company || "",
        jobTitle: user.jobTitle || "",
        phone: user.phone || "",
        location: user.location || "",
        linkedinUrl: user.linkedinUrl || "",
        skills: user.skills || [],
        experience: user.experience || [],
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <DashboardLayout activePage="Profile" onNavigate={() => { }} user={{ name: "Loading...", avatarUrl: "" }}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.username || "User";

  return (
    <DashboardLayout
      activePage="Profile"
      onNavigate={() => { }}
      user={{ name: displayName, avatarUrl: user?.avatarUrl || user?.imageUrl || "" }}
    >
      {/* Header with Edit Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="gap-2">
            <Pencil className="w-4 h-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      {/* Profile Card with Banner */}
      <Card className="overflow-hidden mb-6 shadow-lg">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-br from-primary via-primary/80 to-accent relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTItNCAwLTQgMiAwIDQgMiA0czQtMiA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
        </div>

        <CardContent className="relative pt-0 px-6 pb-6">
          {/* Avatar */}
          <div className="relative -mt-16 mb-4 flex items-end gap-4">
            <div className="w-28 h-28 rounded-2xl border-4 border-card bg-muted overflow-hidden ring-4 ring-primary/20 shadow-xl flex-shrink-0">
              {user?.avatarUrl || user?.imageUrl ? (
                <img
                  src={user.avatarUrl || user.imageUrl || ""}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <User className="w-12 h-12 text-primary/50" />
                </div>
              )}
            </div>
            <div className="pb-2">
              <h2 className="text-2xl font-bold text-foreground">{displayName}</h2>
              <p className="text-muted-foreground">
                {user?.jobTitle || "No title"} {user?.company ? `at ${user.company}` : ""}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - About & Details */}
        <div className="space-y-6">
          {/* About Card */}
          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-primary" />
                About
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Write something about yourself..."
                  className="min-h-[100px]"
                  maxLength={500}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {user?.bio || "No bio added yet. Click edit to add one."}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Contact & Details Card */}
          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="w-5 h-5 text-primary" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {/* Graduation Year */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground w-28 flex-shrink-0">Graduation Year:</span>
                {isEditing ? (
                  <Input
                    value={formData.graduationYear}
                    onChange={(e) => handleInputChange("graduationYear", e.target.value)}
                    placeholder="2024"
                    className="h-8 flex-1"
                  />
                ) : (
                  <span className="font-medium">{user?.graduationYear || "Not set"}</span>
                )}
              </div>

              {/* Major */}
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground w-28 flex-shrink-0">Major:</span>
                {isEditing ? (
                  <Input
                    value={formData.major}
                    onChange={(e) => handleInputChange("major", e.target.value)}
                    placeholder="Computer Science"
                    className="h-8 flex-1"
                  />
                ) : (
                  <span className="font-medium">{user?.major || user?.branch || "Not set"}</span>
                )}
              </div>

              {/* Company */}
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground w-28 flex-shrink-0">Company:</span>
                {isEditing ? (
                  <Input
                    value={formData.company}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    placeholder="Acme Corp"
                    className="h-8 flex-1"
                  />
                ) : (
                  <span className="font-medium">{user?.company || "Not set"}</span>
                )}
              </div>

              {/* Job Title */}
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground w-28 flex-shrink-0">Job Title:</span>
                {isEditing ? (
                  <Input
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                    placeholder="Software Engineer"
                    className="h-8 flex-1"
                  />
                ) : (
                  <span className="font-medium">{user?.jobTitle || "Not set"}</span>
                )}
              </div>

              {/* Phone */}
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground w-28 flex-shrink-0">Phone:</span>
                {isEditing ? (
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+91 98765 43210"
                    className="h-8 flex-1"
                  />
                ) : (
                  <span className="font-medium">{user?.phone || "Not set"}</span>
                )}
              </div>

              {/* Location */}
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground w-28 flex-shrink-0">Location:</span>
                {isEditing ? (
                  <Input
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Bangalore, India"
                    className="h-8 flex-1"
                  />
                ) : (
                  <span className="font-medium">{user?.location || "Not set"}</span>
                )}
              </div>

              {/* Email (read-only) */}
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground w-28 flex-shrink-0">Email:</span>
                <span className="font-medium">{user?.email || "Not set"}</span>
              </div>

              {/* LinkedIn URL */}
              <div className="flex items-center gap-2">
                <Linkedin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground w-28 flex-shrink-0">LinkedIn:</span>
                {isEditing ? (
                  <Input
                    value={formData.linkedinUrl}
                    onChange={(e) => handleInputChange("linkedinUrl", e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="h-8 flex-1"
                  />
                ) : user?.linkedinUrl ? (
                  <a
                    href={user.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Profile Link
                  </a>
                ) : (
                  <span className="font-medium">Not set</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Skills & Experience */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skills Card */}
          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Code className="w-5 h-5 text-primary" />
                Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a skill..."
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                    />
                    <Button type="button" variant="outline" onClick={handleAddSkill}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-destructive ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {user?.skills && user.skills.length > 0 ? (
                    user.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No skills added yet.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Experience Card */}
          <Card className="shadow-md">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Briefcase className="w-5 h-5 text-primary" />
                Experience
              </CardTitle>
              {isEditing && (
                <Button type="button" variant="outline" size="sm" onClick={handleAddExperience}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  {formData.experience.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No experience added. Click "Add" to add your work history.</p>
                  ) : (
                    formData.experience.map((exp, index) => (
                      <div key={index} className="p-4 border border-border rounded-lg space-y-3 relative">
                        <button
                          type="button"
                          onClick={() => handleRemoveExperience(index)}
                          className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label>Company</Label>
                            <Input
                              value={exp.company}
                              onChange={(e) => handleUpdateExperience(index, "company", e.target.value)}
                              placeholder="Company name"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Title</Label>
                            <Input
                              value={exp.title}
                              onChange={(e) => handleUpdateExperience(index, "title", e.target.value)}
                              placeholder="Job title"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>From</Label>
                            <Input
                              value={exp.from}
                              onChange={(e) => handleUpdateExperience(index, "from", e.target.value)}
                              placeholder="2021"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>To</Label>
                            <Input
                              value={exp.to || ""}
                              onChange={(e) => handleUpdateExperience(index, "to", e.target.value)}
                              placeholder="Present"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {user?.experience && user.experience.length > 0 ? (
                    user.experience.map((exp, index) => (
                      <div key={index} className="flex gap-4 group">
                        {/* Timeline dot */}
                        <div className="flex flex-col items-center pt-1">
                          <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-primary/20" />
                          {index < (user.experience?.length || 0) - 1 && (
                            <div className="w-0.5 flex-1 mt-2 bg-gradient-to-b from-primary/30 to-border min-h-[30px]" />
                          )}
                        </div>
                        {/* Content */}
                        <div className="flex-1 pb-4">
                          <h4 className="font-semibold text-foreground">{exp.title}</h4>
                          <p className="text-sm text-primary">{exp.company}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {exp.from} — {exp.to || "Present"}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No experience added yet.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
