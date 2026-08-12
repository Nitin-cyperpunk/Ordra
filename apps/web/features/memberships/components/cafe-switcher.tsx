"use client";

import { setActiveCafeAction } from "@/features/memberships/actions";
import type { CafeMembership } from "@/features/memberships/types";

type CafeSwitcherProps = {
  memberships: CafeMembership[];
  activeCafeId: string | null;
};

export function CafeSwitcher({ memberships, activeCafeId }: CafeSwitcherProps) {
  if (memberships.length === 0) {
    return null;
  }

  const active =
    memberships.find((item) => item.cafe_id === activeCafeId) ?? memberships[0];

  if (memberships.length === 1 && active) {
    return (
      <p className="text-muted-foreground max-w-[12rem] truncate text-sm">
        {active.cafe.name}
      </p>
    );
  }

  return (
    <form
      action={async (formData) => {
        await setActiveCafeAction({}, formData);
      }}
      className="flex items-center gap-2"
    >
      <label htmlFor="cafe-switcher" className="sr-only">
        Current cafe
      </label>
      <select
        id="cafe-switcher"
        name="cafeId"
        defaultValue={active?.cafe_id}
        onChange={(event) => {
          event.currentTarget.form?.requestSubmit();
        }}
        className="border-input bg-background h-8 max-w-[14rem] truncate rounded-md border px-2 text-sm"
      >
        {memberships.map((item) => (
          <option key={item.cafe_id} value={item.cafe_id}>
            {item.cafe.name} ({item.role})
          </option>
        ))}
      </select>
    </form>
  );
}
