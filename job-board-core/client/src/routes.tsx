import { RootLayout } from "@/layouts/RootLayout"
import { ErrorPage } from "@/pages/ErrorPage"
import { NotFoundPage } from "@/pages/NotFoundPage"
import { Navigate, RouteObject } from "react-router-dom"
import { editJobListingRoute } from "./pages/jobs/edit"
import { jobsIndexRoutes } from "./pages/jobs/index"
import { NewJobListingPage } from "./pages/jobs/new/NewJobListingPage"

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        errorElement: <ErrorPage />,
        children: [
          {
            index: true,
            element: <Navigate to="/jobs" replace />,
          },
          {
            path: "jobs",
            children: [
              { index: true, ...jobsIndexRoutes },
              {
                path: "new",
                element: <NewJobListingPage />,
              },
              {
                path: ":id/edit",
                ...editJobListingRoute,
              },
            ],
          },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]
