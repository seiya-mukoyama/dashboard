import { redirect } from "next/navigation"

export default function ConditionRedirectPage() {
  redirect("/?section=condition")
}
