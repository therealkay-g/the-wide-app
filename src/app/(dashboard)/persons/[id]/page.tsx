import { PersonDetail } from "@/components/persons/person-detail";

export default function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <PersonDetailContainer params={params} />;
}

async function PersonDetailContainer({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PersonDetail personId={id} />;
}
