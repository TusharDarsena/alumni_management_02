import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { type UserInfo } from "@/components/Header";

export default function ImportPage() {
  const [user] = useState<UserInfo>({
    name: "Merna",
    email: "merna@example.com",
  });
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setResult(null);
    setError(null);

    try {
      const allEntries: any[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const text = await f.text();
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) allEntries.push(...parsed);
          else if (parsed && parsed.data && Array.isArray(parsed.data))
            allEntries.push(...parsed.data);
        } catch (e) {
          console.error("Error parsing file", f.name, e);
        }
      }

      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(allEntries),
        credentials: "include",
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json?.message || json?.error || "Upload failed");
      } else {
        setResult(json);
      }
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout activePage="Import Data" onNavigate={() => {}} user={user}>
      <div className="space-y-4">
        <div className="p-4 border rounded-lg bg-white">
          <div className="mb-2 font-semibold">Upload JSON files</div>
          <input
            type="file"
            accept=".json,application/json"
            multiple
            onChange={handleChange}
          />
          <div className="mt-4">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
              onClick={handleUpload}
              disabled={uploading || !files}
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
          {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
          {result && (
            <div className="mt-3 text-sm text-green-600">
              Processed: {result.processed} • Upserted: {result.upserted} •
              Modified: {result.modified}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
