import React, { useState, useRef } from "react";
import * as xlsx from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle, Play } from "lucide-react";
// IMPORT THE HOOK
import { useScraping } from "@/context/ScrapingContext";

export default function ImportUpload() {
  // Get global state instead of local state
  const { isProcessing, progress, logs, startScraping, cancelScraping } = useScraping();
  
  // Local state just for the file reading part
  const [pendingNames, setPendingNames] = useState<string[]>([]);
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
    startScraping(pendingNames); // Call global function
    setShowConfirmModal(false);
    setPendingNames([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
                Upload XLSX. You can navigate away while this runs.
              </p>
            </div>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileSelect}
              disabled={isProcessing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96 space-y-4 animate-in fade-in zoom-in">
            <div className="flex items-center gap-3 text-blue-600">
              <AlertCircle className="h-6 w-6" />
              <h3 className="font-bold text-lg">Confirm Bulk Scrape</h3>
            </div>
            <p className="text-sm text-gray-600">
              Found <strong>{pendingNames.length}</strong> names. This will run in the background.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={handleCancelConfirm}>Cancel</Button>
              <Button onClick={handleStartConfirm} className="gap-2">
                <Play className="h-4 w-4" /> Start
              </Button>
            </div>
          </div>
        </div>
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