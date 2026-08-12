"use client";

import { useActionState } from "react";

import type { Cafe } from "@/features/cafes/types";
import { updateCafeProfileAction, type CafeActionState } from "@/features/cafes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: CafeActionState = {};

type CafeProfileFormProps = {
  cafe: Cafe;
};

export function CafeProfileForm({ cafe }: CafeProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    updateCafeProfileAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="id" value={cafe.id} />

      <div className="space-y-2">
        <Label htmlFor="name">Cafe name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={cafe.name}
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
        <Input id="slug" value={cafe.slug} disabled readOnly />
        <p className="text-muted-foreground text-xs">
          Slug is read-only for now. Workspace URLs use the cafe id, so changing slug is
          deferred until redirect/history support exists.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={cafe.description ?? ""}
          disabled={pending}
          maxLength={2000}
          rows={4}
        />
        {state.fieldErrors?.description?.[0] ? (
          <p className="text-destructive text-sm">{state.fieldErrors.description[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={cafe.phone ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Contact email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={cafe.email ?? ""}
            disabled={pending}
            aria-invalid={Boolean(state.fieldErrors?.email)}
          />
          {state.fieldErrors?.email?.[0] ? (
            <p className="text-destructive text-sm">{state.fieldErrors.email[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          name="website"
          type="url"
          placeholder="https://"
          defaultValue={cafe.website ?? ""}
          disabled={pending}
          aria-invalid={Boolean(state.fieldErrors?.website)}
        />
        {state.fieldErrors?.website?.[0] ? (
          <p className="text-destructive text-sm">{state.fieldErrors.website[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address_line1">Address line 1</Label>
        <Input
          id="address_line1"
          name="address_line1"
          defaultValue={cafe.address_line1 ?? ""}
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address_line2">Address line 2</Label>
        <Input
          id="address_line2"
          name="address_line2"
          defaultValue={cafe.address_line2 ?? ""}
          disabled={pending}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            defaultValue={cafe.city ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            name="state"
            defaultValue={cafe.state ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            name="country"
            defaultValue={cafe.country ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postal_code">Postal code</Label>
          <Input
            id="postal_code"
            name="postal_code"
            defaultValue={cafe.postal_code ?? ""}
            disabled={pending}
          />
        </div>
      </div>

      <div className="rounded-md border border-dashed px-3 py-3">
        <p className="text-sm font-medium">Logo</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Supabase Storage upload is not configured yet. Logo stays tenant-scoped when
          Storage ships (`cafe/{"{cafe_id}"}/logo/...`).
        </p>
      </div>

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
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
