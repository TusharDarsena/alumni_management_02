import React, { useState, useRef } from "react";
import * as xlsx from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertTriangle, Play, RotateCcw } from "lucide-react";
import { useScraping, ScrapeProfile } from "@/context/ScrapingContext";

export default function ImportUpload() {
  const { isProcessing, progress, logs, failedQueue, startScraping } = useScraping();
  
  // Changed state to store full profile objects, not just names
  const [pendingProfiles, setPendingProfiles] = useState<ScrapeProfile[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("2021-2025");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const batches = [
    "2016-2020", "2017-2021", "2018-2022", "2019-2023", 
    "2020-2024", "2021-2025", "2022-2026", "2023-2027", "2024-2028"
  ];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isProcessing) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = xlsx.read(data, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const json = xlsx.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);

      // --- IMPROVED PARSING LOGIC ---
      const parsedProfiles: ScrapeProfile[] = json.map((row) => {
          const keys = Object.keys(row);
          
          // 1. Find Name Column (Look for 'Name', 'Person Info', 'Student Name')
          const nameKey = keys.find(k => {
             const clean = k.trim().toLowerCase();
             return clean === "name" || clean === "person info" || clean === "student name" || clean === "candidate name";
          });

          // 2. Find URL Column (Look for 'LinkedIn URL', 'URL', 'Link')
          const urlKey = keys.find(k => {
             const clean = k.trim().toLowerCase();
             return clean.includes("linkedin") || clean === "url" || clean === "profile link";
          });

          if (!nameKey || !row[nameKey]) return null;

          return {
              name: row[nameKey],
              batch: selectedBatch, // Will be updated on confirm
              url: urlKey ? row[urlKey] : undefined
          } as ScrapeProfile;
      }).filter((p): p is ScrapeProfile => p !== null);

      if (parsedProfiles.length === 0) {
        toast({ title: "Invalid file", description: "Could not find a Name or Person Info column.", variant: "destructive" });
        return;
      }

      setPendingProfiles(parsedProfiles);
      setShowConfirmModal(true);

    } catch (err: any) {
      toast({ title: "Error reading file", description: err.message, variant: "destructive" });
    }
  };

  const handleStartConfirm = () => {
    // Update the batch for all profiles before sending
    const finalProfiles = pendingProfiles.map(p => ({
        ...p,
        batch: selectedBatch
    }));

    startScraping(finalProfiles, false);
    setShowConfirmModal(false);
    setPendingProfiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRetryFailed = () => {
    startScraping(failedQueue, true);
  };

  const percentage = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;
  const directUrlCount = pendingProfiles.filter(p => p.url).length;

  return (
    <div className="w-full space-y-4">
      <Card className={isProcessing ? "opacity-50 pointer-events-none" : ""}>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold">Bulk Scrape Alumni</h3>
              <p className="text-sm text-gray-500">
                Upload Excel. Supported columns: <strong>"Person Info"</strong> (Name) and <strong>"LinkedIn URL"</strong>.
              </p>
            </div>
            
            <div className="flex gap-4">
              <select 
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {batches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>

              <Input ref={fileInputRef} type="file" accept=".xlsx, .xls" onChange={handleFileSelect} disabled={isProcessing} className="flex-1" />
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96 space-y-4 animate-in fade-in zoom-in">
             <h3 className="font-bold text-lg text-blue-600">Confirm Bulk Scrape</h3>
             <div className="space-y-1 text-sm text-gray-600">
                <p>Found <strong>{pendingProfiles.length}</strong> profiles.</p>
                {directUrlCount > 0 && (
                    <p className="text-green-600 font-medium">
                        ✨ {directUrlCount} contain direct LinkedIn URLs (Skipping Search).
                    </p>
                )}
                <p>Applying Batch: <strong>{selectedBatch}</strong></p>
             </div>
             <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
                <Button onClick={handleStartConfirm}><Play className="h-4 w-4 mr-2" /> Start</Button>
             </div>
          </div>
        </div>
      )}

      {/* Retry Card */}
      {!isProcessing && failedQueue.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 animate-in slide-in-from-top-2">
          <CardContent className="pt-6 flex justify-between items-center">
            <div>
              <h4 className="font-bold text-amber-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> 
                {failedQueue.length} Profiles Failed
              </h4>
              <p className="text-sm text-amber-700 mt-1">Retry using BrightData Fallback?</p>
            </div>
            <Button onClick={handleRetryFailed} variant="default" className="bg-amber-600 hover:bg-amber-700 text-white">
              <RotateCcw className="h-4 w-4 mr-2" /> Retry Selection
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Progress Bar & Logs */}
      {(isProcessing || logs.length > 0) && (
        <Card className="border-blue-100 shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <h4 className="font-bold text-gray-700 flex items-center gap-2">
                  {isProcessing ? <Loader2 className="animate-spin text-blue-500" /> : <CheckCircle2 className="text-green-500" />} 
                  {isProcessing ? "Scraping..." : "Done"}
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  {isProcessing ? `Current: ${progress.currentName}` : "Finished"}
                </p>
              </div>
              <div className="text-2xl font-bold text-blue-600">{percentage}%</div>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${percentage}%` }} />
            </div>
            <div className="mt-4 p-3 bg-slate-950 text-green-400 rounded-md h-48 overflow-y-auto font-mono text-xs">
              {logs.map((log, i) => <div key={i} className="border-b border-slate-800/50 py-1">{log}</div>)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}