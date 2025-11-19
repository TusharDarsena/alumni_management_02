import React, { useState, useRef } from "react";
import * as xlsx from "xlsx"; // Import the xlsx library
import axios from "axios"; // Import axios
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// Define the shape of a row in the XLSX file
interface AlumniRow {
  Name: string;
  // Add other columns if you need them, but "Name" is required
}

export default function ImportUpload() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState({ processed: 0, total: 0 });
  const { toast } = useToast();
  
  // Use a ref to reset the file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | null) => {
    if (!file) return;

    setIsProcessing(true);
    setLogs([]);
    setProgress({ processed: 0, total: 0 });

    try {
      // 1. Read the file
      const data = await file.arrayBuffer();
      const workbook = xlsx.read(data, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Read as generic objects to inspect keys manually
      const json = xlsx.utils.sheet_to_json<any>(worksheet);

      // 2. Validate and get names (ROBUST METHOD)
      const names: string[] = json
        .map((row) => {
          // Find the specific key in this row that looks like "name"
          // This handles "Name ", "name", "NAME", etc.
          const key = Object.keys(row).find(
            (k) => k.trim().toLowerCase() === "name"
          );
          return key ? row[key] : null;
        })
        .filter((name): name is string => !!name && typeof name === 'string');

      if (names.length === 0) {
        toast({
          title: "Invalid file",
          description: "No names found. Please check your Excel header row.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
      
      setProgress({ processed: 0, total: names.length });
      setLogs([`Found ${names.length} names. Starting scrape...`]);

      // 3. Process names one by one
      for (const [index, name] of names.entries()) {
        try {
          setLogs((prev) => [...prev, `[${index + 1}/${names.length}] Scraping "${name}"...`]);
          
          const res = await axios.post('/api/scrape/get-linkedin-profile', {
            alumniName: name,
          });
          
          setLogs((prev) => [...prev, `  ✅ Success: "${name}" (${res.data.message})`]);

        } catch (error: any) {
          const errorMsg = error.response?.data?.message || error.message;
          setLogs((prev) => [...prev, `  ❌ Error scraping "${name}": ${errorMsg}`]);
        } finally {
          setProgress((prev) => ({ ...prev, processed: prev.processed + 1 }));
        }
      }

      setLogs((prev) => [...prev, "--- Bulk scrape complete! ---"]);
      toast({
        title: "Bulk Scrape Complete",
        description: `Processed ${names.length} entries.`,
      });

    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to read file", variant: "destructive" });
    } finally {
      setIsProcessing(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="w-full p-4 bg-white border border-gray-100 rounded-md mb-4">
      <h3 className="text-lg font-medium mb-2">Bulk Scrape Alumni</h3>
      <p className="text-sm text-gray-600 mb-3">
        Upload an XLSX file with a column named "Name". Each name will be
        scraped one by one.
      </p>
      <div className="flex items-center gap-3">
        <Input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls" // Accept Excel files
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          disabled={isProcessing}
        />
        <Button onClick={() => handleFile(fileInputRef.current?.files?.[0] ?? null)} disabled={isProcessing}>
          {isProcessing
            ? `Processing ${progress.processed}/${progress.total}...`
            : "Upload and Scrape"}
        </Button>
      </div>

      {logs.length > 0 && (
        <div className="mt-4 p-3 bg-gray-900 text-white rounded-md max-h-60 overflow-y-auto">
          <pre className="text-sm whitespace-pre-wrap">
            {logs.join("\n")}
          </pre>
        </div>
      )}
    </div>
  );
}
