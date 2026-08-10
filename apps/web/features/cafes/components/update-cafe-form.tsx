"use client";

import { useActionState, useState } from "react";

import type { Cafe } from "@/features/cafes/types";
import { updateCafeAction, type CafeActionState } from "@/features/cafes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: CafeActionState = {};

type UpdateCafeFormProps = {
  cafe: Cafe;
};

export function UpdateCafeForm({ cafe }: UpdateCafeFormProps) {
  const [state, formAction, pending] = useActionState(updateCafeAction, initialState);
  const [name, setName] = useState(cafe.name);
  const [slug, setSlug] = useState(cafe.slug);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={cafe.id} />

      <div className="space-y-2">
        <Label htmlFor="name">Cafe name</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          disabled={pending}
          aria-invalid={Boolean(state.fieldErrors?.name)}
        />
        {state.fieldErrors?.name?.[0] ? (
          <p className="text-destructive text-sm">{state.fieldErrors.name[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value.toLowerCase())}
          required
          disabled={pending}
          aria-invalid={Boolean(state.fieldErrors?.slug)}
        />
        {state.fieldErrors?.slug?.[0] ? (
          <p className="text-destructive text-sm">{state.fieldErrors.slug[0]}</p>
        ) : null}
      </div>

      {state.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
