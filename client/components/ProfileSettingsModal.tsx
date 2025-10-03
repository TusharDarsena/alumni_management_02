import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/context/ThemeContext";

export type ModalInitialTab = "profile" | "settings";

export interface ProfileUser {
  name: string;
  email?: string;
  mobile?: string;
  location?: string;
  avatarUrl?: string;
}

interface ProfileSettingsModalProps {
  isOpen: boolean;
  initialTab: ModalInitialTab;
  onClose: () => void;
  user: ProfileUser;
  onSave?: (updated: ProfileUser) => Promise<void>;
}

export default function ProfileSettingsModal({ isOpen, initialTab, onClose, user, onSave }: ProfileSettingsModalProps) {
  const [form, setForm] = useState<ProfileUser>(user);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (isOpen) setForm(user);
  }, [isOpen, user]);

  const handleSave = async () => {
    await onSave?.(form);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Account</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden">
                  {form.avatarUrl ? (
                    <img src={form.avatarUrl} alt={form.name} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="text-sm text-slate-700">{form.name}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="your name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email account</Label>
                  <Input id="email" type="email" value={form.email ?? ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="yourname@gmail.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile number</Label>
                  <Input id="mobile" value={form.mobile ?? ""} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))} placeholder="Add number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" value={form.location ?? ""} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="City, Country" />
                </div>
              </div>

              <div className="pt-2">
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-4 space-y-4">
            <div className="text-sm text-slate-600">Manage account preferences and notifications.</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Input id="language" placeholder="English" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={(value) => value === "dark" ? toggleTheme() : value === "light" ? toggleTheme() : null}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
