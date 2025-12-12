import React, { useState, useRef } from "react";
import * as xlsx from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertTriangle, Play, RotateCcw, FileSpreadsheet } from "lucide-react";
import { useScraping, ScrapeProfile } from "@/context/ScrapingContext";

export default function DirectBatchScraper() {
  const { isProcessing, progress, logs, failedQueue, startScraping, cancelScraping } = useScraping();
  
  // --- DYNAMIC BATCH GENERATOR ---
  const batches = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const isAfterJune = new Date().getMonth() >= 6; // July or later
    const latestYear = isAfterJune ? currentYear : currentYear - 1;
    const startYear = 2015; // Your college start year
    
    const list = [];
    for (let y = startYear; y <= latestYear; y++) {
      list.push(`${y}-${y + 4}`);
    }
    return list.reverse(); // Newest first
  }, []);

  const [pendingProfiles, setPendingProfiles] = useState<ScrapeProfile[]>([]);
  const [selectedBatch, setSelectedBatch] = useState(batches[0]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isProcessing) {
      toast({ title: "Busy", description: "Wait for current scrape to finish.", variant: "destructive" });
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = xlsx.read(data, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = xlsx.utils.sheet_to_json<any>(worksheet);

      // Parse Name and LinkedIn URL
      const profiles: ScrapeProfile[] = json
        .map((row) => {
          // Find keys case-insensitively - Robust matching
          const nameKey = Object.keys(row).find((k) => k.trim().toLowerCase() === "name");
          
          // Look for various common headers for LinkedIn URL
          const urlKey = Object.keys(row).find((k) => {
            const key = k.trim().toLowerCase();
            return key === "linkedin" || key === "linkedin url" || key === "url" || key === "profile link" || key.includes("linkedin");
          });
          
          const name = nameKey ? row[nameKey] : null;
          const url = urlKey ? row[urlKey] : null;

          // Relaxed validation: Just ensure we have strings
          if (name && url && typeof name === 'string' && typeof url === 'string') {
            return {
              name: name.trim(),
              batch: selectedBatch, // Will be updated with current selection
              linkedinUrl: url.trim()
            } as ScrapeProfile;
          }
          return null;
        })
        .filter((p): p is ScrapeProfile => p !== null);

      if (profiles.length === 0) {
        toast({ title: "Invalid file", description: "No valid rows found. Ensure columns 'Name' and 'LinkedIn URL' exist.", variant: "destructive" });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setPendingProfiles(profiles);
      setShowConfirmModal(true);
    } catch (err: any) {
      toast({ title: "Error reading file", description: err.message, variant: "destructive" });
    }
  };

  const handleStartConfirm = () => {
    // Update batch for all profiles based on current selection
    const finalProfiles = pendingProfiles.map(p => ({
      ...p,
      batch: selectedBatch
    }));

    startScraping(finalProfiles, false);
    setShowConfirmModal(false);
    setPendingProfiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setPendingProfiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // UI Logic
  const percentage = progress.total > 0 
    ? Math.round((progress.processed / progress.total) * 100) 
    : 0;

  return (
    <Card className="w-full border-t-4 border-t-purple-600 shadow-md mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Bulk Direct Scraper (Excel with URLs)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* 1. Upload Section */}
        {!isProcessing && (
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Upload Excel (Name + LinkedIn URL)</label>
              <Input 
                ref={fileInputRef}
                type="file" 
                accept=".xlsx, .xls" 
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
            </div>
            
            <div className="w-[140px] space-y-2">
              <label className="text-sm font-medium">Batch</label>
              <select 
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {batches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* 2. Progress Section */}
        {isProcessing && (
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-slate-700 flex items-center gap-2">
                <Loader2 className="animate-spin h-4 w-4 text-purple-600" />
                Processing Batch...
              </span>
              <span className="text-sm font-mono bg-white px-2 py-1 rounded border">
                {progress.processed} / {progress.total}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-600 transition-all duration-500 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
            
            <div className="text-xs text-slate-500 font-mono truncate">
              {progress.currentName || "Initializing..."}
            </div>

            <Button variant="destructive" size="sm" onClick={cancelScraping} className="w-full mt-2">
              Stop Batch
            </Button>
          </div>
        )}

        {/* 3. Logs Console */}
        {logs.length > 0 && (
          <div className="mt-4 p-3 bg-slate-950 text-green-400 font-mono text-xs rounded-md h-48 overflow-y-auto border border-slate-800">
            {logs.map((log, i) => (
              <div key={i} className="mb-1 border-b border-slate-800/50 pb-1 last:border-0">
                {log}
              </div>
            ))}
          </div>
        )}

        {/* 4. Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full border border-slate-200">
              <h3 className="text-lg font-bold mb-2">Confirm Bulk Direct Scrape</h3>
              <p className="text-slate-600 mb-4">
                Found <strong>{pendingProfiles.length}</strong> valid profiles with LinkedIn URLs.
                <br />
                Batch: <strong>{selectedBatch}</strong>
              </p>
              
              <div className="max-h-40 overflow-y-auto bg-slate-50 p-2 rounded mb-4 text-xs border">
                {pendingProfiles.slice(0, 10).map((p, i) => (
                  <div key={i} className="truncate border-b last:border-0 py-1">
                    {i+1}. {p.name} - {p.linkedinUrl}
                  </div>
                ))}
                {pendingProfiles.length > 10 && <div className="text-center text-slate-400 mt-1">...and {pendingProfiles.length - 10} more</div>}
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleCancelConfirm}>Cancel</Button>
                <Button onClick={handleStartConfirm} className="bg-purple-600 hover:bg-purple-700">
                  <Play className="w-4 h-4 mr-2" /> Start Scraping
                </Button>
              </div>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
