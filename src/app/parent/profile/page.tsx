import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { displayName } from "@/lib/english";
import { parentProfile } from "@/lib/parent";
import { ParentFrame } from "../ParentFrame";
import { WelcomeCard } from "@/app/dashboard/StudentHome";
import { ProfileForm } from "./ProfileForm";

/** My Profile: the parent's own name, contact and address. */
export default async function MyProfilePage() {
  const session = await getSession();
  if (!session || session.userType !== "PARENT") redirect("/login");

  const profile = await parentProfile(session.userId);
  if (!profile) redirect("/login");

  const details = profile.personalDetails;

  return (
    <ParentFrame>
      <WelcomeCard eyebrow="MY PROFILE" title={displayName(profile)}>
        Your login id is <span className="font-semibold text-ink">{profile.profileName}</span> and
        cannot be changed.
      </WelcomeCard>

      <div className="card p-5 sm:p-6">
        <ProfileForm
          initial={{
            fName: profile.fName ?? "",
            mName: profile.mName ?? "",
            lName: profile.lName ?? "",
            emailAddress: details?.emailAddress ?? "",
            contactNumber1: details?.contactNumber1 ?? "",
            contactNumber2: details?.contactNumber2 ?? "",
            userAdd1: details?.userAdd1 ?? "",
            userAdd2: details?.userAdd2 ?? "",
            userAdd3: details?.userAdd3 ?? "",
            userCity: details?.userCity ?? "",
            userCounty: details?.userCounty ?? "",
            userZipCode: details?.userZipCode ?? "",
          }}
        />
      </div>
    </ParentFrame>
  );
}
