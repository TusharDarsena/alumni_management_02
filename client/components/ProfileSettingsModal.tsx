import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type ModalInitialTab = "profile" | "settings";

interface ProfileSettingsModalProps {
  isOpen: boolean;
  initialTab: ModalInitialTab;
  onClose: () => void;
}

export default function ProfileSettingsModal({ isOpen, initialTab, onClose }: ProfileSettingsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Account</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="mt-4 space-y-2">
            <p className="text-sm text-slate-600">Update your personal details, avatar, and bio.</p>
            <div className="rounded-md border p-4 text-sm">Profile form elements would go here.</div>
          </TabsContent>
          <TabsContent value="settings" className="mt-4 space-y-2">
            <p className="text-sm text-slate-600">Manage account preferences and notifications.</p>
            <div className="rounded-md border p-4 text-sm">Settings form elements would go here.</div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
