import React, { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, AlertTriangle, X } from "lucide-react";

export default function SingleProfileScraper() {
  const [name, setName] = useState("");
  
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

  const [batch, setBatch] = useState(batches[0]); // Automatically use newest batch
  const [status, setStatus] = useState<"idle" | "searching" | "scraping" | "success" | "error">("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const { toast } = useToast();

  const addLog = (msg: string) => setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const handleScrape = async (forceFallback = false) => {
    if (!name) {
      toast({ title: "Error", description: "Please enter a name", variant: "destructive" });
      return;
    }

    // Reset UI if starting fresh
    if (!forceFallback) {
      setStatus("searching");
      setLogs([]);
      setShowFallbackModal(false);
      addLog(`🚀 Starting scraping process for: "${name}" (${batch})`);
    } else {
      setStatus("searching");
      addLog(`⚠️ Retrying with Bright Data Fallback...`);
    }

    try {
      addLog(forceFallback ? "🔍 Searching Google (Fallback)..." : "🤖 Searching with Airtop AI...");
      
      // 1. Send Request
      const response = await axios.post("/api/scrape/get-linkedin-profile", {
        alumniName: name,
        batch: batch, // Sending batch info
        forceFallback: forceFallback
      });

      // 2. Success
      setStatus("success");
      addLog(`✅ Success! Profile scraped and saved.`);
      addLog(`💾 Database updated.`);
      toast({ title: "Success", description: `Profile for ${name} scraped successfully.` });
      
    } catch (error: any) {
      // 3. Handle Errors
      if (error.response?.data?.code === "AIRTOP_FAILED") {
        addLog("❌ Airtop failed to find a confident match.");
        setShowFallbackModal(true); // Trigger Modal
        setStatus("error");
      } else {
        const msg = error.response?.data?.message || error.message;
        addLog(`❌ Error: ${msg}`);
        setStatus("error");
        toast({ title: "Failed", description: msg, variant: "destructive" });
      }
    }
  };

  return (
    <Card className="w-full border-t-4 border-t-blue-600 shadow-md">
      <CardHeader>
        <CardTitle>Single Profile Scraper</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Input Section */}
        <div className="flex gap-3">
          {/* Batch Select */}
          <select 
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            disabled={status === "searching" || status === "scraping"}
            className="h-10 px-3 rounded-md border border-gray-300 bg-white text-sm min-w-[130px]"
          >
            {batches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          <Input 
            placeholder="Enter Alumni Name" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={status === "searching" || status === "scraping"}
            className="text-lg flex-1"
          />
          <Button 
            onClick={() => handleScrape(false)} 
            disabled={status === "searching" || status === "scraping" || !name}
            className="min-w-[120px]"
          >
            {status === "searching" ? <Loader2 className="animate-spin" /> : "Scrape"}
          </Button>
        </div>

        {/* Fallback Confirmation Modal (Inline) */}
        {showFallbackModal && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-md animate-in slide-in-from-top-2">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-1" />
              <div className="space-y-2">
                <h4 className="font-semibold text-amber-800">Airtop could not find a profile.</h4>
                <p className="text-sm text-amber-700">Try strict fallback search?</p>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="default" onClick={() => handleScrape(true)}>
                    Yes, Try Fallback
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowFallbackModal(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress / Logs Display (The "Good Animation" part) */}
        {(status !== "idle" || logs.length > 0) && (
          <div className="bg-slate-950 rounded-md overflow-hidden border border-slate-800 mt-4">
            
            {/* Status Bar */}
            <div className="bg-slate-900 p-2 px-3 flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                {status === "searching" && <><Loader2 className="h-4 w-4 animate-spin text-blue-400" /> Processing...</>}
                {status === "success" && <><CheckCircle2 className="h-4 w-4 text-green-400" /> Completed</>}
                {status === "error" && <><X className="h-4 w-4 text-red-400" /> Stopped</>}
              </div>
            </div>

            {/* Terminal Logs */}
            <div className="p-3 h-40 overflow-y-auto font-mono text-xs text-green-400/90">
               {logs.map((log, i) => (
                 <div key={i} className="py-0.5 border-b border-slate-800/30 last:border-0">
                   {log}
                 </div>
               ))}
               {status === "searching" && (
                 <div className="animate-pulse text-blue-400 mt-2">_ Processing data...</div>
               )}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
