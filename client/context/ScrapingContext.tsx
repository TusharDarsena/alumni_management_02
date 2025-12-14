import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useToast } from "@/hooks/use-toast";

// Define the shape of a profile
export interface ScrapeProfile {
  name: string;
  batch: string;
  linkedinUrl?: string;
  url?: string; // Added for compatibility with new ImportUpload logic
}

interface ScrapingContextType {
  isProcessing: boolean;
  progress: { processed: number; total: number; currentName: string };
  logs: string[];
  failedQueue: ScrapeProfile[]; // Now stores objects
  startScraping: (profiles: ScrapeProfile[], forceFallback?: boolean, concurrency?: number) => void;
  cancelScraping: () => void;
}

const ScrapingContext = createContext<ScrapingContextType | undefined>(undefined);

export function ScrapingProvider({ children }: { children: React.ReactNode }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, total: 0, currentName: "" });
  const [logs, setLogs] = useState<string[]>([]);
  const [failedQueue, setFailedQueue] = useState<ScrapeProfile[]>([]);
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to poll the server status
  const checkStatus = async () => {
    try {
      const res = await axios.get('/api/scrape/status');
      const data = res.data;

      // Sync local state with server state
      setIsProcessing(data.isRunning);
      setProgress({
        processed: data.processed,
        total: data.total,
        currentName: data.currentName
      });
      setLogs(data.logs || []);
      setFailedQueue(data.failedQueue || []); // <--- Sync Failed Queue

      // If server finished, stop polling
      if (!data.isRunning && data.total > 0 && data.processed === data.total) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    } catch (error) {
      console.error("Failed to check status", error);
    }
  };

  // On Load: Check if a job is already running (This fixes the F5 issue)
  useEffect(() => {
    checkStatus(); // Check immediately on mount/refresh

    // Set up polling interval (every 2 seconds)
    intervalRef.current = setInterval(checkStatus, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Update start function to accept profiles with batch info and optional concurrency
  const startScraping = async (profiles: ScrapeProfile[], forceFallback = false, concurrency?: number) => {
    try {
      // Send "profiles" instead of "names", include concurrency if provided
      await axios.post('/api/scrape/start-batch', { profiles, forceFallback, concurrency });

      setFailedQueue([]); // Clear old failures on new start
      toast({
        title: forceFallback ? "Starting Retry Batch" : "Starting Batch",
        description: `Processing ${profiles.length} profiles${concurrency ? ` (concurrency: ${concurrency})` : ''}...`
      });

      // Force an immediate check
      checkStatus();
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to start", variant: "destructive" });
    }
  };

  const cancelScraping = async () => {
    try {
      await axios.post('/api/scrape/stop-batch');
      toast({ title: "Stopping...", description: "The current item will finish, then it stops." });
    } catch (error) {
      console.error("Failed to stop", error);
    }
  };

  return (
    <ScrapingContext.Provider value={{ isProcessing, progress, logs, failedQueue, startScraping, cancelScraping }}>
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
