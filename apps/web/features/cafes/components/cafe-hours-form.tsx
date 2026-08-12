"use client";

import { useActionState, useState } from "react";

import { updateCafeHoursAction, type CafeActionState } from "@/features/cafes/actions";
import type { Cafe, Weekday } from "@/features/cafes/types";
import { WEEKDAYS } from "@/features/cafes/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: CafeActionState = {};

const DAY_LABELS: Record<Weekday, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

type CafeHoursFormProps = {
  cafe: Cafe;
};

export function CafeHoursForm({ cafe }: CafeHoursFormProps) {
  const [state, formAction, pending] = useActionState(
    updateCafeHoursAction,
    initialState,
  );
  const [closed, setClosed] = useState<Record<Weekday, boolean>>(() => {
    const initial = {} as Record<Weekday, boolean>;
    for (const day of WEEKDAYS) {
      initial[day] = cafe.opening_hours[day].closed;
    }
    return initial;
  });

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="id" value={cafe.id} />

      <ul className="space-y-4">
        {WEEKDAYS.map((day) => {
          const hours = cafe.opening_hours[day];
          const isClosed = closed[day];
          return (
            <li
              key={day}
              className="grid gap-3 rounded-md border px-3 py-3 sm:grid-cols-[7rem_auto_1fr_1fr] sm:items-end"
            >
              <p className="text-sm font-medium">{DAY_LABELS[day]}</p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name={`${day}_closed`}
                  checked={isClosed}
                  onChange={(event) =>
                    setClosed((prev) => ({
                      ...prev,
                      [day]: event.target.checked,
                    }))
                  }
                  disabled={pending}
                />
                Closed
              </label>
              <div className="space-y-1">
                <Label htmlFor={`${day}_open`}>Opens</Label>
                <Input
                  id={`${day}_open`}
                  name={`${day}_open`}
                  type="time"
                  defaultValue={hours.open ?? ""}
                  disabled={pending || isClosed}
                  required={!isClosed}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`${day}_close`}>Closes</Label>
                <Input
                  id={`${day}_close`}
                  name={`${day}_close`}
                  type="time"
                  defaultValue={hours.close ?? ""}
                  disabled={pending || isClosed}
                  required={!isClosed}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {state.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-700" role="status">
          {state.success}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save opening hours"}
      </Button>
    </form>
  );
}
