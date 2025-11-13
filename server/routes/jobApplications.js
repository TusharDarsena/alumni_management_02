import { Router } from "express";
import { z } from "zod";
import { zParse } from "../utils/zParse.js";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";
import User from "../models/User.js";
import AlumniProfile from "../models/AlumniProfile.js";

export const jobApplicationsRouter = Router();
const prisma = new PrismaClient();

const jobApplicationSchema = z.object({
  jobListingId: z.string().nonempty(),
  linkedinUrl: z.string().url().nullable().optional(),
  githubUrl: z.string().url().nullable().optional(),
  personalNote: z.string().min(10).max(500),
});

// Submit a job application (authenticated)
jobApplicationsRouter.post("/", requireAuth, async (req, res) => {
  const body = await zParse(req.body, jobApplicationSchema, res);
  if (body == null) return;

  const applicantId = req.user?._id?.toString();
  if (!applicantId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    // Check if job listing exists
    const jobListing = await prisma.jobListing.findUnique({
      where: { id: body.jobListingId },
    });

    if (!jobListing) {
      return res.status(404).json({ message: "Job listing not found" });
    }

    // Check if user already applied
    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        jobListingId: body.jobListingId,
        applicantId,
      },
    });

    if (existingApplication) {
      return res.status(400).json({ message: "You have already applied for this job" });
    }

    // Create the application
    const application = await prisma.jobApplication.create({
      data: {
        jobListingId: body.jobListingId,
        applicantId,
        linkedinUrl: body.linkedinUrl || null,
        githubUrl: body.githubUrl || null,
        personalNote: body.personalNote,
      },
    });

    // Get applicant details
    const applicant = await User.findById(applicantId).select("username email");

    // Send notification to job poster if exists
    if (jobListing.postedBy && applicant) {
      const poster = await User.findById(jobListing.postedBy);
      
      if (poster) {
        // Here you would integrate with your notification system
        // For now, we'll log it
        console.log(`Notification: User ${applicant.username} has applied for job "${jobListing.title}" posted by ${poster.username}`);
        
        // TODO: Implement actual notification system
        // Example: await sendNotification(poster._id, {
        //   type: "job_application",
        //   message: `User ${applicant.username} has applied for your job post "${jobListing.title}".`,
        //   link: `/jobs/${jobListing.id}/applications`
        // });
      }
    }

    res.status(201).json({
      message: "Application submitted successfully",
      application,
    });
  } catch (error) {
    console.error("Error submitting application:", error);
    res.status(500).json({ message: "Failed to submit application" });
  }
});

// Get applications for a specific job (only for job poster or admin)
jobApplicationsRouter.get("/job/:jobId", requireAuth, async (req, res) => {
  const { jobId } = req.params;
  const userId = req.user?._id?.toString();
  const isAdmin = req.user?.role === "admin";

  try {
    // Check if job exists and user is authorized
    const jobListing = await prisma.jobListing.findUnique({
      where: { id: jobId },
    });

    if (!jobListing) {
      return res.status(404).json({ message: "Job listing not found" });
    }

    if (jobListing.postedBy !== userId && !isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Get all applications for this job
    const applications = await prisma.jobApplication.findMany({
      where: { jobListingId: jobId },
      orderBy: { appliedAt: "desc" },
    });

    // Fetch applicant details for each application
    const applicationsWithDetails = await Promise.all(
      applications.map(async (app) => {
        const applicant = await User.findById(app.applicantId).select("username email branch role");
        
        // Try to fetch alumni profile if available
        let alumniProfile = null;
        if (applicant && applicant.email) {
          // Try to find alumni profile by email or name
          alumniProfile = await AlumniProfile.findOne({
            $or: [
              { name: { $regex: applicant.username, $options: 'i' } },
              // Add more matching criteria as needed
            ]
          }).select("name branch batch graduationYear current_company position location avatar");
        }
        
        return {
          ...app,
          applicant: applicant
            ? {
                id: applicant._id.toString(),
                username: applicant.username,
                email: applicant.email,
                branch: applicant.branch,
                role: applicant.role,
              }
            : null,
          alumniProfile: alumniProfile
            ? {
                name: alumniProfile.name,
                branch: alumniProfile.branch,
                batch: alumniProfile.batch,
                graduationYear: alumniProfile.graduationYear,
                currentCompany: alumniProfile.current_company?.name || alumniProfile.current_company_name,
                position: alumniProfile.position || alumniProfile.current_company?.title,
                location: alumniProfile.location,
                avatar: alumniProfile.avatar,
              }
            : null,
        };
      })
    );

    res.json(applicationsWithDetails);
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
});

// Get user's own applications
jobApplicationsRouter.get("/my-applications", requireAuth, async (req, res) => {
  const applicantId = req.user?._id?.toString();
  
  if (!applicantId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const applications = await prisma.jobApplication.findMany({
      where: { applicantId },
      orderBy: { appliedAt: "desc" },
    });

    // Fetch job listing details for each application
    const applicationsWithJobs = await Promise.all(
      applications.map(async (app) => {
        const job = await prisma.jobListing.findUnique({
          where: { id: app.jobListingId },
        });
        return {
          ...app,
          jobListing: job,
        };
      })
    );

    res.json(applicationsWithJobs);
  } catch (error) {
    console.error("Error fetching user applications:", error);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
});

// Update application status (only for job poster or admin)
jobApplicationsRouter.patch("/:applicationId/status", requireAuth, async (req, res) => {
  const { applicationId } = req.params;
  const { status } = req.body;
  const userId = req.user?._id?.toString();
  const isAdmin = req.user?.role === "admin";

  if (!["pending", "reviewed", "accepted", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: { jobListing: true },
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.jobListing.postedBy !== userId && !isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updatedApplication = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status },
    });

    res.json(updatedApplication);
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({ message: "Failed to update application status" });
  }
});
