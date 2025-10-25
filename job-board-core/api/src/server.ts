import express from "express"
import cors from "cors"
import { jobListingsRouter } from "./routes/jobListings"

const app = express()

app.use(cors())
app.use(express.json())

app.use("/job-listings", jobListingsRouter)

const port = process.env.PORT || 3001

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
