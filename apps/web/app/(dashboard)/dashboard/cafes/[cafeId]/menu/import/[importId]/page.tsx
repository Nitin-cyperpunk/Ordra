import Link from "next/link";
import { notFound } from "next/navigation";

import { requireCafeAccess } from "@/features/memberships/access";
import { getMenuImport } from "@/features/menu-import/actions";
import { MenuImportReview } from "@/features/menu-import/components/menu-import-review";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ cafeId: string; importId: string }>;
};

export default async function MenuImportDetailPage({ params }: Props) {
  const { cafeId, importId } = await params;
  await requireCafeAccess(cafeId, { roles: ["owner", "manager"] });

  const record = await getMenuImport(cafeId, importId);
  if (!record) notFound();

  const supabase = await createClient();
  const { data: existingItems } = await supabase
    .from("menu_items")
    .select("name")
    .eq("cafe_id", cafeId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Menu import</h1>
        <p className="text-muted-foreground text-sm">{record.source_file_name}</p>
      </div>

      <MenuImportReview
        cafeId={cafeId}
        record={record}
        existingItemNames={(existingItems ?? []).map((item) => item.name)}
      />

      {record.status !== "completed" ? (
        <p className="text-center text-sm">
          <Link
            href={`/dashboard/cafes/${cafeId}/menu`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Back to menu
          </Link>
        </p>
      ) : null}
    </div>
  );
}
