"use client";

import { useActionState } from "react";

import { updateCafeBusinessAction, type CafeActionState } from "@/features/cafes/actions";
import { COMMON_TIMEZONES } from "@/features/cafes/schemas";
import type { Cafe } from "@/features/cafes/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const initialState: CafeActionState = {};

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD"] as const;

type CafeBusinessFormProps = {
  cafe: Cafe;
};

export function CafeBusinessForm({ cafe }: CafeBusinessFormProps) {
  const [state, formAction, pending] = useActionState(
    updateCafeBusinessAction,
    initialState,
  );

  const timezoneOptions = Array.from(
    new Set<string>([...COMMON_TIMEZONES, cafe.timezone]),
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="id" value={cafe.id} />

      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <select
          id="timezone"
          name="timezone"
          defaultValue={cafe.timezone}
          disabled={pending}
          className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
        >
          {timezoneOptions.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
        {state.fieldErrors?.timezone?.[0] ? (
          <p className="text-destructive text-sm">{state.fieldErrors.timezone[0]}</p>
        ) : null}
        <p className="text-muted-foreground text-xs">
          IANA timezone used for future orders, reports, and hours.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <select
          id="currency"
          name="currency"
          defaultValue={cafe.currency}
          disabled={pending}
          className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
        >
          {CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
        {state.fieldErrors?.currency?.[0] ? (
          <p className="text-destructive text-sm">{state.fieldErrors.currency[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={cafe.status}
          disabled={pending}
          className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <p className="text-muted-foreground text-xs">
          Inactive disables operations without deleting cafe data.
        </p>
      </div>

      {state.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-success-foreground text-sm" role="status">
          {state.success}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save business settings"}
      </Button>
    </form>
  );
}
