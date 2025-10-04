import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function ImportUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFile = (f: File | null) => {
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please choose a JSON file to import.",
      });
      return;
    }

    setUploading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        toast({
          title: "Invalid file",
          description: "JSON must be an array of alumni objects.",
        });
        setUploading(false);
        return;
      }

      const res = await fetch("/api/alumni/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        toast({
          title: "Import failed",
          description: json.error || json.message || "Server error",
        });
      } else {
        toast({
          title: "Import complete",
          description: `Processed ${json.processed || 0} entries.`,
        });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to import" });
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  return (
    <div className="w-full p-4 bg-white border border-gray-100 rounded-md mb-4">
      <h3 className="text-lg font-medium mb-2">Bulk Import Alumni</h3>
      <p className="text-sm text-gray-600 mb-3">
        Upload a JSON file containing an array of alumni objects. Upserts on
        linkedin_id.
      </p>
      <div className="flex items-center gap-3">
        <Input
          type="file"
          accept="application/json"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <Button onClick={handleUpload} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </div>
    </div>
  );
}
