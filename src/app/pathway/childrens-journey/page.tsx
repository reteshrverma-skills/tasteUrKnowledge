import type { Metadata } from "next";
import { ChildrensJourney } from "../Journeys";

export const metadata: Metadata = {
  title: "Children's Learning Journey | SIGQS",
};

export default function ChildrensJourneyPage() {
  return <ChildrensJourney />;
}
