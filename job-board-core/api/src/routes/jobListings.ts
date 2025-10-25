import { Router } from "express"
import { zParse } from "../utils/zParse"
import { db } from "../db"
import { jobListingFormSchema } from "../constants/schemas/jobListings"

export const jobListingsRouter = Router()

jobListingsRouter.get("/published", async (req, res) => {
  res.json(
    await db.jobListing.findMany({ where: { expiresAt: { gt: new Date() } } })
  )
})

jobListingsRouter.post("/", async (req, res) => {
  const body = await zParse(req.body, jobListingFormSchema, res)
  if (body == null) return

  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setDate(now.getDate() + 30) // Expires in 30 days

  const jobListing = await db.jobListing.create({
    data: {
      ...body,
      postedAt: now,
      expiresAt,
    },
  })

  res.json(jobListing)
})

jobListingsRouter.get("/:id", async (req, res) => {
  const id = req.params.id

  const jobListing = await db.jobListing.findUnique({ where: { id } })

  if (jobListing == null) {
    res.status(404).json({ message: "Job listing not found" })
    return
  }

  res.json(jobListing)
})

jobListingsRouter.put("/:id", async (req, res) => {
  const body = await zParse(req.body, jobListingFormSchema, res)
  if (body == null) return

  const id = req.params.id
  const jobListing = await db.jobListing.findUnique({ where: { id } })

  if (jobListing == null) {
    res.status(404).json({ message: "Job listing not found" })
    return
  }

  const updatedJobListing = await db.jobListing.update({
    where: { id },
    data: body,
  })

  res.json(updatedJobListing)
})

jobListingsRouter.delete("/:id", async (req, res) => {
  const id = req.params.id
  const jobListing = await db.jobListing.findUnique({ where: { id } })

  if (jobListing == null) {
    res.status(404).json({ message: "Job listing not found" })
    return
  }

  await db.jobListing.delete({ where: { id } })

  res.sendStatus(204)
})
