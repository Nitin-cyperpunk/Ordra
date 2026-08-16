"use client";

import { useActionState, useState } from "react";

import type { OrderActionState } from "@/features/orders/actions";
import type { OrderStatus } from "@/features/orders/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type OrderDetailActionsProps = {
  cafeId: string;
  orderId: string;
  actions: Array<{
    status: OrderStatus;
    label: string;
    variant?: "default" | "destructive" | "outline";
    needsReason?: boolean;
  }>;
  action: (prev: OrderActionState, formData: FormData) => Promise<OrderActionState>;
};

export function OrderDetailActions({
  cafeId,
  orderId,
  actions,
  action,
}: OrderDetailActionsProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [cancelOpen, setCancelOpen] = useState(false);

  if (actions.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {actions.map((entry) => {
          if (entry.needsReason) {
            return (
              <Button
                key={entry.status}
                type="button"
                variant={entry.variant ?? "default"}
                disabled={pending}
                className="min-h-11"
                onClick={() => setCancelOpen((open) => !open)}
              >
                {entry.label}
              </Button>
            );
          }

          return (
            <form key={entry.status} action={formAction}>
              <input type="hidden" name="cafeId" value={cafeId} />
              <input type="hidden" name="orderId" value={orderId} />
              <input type="hidden" name="status" value={entry.status} />
              <Button
                type="submit"
                variant={entry.variant ?? "default"}
                disabled={pending}
                className="min-h-11"
              >
                {entry.label}
              </Button>
            </form>
          );
        })}
      </div>

      {cancelOpen ? (
        <form
          action={formAction}
          className="space-y-2 rounded-lg border border-dashed p-3"
        >
          <input type="hidden" name="cafeId" value={cafeId} />
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="status" value="rejected" />
          <label className="text-muted-foreground text-xs" htmlFor="cancel-reason">
            Cancel reason (optional)
          </label>
          <Input
            id="cancel-reason"
            name="note"
            placeholder="Item unavailable"
            maxLength={250}
            className="min-h-11"
          />
          <div className="flex gap-2">
            <Button
              type="submit"
              variant="destructive"
              className="min-h-11"
              disabled={pending}
            >
              Cancel order
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11"
              onClick={() => setCancelOpen(false)}
            >
              Keep
            </Button>
          </div>
        </form>
      ) : null}

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
    </div>
  );
}
