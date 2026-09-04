import { redirect } from "next/navigation";

export default function Home() {
  // The marketing landing page arrives with the marketing surface.
  // Until then the root is the login screen.
  redirect("/login");
}
