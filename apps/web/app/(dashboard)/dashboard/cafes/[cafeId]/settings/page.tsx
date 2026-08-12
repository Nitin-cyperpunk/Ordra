import { redirect } from "next/navigation";

type SettingsIndexProps = {
  params: Promise<{ cafeId: string }>;
};

export default async function CafeSettingsIndexPage({ params }: SettingsIndexProps) {
  const { cafeId } = await params;
  redirect(`/dashboard/cafes/${cafeId}/settings/profile`);
}
