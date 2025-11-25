import React, { useState, useRef } from "react";
import * as xlsx from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertTriangle, Play, RotateCcw } from "lucide-react";
// IMPORT THE HOOK
import { useScraping, ScrapeProfile } from "@/context/ScrapingContext";

export default function ImportUpload() {
  // Get global state instead of local state
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

  // Local state just for the file reading part
  const [pendingNames, setPendingNames] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState(batches[0]); // Automatically use newest batch
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // If already processing, don't allow new upload
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

      // Robust Name Finder (Same logic as before)
      const names: string[] = json
        .map((row) => {
          const key = Object.keys(row).find((k) => k.trim().toLowerCase() === "name");
          return key ? row[key] : null;
        })
        .filter((name): name is string => !!name && typeof name === 'string');

      if (names.length === 0) {
        toast({ title: "Invalid file", description: "No names found.", variant: "destructive" });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setPendingNames(names);
      setShowConfirmModal(true);
    } catch (err: any) {
      toast({ title: "Error reading file", description: err.message, variant: "destructive" });
    }
  };

  const handleStartConfirm = () => {
    // PACKING LOGIC: Combine Name + Batch
    const profiles: ScrapeProfile[] = pendingNames.map(name => ({
      name: name,
      batch: selectedBatch
    }));

    startScraping(profiles, false);
    setShowConfirmModal(false);
    setPendingNames([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRetryFailed = () => {
    // Failed queue already contains objects with batch info
    startScraping(failedQueue, true);
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setPendingNames([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // UI Logic
  const percentage = progress.total > 0 
    ? Math.round((progress.processed / progress.total) * 100) 
    : 0;

  return (
    <div className="w-full space-y-4">
      
      {/* Upload Card - Disabled if processing */}
      <Card className={isProcessing ? "opacity-50 pointer-events-none" : ""}>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold">Bulk Scrape Alumni</h3>
              <p className="text-sm text-gray-500">
                Upload an Excel file (Names only) and select the batch.
              </p>
            </div>
            
            <div className="flex gap-4">
              {/* Batch Selector */}
              <select 
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {batches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>

              {/* File Input */}
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileSelect}
                disabled={isProcessing}
                className="flex-1"
              />
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
                <p>Found <strong>{pendingNames.length}</strong> names.</p>
                <p>Applying Batch: <strong>{selectedBatch}</strong></p>
             </div>
             <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleCancelConfirm}>Cancel</Button>
                <Button onClick={handleStartConfirm}><Play className="h-4 w-4 mr-2" /> Start</Button>
             </div>
          </div>
        </div>
      )}

      {/* RETRY FAILED CARD (Only shows if job is done AND there are failures) */}
      {!isProcessing && failedQueue.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 animate-in slide-in-from-top-2">
          <CardContent className="pt-6 flex justify-between items-center">
            <div>
              <h4 className="font-bold text-amber-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> 
                {failedQueue.length} Profiles Failed
              </h4>
              <p className="text-sm text-amber-700 mt-1">
                Retry using BrightData Fallback?
              </p>
            </div>
            <Button onClick={handleRetryFailed} variant="default" className="bg-amber-600 hover:bg-amber-700 text-white">
              <RotateCcw className="h-4 w-4 mr-2" /> Retry Selection
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Progress UI - Visible if processing OR if there are logs (completed) */}
      {(isProcessing || logs.length > 0) && (
        <Card className="border-blue-100 shadow-sm animate-in slide-in-from-bottom-2">
          <CardContent className="pt-6 space-y-4">
            
            {/* Header */}
            <div className="flex justify-between items-end">
              <div>
                <h4 className="font-bold text-gray-700 flex items-center gap-2">
                  {isProcessing ? (
                    <><Loader2 className="h-4 w-4 animate-spin text-blue-500" /> Scraping Background...</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4 text-green-500" /> Done / Idle</>
                  )}
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  {isProcessing ? `Currently scraping: ${progress.currentName}` : "Process finished or stopped."}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                 {/* Cancel Button */}
                 {isProcessing && (
                    <Button variant="destructive" size="sm" onClick={cancelScraping}>
                      Stop
                    </Button>
                 )}
                 <div className="text-2xl font-bold text-blue-600">{percentage}%</div>
              </div>
            </div>

            {/* Bar */}
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-gray-400">
              <span>Processed: {progress.processed}</span>
              <span>Total: {progress.total}</span>
            </div>

            {/* Logs */}
            <div className="mt-4 p-3 bg-slate-950 text-green-400 rounded-md h-48 overflow-y-auto font-mono text-xs">
              {logs.map((log, i) => (
                <div key={i} className="border-b border-slate-800/50 py-1">
                  {log}
                </div>
              ))}
            </div>

          </CardContent>
        </Card>
      )}
    </div>
  );
}