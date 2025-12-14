import React, { useState, useRef, useEffect } from "react";
import * as xlsx from "xlsx";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertTriangle, Play, FileSpreadsheet, Sparkles } from "lucide-react";

interface ScrapeProfile {
    name: string;
    batch: string;
    linkedinUrl: string;
}

interface JobStatus {
    isRunning: boolean;
    total: number;
    processed: number;
    currentName: string;
    logs: string[];
    failedQueue: ScrapeProfile[];
}

interface SkippedProfile {
    name: string;
    linkedinUrl: string;
    reason: string;
}

export default function ApifyBatchScraper() {
    // --- STATE ---
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ processed: 0, total: 0, currentName: "" });
    const [logs, setLogs] = useState<string[]>([]);
    const [failedQueue, setFailedQueue] = useState<ScrapeProfile[]>([]);

    const [pendingProfiles, setPendingProfiles] = useState<ScrapeProfile[]>([]);
    const [skippedProfiles, setSkippedProfiles] = useState<SkippedProfile[]>([]);
    const [skippedCount, setSkippedCount] = useState(0);
    const [selectedBatch, setSelectedBatch] = useState("");
    const [concurrency, setConcurrency] = useState(3);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // --- DYNAMIC BATCH GENERATOR ---
    const batches = React.useMemo(() => {
        const currentYear = new Date().getFullYear();
        const isAfterJune = new Date().getMonth() >= 6;
        const latestYear = isAfterJune ? currentYear : currentYear - 1;
        const startYear = 2015;

        const list = [];
        for (let y = startYear; y <= latestYear; y++) {
            list.push(`${y}-${y + 4}`);
        }
        return list.reverse();
    }, []);

    // Set default batch
    useEffect(() => {
        if (batches.length > 0 && !selectedBatch) {
            setSelectedBatch(batches[0]);
        }
    }, [batches, selectedBatch]);

    // --- STATUS POLLING ---
    const checkStatus = async () => {
        try {
            const res = await axios.get('/api/apify-scrape/status');
            const data: JobStatus = res.data;

            setIsProcessing(data.isRunning);
            setProgress({
                processed: data.processed,
                total: data.total,
                currentName: data.currentName
            });
            setLogs(data.logs || []);
            setFailedQueue(data.failedQueue || []);

            // Stop polling if job finished
            if (!data.isRunning && data.total > 0 && data.processed === data.total) {
                if (intervalRef.current) clearInterval(intervalRef.current);
            }
        } catch (error) {
            console.error("Failed to check Apify status", error);
        }
    };

    // Check status on mount and poll
    useEffect(() => {
        checkStatus();
        intervalRef.current = setInterval(checkStatus, 2000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    // --- FILE HANDLING ---
    const isValidLinkedInUrl = (url: string): boolean => {
        const lowerUrl = url.toLowerCase();
        return lowerUrl.includes("linkedin") && lowerUrl.includes("https");
    };

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

            const skipped: SkippedProfile[] = [];

            const profiles: ScrapeProfile[] = json
                .map((row) => {
                    const nameKey = Object.keys(row).find((k) => k.trim().toLowerCase() === "name");
                    const urlKey = Object.keys(row).find((k) => {
                        const key = k.trim().toLowerCase();
                        return key === "linkedin" || key === "linkedin url" || key === "url" || key === "link" || key === "profile link" || key.includes("linkedin");
                    });

                    const name = nameKey ? row[nameKey] : null;
                    const url = urlKey ? row[urlKey] : null;

                    if (name && typeof name === 'string') {
                        if (url && typeof url === 'string' && isValidLinkedInUrl(url)) {
                            return {
                                name: name.trim(),
                                batch: selectedBatch,
                                linkedinUrl: url.trim()
                            } as ScrapeProfile;
                        } else {
                            // Track skipped profile
                            skipped.push({
                                name: name.trim(),
                                linkedinUrl: url || '',
                                reason: !url ? 'Empty LinkedIn URL' : 'Invalid LinkedIn URL format'
                            });
                            return null;
                        }
                    }
                    return null;
                })
                .filter((p): p is ScrapeProfile => p !== null);

            setSkippedProfiles(skipped);
            setSkippedCount(skipped.length);

            if (profiles.length === 0) {
                toast({ title: "Invalid file", description: `No valid rows found. ${skipped.length > 0 ? `${skipped.length} rows had invalid URLs.` : ""} Ensure columns 'Name' and 'LinkedIn URL/Link' exist.`, variant: "destructive" });
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
            }

            setPendingProfiles(profiles);
            setShowConfirmModal(true);
        } catch (err: any) {
            toast({ title: "Error reading file", description: err.message, variant: "destructive" });
        }
    };

    // --- SCRAPING CONTROL ---
    const handleStartConfirm = async () => {
        const finalProfiles = pendingProfiles.map(p => ({
            ...p,
            batch: selectedBatch
        }));

        try {
            // Report skipped profiles to backend for logging
            if (skippedProfiles.length > 0) {
                await axios.post('/api/apify-scrape/report-skipped', {
                    skippedProfiles,
                    batch: selectedBatch
                });
            }

            await axios.post('/api/apify-scrape/start-batch', {
                profiles: finalProfiles,
                concurrency
            });

            setFailedQueue([]);
            setSkippedProfiles([]);
            toast({
                title: "Starting Apify Batch",
                description: `Processing ${finalProfiles.length} profiles (concurrency: ${concurrency})...${skippedProfiles.length > 0 ? ` ${skippedProfiles.length} skipped profiles logged.` : ''}`
            });

            checkStatus();
        } catch (error: any) {
            toast({ title: "Error", description: "Failed to start Apify batch", variant: "destructive" });
        }

        setShowConfirmModal(false);
        setPendingProfiles([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleCancelConfirm = () => {
        setShowConfirmModal(false);
        setPendingProfiles([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleStopBatch = async () => {
        try {
            await axios.post('/api/apify-scrape/stop-batch');
            toast({ title: "Stopping...", description: "The current item will finish, then it stops." });
        } catch (error) {
            console.error("Failed to stop", error);
        }
    };

    // --- UI ---
    const percentage = progress.total > 0
        ? Math.round((progress.processed / progress.total) * 100)
        : 0;

    return (
        <Card className="w-full border-t-4 border-t-emerald-600 shadow-md mt-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    Apify Bulk Scraper (Excel with URLs)
                    <span className="ml-2 text-xs font-normal bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">NEW</span>
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

                        <div className="w-[100px] space-y-2">
                            <label className="text-sm font-medium">Concurrency</label>
                            <select
                                value={concurrency}
                                onChange={(e) => setConcurrency(parseInt(e.target.value))}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                    </div>
                )}

                {/* 2. Progress Section */}
                {isProcessing && (
                    <div className="space-y-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-emerald-700 flex items-center gap-2">
                                <Loader2 className="animate-spin h-4 w-4 text-emerald-600" />
                                Processing via Apify...
                            </span>
                            <span className="text-sm font-mono bg-white px-2 py-1 rounded border">
                                {progress.processed} / {progress.total}
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-emerald-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-600 transition-all duration-500 ease-out"
                                style={{ width: `${percentage}%` }}
                            />
                        </div>

                        <div className="text-xs text-emerald-600 font-mono truncate">
                            {progress.currentName || "Initializing..."}
                        </div>

                        <Button variant="destructive" size="sm" onClick={handleStopBatch} className="w-full mt-2">
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
                        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full border border-emerald-200">
                            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-emerald-600" />
                                Confirm Apify Bulk Scrape
                            </h3>
                            <p className="text-slate-600 mb-4">
                                Found <strong>{pendingProfiles.length}</strong> valid profiles with LinkedIn URLs.
                                {skippedCount > 0 && (
                                    <span className="text-amber-600 block mt-1">
                                        ⚠️ {skippedCount} row(s) skipped (invalid LinkedIn URLs)
                                    </span>
                                )}
                                <br />
                                Batch: <strong>{selectedBatch}</strong>
                            </p>

                            <div className="max-h-40 overflow-y-auto bg-emerald-50 p-2 rounded mb-4 text-xs border">
                                {pendingProfiles.slice(0, 10).map((p, i) => (
                                    <div key={i} className="truncate border-b last:border-0 py-1">
                                        {i + 1}. {p.name} - {p.linkedinUrl}
                                    </div>
                                ))}
                                {pendingProfiles.length > 10 && <div className="text-center text-slate-400 mt-1">...and {pendingProfiles.length - 10} more</div>}
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={handleCancelConfirm}>Cancel</Button>
                                <Button onClick={handleStartConfirm} className="bg-emerald-600 hover:bg-emerald-700">
                                    <Play className="w-4 h-4 mr-2" /> Start Apify Scraping
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

            </CardContent>
        </Card>
    );
}
