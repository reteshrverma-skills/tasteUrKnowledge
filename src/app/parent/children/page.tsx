import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listYears, parentProfile } from "@/lib/parent";
import { AddChildForm } from "./AddChildForm";
import { DEFAULT_COUNTRY_CODE, listCountries } from "@/lib/countries";
import { listProgrammes } from "@/lib/programme";
import { WelcomeCard } from "@/app/dashboard/StudentHome";
import { ParentFrame } from "../ParentFrame";

/**
 * Children Profile: the form to add a child. The children themselves are
 * listed on the dashboard, each with its Edit or Home login button.
 */
export default async function ChildrenProfilePage() {
  const session = await getSession();
  if (!session || session.userType !== "PARENT") redirect("/login");

  const [profile, years, countries, programmes] = await Promise.all([
    parentProfile(session.userId),
    listYears(),
    listCountries(),
    listProgrammes(),
  ]);
  // A child usually lives where their parent registered.
  const defaultCountry = profile?.countryCode ?? DEFAULT_COUNTRY_CODE;

  return (
    <ParentFrame>
      <WelcomeCard eyebrow="CHILDREN PROFILE" title="Add a child">
        Each child gets their own login and practises as themselves.
      </WelcomeCard>

      <div className="card p-5 sm:p-6">
        <p className="text-sm text-ink-soft mb-5">
          {years.length === 0
            ? "No school years have been set up yet, so a child cannot be given one."
            : "Your child will sign in with the login id you choose here."}
        </p>
        <AddChildForm
          years={years}
          countries={countries}
          defaultCountry={defaultCountry}
          programmes={programmes}
        />
      </div>
    </ParentFrame>
  );
}
