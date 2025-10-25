import { PrivatePage } from "@/components/routing/PrivatePage"
import { loader } from "./loader"
import { MyJobListingsPage } from "./Page"
loader

export const myJobListingsRoute = {
  loader,
  element: (
    <PrivatePage>
      <MyJobListingsPage />
    </PrivatePage>
  ),
}
