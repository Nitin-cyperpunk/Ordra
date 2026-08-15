"use client";

import { useActionState } from "react";

import type { OrderActionState } from "@/features/orders/actions";
import type { OrderStatus } from "@/features/orders/types";
import { Button } from "@/components/ui/button";

type OrderDetailActionsProps = {
  cafeId: string;
  orderId: string;
  actions: Array<{
    status: OrderStatus;
    label: string;
    variant?: "default" | "destructive" | "outline";
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

  if (actions.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {actions.map((entry) => (
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
        ))}
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
    </div>
  );
}
