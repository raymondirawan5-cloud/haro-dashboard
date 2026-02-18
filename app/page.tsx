import { redirect } from "next/navigation";
import { withPrefix } from "@/lib/path-prefix";

export default function HomePage() {
  redirect(withPrefix("/dashboard"));
}
