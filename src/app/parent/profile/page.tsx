import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { displayName } from "@/lib/english";
import { parentProfile } from "@/lib/parent";
import { ParentNav } from "../ParentNav";
import { ProfileForm } from "./ProfileForm";

/** My Profile: the parent's own name, contact and address. */
export default async function MyProfilePage() {
  const session = await getSession();
  if (!session || session.userType !== "PARENT") redirect("/login");

  const profile = await parentProfile(session.userId);
  if (!profile) redirect("/login");

  const details = profile.personalDetails;
  const parentName = displayName(profile);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <ParentNav parentName={parentName} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link
          href="/parent"
          className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-4 mb-6">
          <h2 className="text-3xl font-bold text-gray-800">My Profile</h2>
          <p className="text-gray-600 mt-1">
            Your login id is{" "}
            <span className="font-semibold text-gray-800">
              {profile.profileName}
            </span>{" "}
            and cannot be changed.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
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
      </div>
    </div>
  );
}
