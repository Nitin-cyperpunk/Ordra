import Link from "next/link";

import { getCafeById } from "@/features/cafes/actions";
import { SetupChecklist } from "@/features/cafes/components/setup-checklist";
import { listMenuItems } from "@/features/menu/actions";
import { canManageMenu } from "@/features/menu/types";
import { requireCafeAccess } from "@/features/memberships/access";
import { getCafeMemberships } from "@/features/memberships/actions";
import { listCafeTables } from "@/features/tables/actions";
import { canManageTables } from "@/features/tables/types";
import { Button } from "@/components/ui/button";

type CafeDashboardPageProps = {
  params: Promise<{ cafeId: string }>;
};

export async function generateMetadata({ params }: CafeDashboardPageProps) {
  const { cafeId } = await params;
  const cafe = await getCafeById(cafeId);
  return {
    title: cafe ? `${cafe.name} · Ordra` : "Cafe · Ordra",
    robots: { index: false, follow: false },
  };
}

function greetingForNow(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function CafeDashboardPage({ params }: CafeDashboardPageProps) {
  const { cafeId } = await params;
  const { role } = await requireCafeAccess(cafeId);
  const cafe = (await getCafeById(cafeId))!;

  const [tables, items, members] = await Promise.all([
    listCafeTables(cafeId),
    listMenuItems(cafeId),
    getCafeMemberships(cafeId),
  ]);

  const activeTables = tables.filter((table) => table.status === "active").length;
  const unavailableItems = items.filter((item) => !item.is_available).length;
  const manageMenu = canManageMenu(role);
  const manageTables = canManageTables(role);

  const checklist = [
    {
      id: "profile",
      label: "Add cafe details",
      done: Boolean(cafe.description || cafe.phone || cafe.address_line1),
      href: `/dashboard/cafes/${cafeId}/settings/profile`,
    },
    {
      id: "tables",
      label: "Add your tables",
      done: tables.length > 0,
      href: `/dashboard/cafes/${cafeId}/tables`,
    },
    {
      id: "menu",
      label: "Add menu items",
      done: items.length > 0,
      href: `/dashboard/cafes/${cafeId}/menu`,
    },
    {
      id: "team",
      label: "Invite your team",
      done: members.length > 1,
      href: `/dashboard/cafes/${cafeId}/team`,
    },
  ];

  return (
    <main className="space-y-8">
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">{greetingForNow()} 👋</p>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          How is {cafe.name} doing today?
        </h2>
        <p className="text-muted-foreground text-sm">
          A simple snapshot of your cafe. Orders and sales insights arrive in a later
          update.
        </p>
      </div>

      <SetupChecklist cafeId={cafeId} items={checklist} />

      <section className="grid gap-3 sm:grid-cols-3">
        <OverviewCard label="Sales today" value="—" hint="Coming with Orders" />
        <OverviewCard label="Orders today" value="—" hint="Coming soon" />
        <OverviewCard
          label="Active tables"
          value={String(activeTables)}
          hint={
            tables.length === 0 ? "No tables yet" : `${tables.length} total configured`
          }
        />
      </section>

      {manageMenu || manageTables ? (
        <section className="space-y-3">
          <h3 className="text-sm font-medium">Quick actions</h3>
          <div className="flex flex-wrap gap-2">
            {manageMenu ? (
              <Button asChild className="min-h-11">
                <Link href={`/dashboard/cafes/${cafeId}/menu#add-item`}>
                  + Add menu item
                </Link>
              </Button>
            ) : null}
            {manageTables ? (
              <Button asChild variant="outline" className="min-h-11">
                <Link href={`/dashboard/cafes/${cafeId}/tables#add-table`}>
                  + Add table
                </Link>
              </Button>
            ) : null}
            {manageMenu ? (
              <Button asChild variant="outline" className="min-h-11">
                <Link href={`/dashboard/cafes/${cafeId}/team`}>Invite staff</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" className="min-h-11">
              <Link href={`/dashboard/cafes/${cafeId}/orders`}>View orders</Link>
            </Button>
          </div>
        </section>
      ) : null}

      {unavailableItems > 0 || tables.length === 0 || items.length === 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-medium">Needs attention</h3>
          <ul className="space-y-2">
            {unavailableItems > 0 ? (
              <AttentionRow
                text={`${unavailableItems} menu item${unavailableItems === 1 ? "" : "s"} marked unavailable`}
                href={`/dashboard/cafes/${cafeId}/menu?availability=unavailable`}
                action="Review"
              />
            ) : null}
            {tables.length === 0 ? (
              <AttentionRow
                text="No tables set up yet"
                href={`/dashboard/cafes/${cafeId}/tables`}
                action="Add tables"
              />
            ) : null}
            {items.length === 0 ? (
              <AttentionRow
                text="Your menu is still empty"
                href={`/dashboard/cafes/${cafeId}/menu`}
                action="Add items"
              />
            ) : null}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

function OverviewCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="text-muted-foreground mt-1 text-xs">{hint}</p>
    </div>
  );
}

function AttentionRow({
  text,
  href,
  action,
}: {
  text: string;
  href: string;
  action: string;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
      <p className="text-sm">{text}</p>
      <Button asChild size="sm" variant="outline" className="min-h-10">
        <Link href={href}>{action}</Link>
      </Button>
    </li>
  );
}
