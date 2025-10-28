import { EditJobListingPage } from "./Page"
import { loader } from "./loader"
import { PrivatePage } from "@/components/routing/PrivatePage"
export const editJobListingRoute = {
  loader,
  element: (
    <PrivatePage>
      <EditJobListingPage />
    </PrivatePage>
  ),
}
