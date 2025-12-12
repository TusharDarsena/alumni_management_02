import { Router } from "express";
import { requireAuth } from "../middleware/clerkAuth.js";
import AlumniProfile from "../models/AlumniProfile.js";

// Lazily load Prisma client at runtime
let _prismaInstance = null;
async function ensurePrisma() {
    if (_prismaInstance) return _prismaInstance;
    try {
        const mod = await import("@prisma/client");
        const PrismaClient = (mod && (mod.PrismaClient ?? mod.default?.PrismaClient ?? mod.default)) || mod.PrismaClient;
        _prismaInstance = new PrismaClient();
        return _prismaInstance;
    } catch (err) {
        console.warn("Prisma client unavailable:", err && err.message ? err.message : err);
        return null;
    }
}

export const dashboardRouter = Router();

// GET /api/dashboard/stats - Get dashboard statistics
dashboardRouter.get("/stats", requireAuth, async (req, res) => {
    const userId = req.user?._id?.toString();

    if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    try {
        // Get total alumni count from MongoDB
        let totalAlumni = 0;
        try {
            totalAlumni = await AlumniProfile.countDocuments();
            console.log("[Dashboard Stats] Total alumni count from DB:", totalAlumni);
        } catch (err) {
            console.warn("Failed to count alumni:", err.message);
        }

        // Get job applications count (accepted) from Prisma
        let acceptedJobsCount = 0;
        const prisma = await ensurePrisma();
        if (prisma) {
            try {
                acceptedJobsCount = await prisma.jobApplication.count({
                    where: {
                        applicantId: userId,
                        status: "accepted",
                    },
                });
            } catch (err) {
                console.warn("Failed to count accepted jobs:", err.message);
            }
        }

        // Get total messages count (placeholder - would need a messages collection)
        // For now, return 0 since messaging isn't implemented
        const messagesCount = 0;

        res.json({
            totalAlumni,
            acceptedJobsCount,
            messagesCount,
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
});

// GET /api/dashboard/stats/public - Get public stats (no auth required)
dashboardRouter.get("/stats/public", async (_req, res) => {
    try {
        // Get total alumni count from MongoDB
        let totalAlumni = 0;
        try {
            totalAlumni = await AlumniProfile.countDocuments();
        } catch (err) {
            console.warn("Failed to count alumni:", err.message);
        }

        res.json({
            totalAlumni,
        });
    } catch (error) {
        console.error("Error fetching public stats:", error);
        res.status(500).json({ message: "Failed to fetch public stats" });
    }
});
