import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useToast } from "@/hooks/use-toast";

interface ScrapingContextType {
  isProcessing: boolean;
  progress: { processed: number; total: number; currentName: string };
  logs: string[];
  failedQueue: string[]; // <--- NEW
  startScraping: (names: string[], forceFallback?: boolean) => void; // <--- Updated Signature
  cancelScraping: () => void;
}

const ScrapingContext = createContext<ScrapingContextType | undefined>(undefined);

export function ScrapingProvider({ children }: { children: React.ReactNode }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, total: 0, currentName: "" });
  const [logs, setLogs] = useState<string[]>([]);
  const [failedQueue, setFailedQueue] = useState<string[]>([]); // <--- NEW
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

  // Update start function to accept fallback flag
  const startScraping = async (names: string[], forceFallback = false) => {
    try {
      // Pass forceFallback to backend
      await axios.post('/api/scrape/start-batch', { names, forceFallback });
      
      setFailedQueue([]); // Clear old failures on new start
      toast({ 
        title: forceFallback ? "Starting Retry Batch" : "Background Job Started", 
        description: forceFallback ? "Using BrightData Fallback..." : "You can refresh or leave the page." 
      });
      
      // Force an immediate check
      checkStatus();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to start", variant: "destructive" });
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
