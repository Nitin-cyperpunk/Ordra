"use client";

import { useActionState, useEffect, useState } from "react";

import { createCafeAction, type CafeActionState } from "@/features/cafes/actions";
import { slugifyCafeName } from "@/features/cafes/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: CafeActionState = {};

export function CreateCafeForm() {
  const [state, formAction, pending] = useActionState(createCafeAction, initialState);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugifyCafeName(name));
    }
  }, [name, slugTouched]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Cafe name</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          disabled={pending}
          placeholder="Harbor Roast"
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
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(event.target.value.toLowerCase());
          }}
          required
          disabled={pending}
          placeholder="harbor-roast"
          aria-invalid={Boolean(state.fieldErrors?.slug)}
        />
        {state.fieldErrors?.slug?.[0] ? (
          <p className="text-destructive text-sm">{state.fieldErrors.slug[0]}</p>
        ) : null}
        <p className="text-muted-foreground text-xs">
          Used in URLs. Lowercase letters, numbers, and hyphens only.
        </p>
      </div>

      {state.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating…" : "Create cafe"}
      </Button>
    </form>
  );
}
