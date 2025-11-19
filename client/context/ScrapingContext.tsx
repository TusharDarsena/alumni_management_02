import React, { createContext, useContext, useState, useRef } from 'react';
import axios from 'axios';
import { useToast } from "@/hooks/use-toast";

interface ScrapingContextType {
  isProcessing: boolean;
  progress: { processed: number; total: number; currentName: string };
  logs: string[];
  startScraping: (names: string[]) => void;
  cancelScraping: () => void;
}

const ScrapingContext = createContext<ScrapingContextType | undefined>(undefined);

export function ScrapingProvider({ children }: { children: React.ReactNode }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, total: 0, currentName: "" });
  const [logs, setLogs] = useState<string[]>([]);
  const shouldStopRef = useRef(false); // To handle cancellation
  const { toast } = useToast();

  const startScraping = async (names: string[]) => {
    if (isProcessing) return; // Prevent double start

    setIsProcessing(true);
    setLogs([]); // Clear old logs
    setProgress({ processed: 0, total: names.length, currentName: "" });
    shouldStopRef.current = false;

    toast({ title: "Scraping Started", description: `Processing ${names.length} profiles in background...` });

    for (let i = 0; i < names.length; i++) {
      // Check if user clicked cancel
      if (shouldStopRef.current) {
        setLogs((prev) => [`⚠️ Process cancelled by user.`, ...prev]);
        break;
      }

      const name = names[i];
      setProgress({ processed: i, total: names.length, currentName: name });

      try {
        // The 150s timeout you requested
        await axios.post('/api/scrape/get-linkedin-profile', 
          { alumniName: name },
          { timeout: 150000 } 
        );
        setLogs((prev) => [`✅ Success: ${name}`, ...prev]);
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.message;
        setLogs((prev) => [`❌ Failed: ${name} - ${errorMsg}`, ...prev]);
      }
    }

    setIsProcessing(false);
    setProgress((prev) => ({ ...prev, processed: names.length, currentName: "Completed" }));
    toast({ title: "Batch Complete", description: "All background tasks finished." });
  };

  const cancelScraping = () => {
    shouldStopRef.current = true;
    setIsProcessing(false);
    toast({ title: "Stopping", description: "Finishing current task then stopping." });
  };

  return (
    <ScrapingContext.Provider value={{ isProcessing, progress, logs, startScraping, cancelScraping }}>
      {children}
    </ScrapingContext.Provider>
  );
}

export function useScraping() {
  const context = useContext(ScrapingContext);
  if (context === undefined) {
    throw new Error('useScraping must be used within a ScrapingProvider');
  }
  return context;
}
