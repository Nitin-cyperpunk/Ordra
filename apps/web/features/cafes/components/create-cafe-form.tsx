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
  const [showAdvanced, setShowAdvanced] = useState(false);

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
          className="min-h-11"
          aria-invalid={Boolean(state.fieldErrors?.name)}
        />
        {state.fieldErrors?.name?.[0] ? (
          <p className="text-destructive text-sm">{state.fieldErrors.name[0]}</p>
        ) : null}
      </div>

      <input type="hidden" name="slug" value={slug} />

      <button
        type="button"
        className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
        onClick={() => setShowAdvanced((value) => !value)}
      >
        {showAdvanced ? "Hide advanced" : "Advanced (optional)"}
      </button>

      {showAdvanced ? (
        <div className="space-y-2 rounded-lg border p-3">
          <Label htmlFor="slug">Web address name</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value.toLowerCase());
            }}
            required
            disabled={pending}
            placeholder="harbor-roast"
            className="min-h-11"
            aria-invalid={Boolean(state.fieldErrors?.slug)}
          />
          {state.fieldErrors?.slug?.[0] ? (
            <p className="text-destructive text-sm">{state.fieldErrors.slug[0]}</p>
          ) : null}
          <p className="text-muted-foreground text-xs">
            Used for your cafe’s web link. We fill this in from your cafe name — you
            usually don’t need to change it.
          </p>
        </div>
      ) : null}

      {state.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="min-h-11 w-full" disabled={pending}>
        {pending ? "Creating…" : "Create cafe"}
      </Button>
    </form>
  );
}
