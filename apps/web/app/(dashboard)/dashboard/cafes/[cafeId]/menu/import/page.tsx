import Link from "next/link";

import { requireCafeAccess } from "@/features/memberships/access";
import { MenuImportUploadForm } from "@/features/menu-import/components/menu-import-upload-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ cafeId: string }>;
};

export default async function MenuImportPage({ params }: Props) {
  const { cafeId } = await params;
  await requireCafeAccess(cafeId, { roles: ["owner", "manager"] });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="space-y-1 text-center sm:text-left">
        <h1 className="text-2xl font-semibold tracking-tight">
          Import your existing menu
        </h1>
        <p className="text-muted-foreground text-sm">
          Upload your existing menu and we&apos;ll organize it for you. You&apos;ll review
          everything before anything is added.
        </p>
      </div>

      <MenuImportUploadForm cafeId={cafeId} />

      <p className="text-center text-sm">
        <Link
          href={`/dashboard/cafes/${cafeId}/menu`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          Back to menu
        </Link>
      </p>
    </div>
  );
}
