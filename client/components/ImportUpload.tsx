import React, { useState, useRef } from "react";
import * as xlsx from "xlsx";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle, Play, X } from "lucide-react";

export default function ImportUpload() {
  // --- State ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState({ processed: 0, total: 0, currentName: "" });
  
  // State for the Confirmation Modal
  const [pendingNames, setPendingNames] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Step 1: Read File & Prepare (Don't scrape yet) ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        toast({
          title: "Invalid file",
          description: "No names found. Check column headers.",
          variant: "destructive",
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      // Store names and show confirmation modal
      setPendingNames(names);
      setShowConfirmModal(true);

    } catch (err: any) {
      toast({ title: "Error reading file", description: err.message, variant: "destructive" });
    }
  };

  // --- Step 2: Actual Scraping Process ---
  const startScraping = async () => {
    setShowConfirmModal(false);
    setIsProcessing(true);
    setLogs([]);
    setProgress({ processed: 0, total: pendingNames.length, currentName: "" });

    const total = pendingNames.length;
    
    toast({ title: "Started", description: `Scraping ${total} profiles...` });

    for (const [index, name] of pendingNames.entries()) {
      // Update current status
      setProgress({ processed: index, total, currentName: name });

      try {
        // Add timeout to prevent hanging
        const res = await axios.post('/api/scrape/get-linkedin-profile', 
          { alumniName: name },
          { timeout: 150000 } // 60s timeout per person
        );
        setLogs((prev) => [`✅ Success: ${name}`, ...prev]); // Newest logs on top
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.message;
        setLogs((prev) => [`❌ Failed: ${name} - ${errorMsg}`, ...prev]);
      }
    }

    // Finish
    setProgress({ processed: total, total, currentName: "Completed" });
    setIsProcessing(false);
    setPendingNames([]); // Clear buffer
    if (fileInputRef.current) fileInputRef.current.value = "";
    
    toast({ title: "Batch Complete", description: "All profiles processed." });
  };

  const cancelScrape = () => {
    setShowConfirmModal(false);
    setPendingNames([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Calculate Percentage
  const percentage = progress.total > 0 
    ? Math.round((progress.processed / progress.total) * 100) 
    : 0;

  return (
    <div className="w-full space-y-4">
      
      {/* --- Upload Section --- */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold">Bulk Scrape Alumni</h3>
              <p className="text-sm text-gray-500">
                Upload an Excel file with a "Name" column.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileSelect}
                disabled={isProcessing}
                className="cursor-pointer"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Confirmation Modal (Custom Overlay) --- */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96 space-y-4 border animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-blue-600">
              <AlertCircle className="h-6 w-6" />
              <h3 className="font-bold text-lg">Confirm Bulk Scrape</h3>
            </div>
            
            <div className="text-sm text-gray-600 space-y-2">
              <p>File parsed successfully.</p>
              <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                <p className="font-medium text-blue-800">{pendingNames.length} Names Found</p>
                <p className="text-xs text-blue-600 mt-1">
                  Est. time: ~{Math.ceil((pendingNames.length * 40) / 60)} mins
                </p>
              </div>
              <p>Do you want to start scraping now?</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={cancelScrape}>
                Cancel
              </Button>
              <Button onClick={startScraping} className="gap-2">
                <Play className="h-4 w-4" /> Start Scrape
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- Progress UI (Visible when processing or done) --- */}
      {(isProcessing || progress.total > 0) && (
        <Card className="border-blue-100 shadow-sm">
          <CardContent className="pt-6 space-y-4">
            
            {/* Header Info */}
            <div className="flex justify-between items-end">
              <div>
                <h4 className="font-bold text-gray-700 flex items-center gap-2">
                  {isProcessing ? (
                    <><Loader2 className="h-4 w-4 animate-spin text-blue-500" /> Scraping in progress...</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4 text-green-500" /> Completed</>
                  )}
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  {isProcessing ? `Current: ${progress.currentName}` : "Job finished"}
                </p>
              </div>
              <div className="text-2xl font-bold text-blue-600">{percentage}%</div>
            </div>

            {/* Progress Bar */}
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-500 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Counts */}
            <div className="flex justify-between text-xs text-gray-400">
              <span>Processed: {progress.processed}</span>
              <span>Total: {progress.total}</span>
            </div>

            {/* Terminal / Logs */}
            <div className="mt-4 p-3 bg-slate-950 text-green-400 rounded-md h-48 overflow-y-auto font-mono text-xs shadow-inner border border-slate-800">
              {logs.length === 0 ? (
                <span className="text-gray-500 opacity-50">Logs will appear here...</span>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="border-b border-slate-800/50 py-1 last:border-0">
                    <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                    {log}
                  </div>
                ))
              )}
            </div>

          </CardContent>
        </Card>
      )}
    </div>
  );
}