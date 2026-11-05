import type { Metadata } from "next";
import { LoginJourney } from "../Journeys";

export const metadata: Metadata = {
  title: "Login Journey | SIGQS",
};

export default function LoginJourneyPage() {
  return <LoginJourney />;
}
