import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, TrendingUp } from "lucide-react";

interface BatchData {
    batch: string;
    total: number;
    branches: Record<string, number>;
}

interface BatchStatsData {
    success: boolean;
    totalAlumni: number;
    batches: BatchData[];
    allBranches: string[];
}

const BRANCH_COLORS: Record<string, string> = {
    CSE: "bg-blue-500",
    ECE: "bg-emerald-500",
    DSAI: "bg-purple-500",
    "No Branch": "bg-zinc-400",
};

const BRANCH_TEXT_COLORS: Record<string, string> = {
    CSE: "text-blue-500",
    ECE: "text-emerald-500",
    DSAI: "text-purple-500",
    "No Branch": "text-zinc-400",
};

export default function BatchStatsChart() {
    const [data, setData] = useState<BatchStatsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/alumni/batch-stats")
            .then((res) => res.json())
            .then((d) => {
                setData(d);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch batch stats:", err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <Card className="w-full">
                <CardContent className="p-8">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data?.success) {
        return null;
    }

    // Filter to show only meaningful batches (with at least 5 students)
    const significantBatches = data.batches.filter(
        (b) => b.total >= 5 && b.batch !== "No Batch"
    );
    const maxTotal = Math.max(...significantBatches.map((b) => b.total));

    return (
        <Card className="w-full bg-gradient-to-br from-card to-muted/20 border-border/50">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-primary" />
                    </div>
                    Alumni by Batch & Branch
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                    Total: <span className="font-semibold text-foreground">{data.totalAlumni}</span> alumni across all batches
                </p>
            </CardHeader>

            <CardContent className="pt-4">
                {/* Legend */}
                <div className="flex flex-wrap gap-4 mb-6 pb-4 border-b border-border/50">
                    {["CSE", "ECE", "DSAI", "No Branch"].map((branch) => (
                        <div key={branch} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-sm ${BRANCH_COLORS[branch]}`} />
                            <span className="text-xs font-medium text-muted-foreground">{branch}</span>
                        </div>
                    ))}
                </div>

                {/* Batch Bars */}
                <div className="space-y-4">
                    {significantBatches.map((batch) => (
                        <div key={batch.batch} className="group">
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-foreground w-12">
                                        {batch.batch}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        ({batch.total} students)
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    {Object.entries(batch.branches).map(([branch, count]) => (
                                        <span key={branch} className={`${BRANCH_TEXT_COLORS[branch] || "text-muted-foreground"}`}>
                                            {branch}: {count}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Stacked Bar */}
                            <div className="h-8 bg-muted/30 rounded-lg overflow-hidden flex">
                                {["CSE", "ECE", "DSAI", "No Branch"].map((branch) => {
                                    const count = batch.branches[branch] || 0;
                                    if (count === 0) return null;
                                    const width = (count / maxTotal) * 100;

                                    return (
                                        <div
                                            key={branch}
                                            className={`${BRANCH_COLORS[branch]} h-full transition-all duration-500 group-hover:opacity-90 relative flex items-center justify-center`}
                                            style={{ width: `${width}%` }}
                                            title={`${branch}: ${count}`}
                                        >
                                            {width > 8 && (
                                                <span className="text-[10px] font-bold text-white drop-shadow-sm">
                                                    {count}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary Stats */}
                <div className="mt-8 pt-4 border-t border-border/50 grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-500">
                            {data.batches.reduce((sum, b) => sum + (b.branches["CSE"] || 0), 0)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">CSE Alumni</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-500">
                            {data.batches.reduce((sum, b) => sum + (b.branches["ECE"] || 0), 0)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">ECE Alumni</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-500">
                            {data.batches.reduce((sum, b) => sum + (b.branches["DSAI"] || 0), 0)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">DSAI Alumni</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
