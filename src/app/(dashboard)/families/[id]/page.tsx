"use client";

import { useParams } from "next/navigation";
import { FamilyDetail } from "@/components/families/family-detail";

export default function FamilyPage() {
  const params = useParams();
  const familyId = params.id as string;

  return <FamilyDetail familyId={familyId} />;
}
