import React, { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Link as LinkIcon } from "lucide-react";

export default function DirectProfileScraper() {
  const [name, setName] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  
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

  const [batch, setBatch] = useState(batches[0]);
  const [status, setStatus] = useState<"idle" | "scraping" | "success" | "error">("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const { toast } = useToast();

  const addLog = (msg: string) => setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const handleScrape = async () => {
    if (!name || !linkedinUrl) {
      toast({ title: "Error", description: "Please enter both name and LinkedIn URL", variant: "destructive" });
      return;
    }

    setStatus("scraping");
    setLogs([]);
    addLog(`🚀 Starting direct scraping for: "${name}"`);
    addLog(`🔗 URL: ${linkedinUrl}`);

    try {
      addLog("📡 Sending request to Bright Data...");
      
      const response = await axios.post("/api/scrape/direct-profile", {
        name,
        linkedinUrl,
        batch
      });

      setStatus("success");
      addLog(`✅ Success! Profile scraped and saved.`);
      addLog(`💾 Database updated.`);
      toast({ title: "Success", description: `Profile for ${name} scraped successfully.` });
      
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message;
      addLog(`❌ Error: ${msg}`);
      setStatus("error");
      toast({ title: "Failed", description: msg, variant: "destructive" });
    }
  };

  return (
    <Card className="w-full border-t-4 border-t-green-600 shadow-md mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="w-5 h-5" />
          Direct Profile Scraper (Bypass Search)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Alumni Name</label>
            <Input 
              placeholder="e.g. John Doe" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              disabled={status === "scraping"}
            />
          </div>

          {/* Batch Select */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Batch</label>
            <select 
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              disabled={status === "scraping"}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {batches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>

        {/* URL Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">LinkedIn Profile URL</label>
          <Input 
            placeholder="https://www.linkedin.com/in/username/" 
            value={linkedinUrl} 
            onChange={(e) => setLinkedinUrl(e.target.value)}
            disabled={status === "scraping"}
          />
        </div>

        {/* Action Button */}
        <Button 
          onClick={handleScrape} 
          disabled={status === "scraping" || !name || !linkedinUrl}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {status === "scraping" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scraping...
            </>
          ) : (
            "Scrape Profile Directly"
          )}
        </Button>

        {/* Logs Console */}
        {logs.length > 0 && (
          <div className="mt-4 p-3 bg-slate-950 text-green-400 font-mono text-xs rounded-md h-48 overflow-y-auto border border-slate-800">
            {logs.map((log, i) => (
              <div key={i} className="mb-1 border-b border-slate-800/50 pb-1 last:border-0">
                {log}
              </div>
            ))}
          </div>
        )}

      </CardContent>
    </Card>
  );
}
