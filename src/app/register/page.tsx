import { listProgrammes } from "@/lib/programme";
import { RegisterForm } from "./RegisterForm";

// The programme list is read from the database on each visit.
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const programmes = await listProgrammes();
  return <RegisterForm programmes={programmes} />;
}
