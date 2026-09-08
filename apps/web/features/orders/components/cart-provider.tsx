"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  addCartLine,
  cartEstimatedSubtotal,
  cartItemCount,
  cartStorageKey,
  findOtherCafeCarts,
  parseCartLines,
  removeCartLine,
  setCartQuantity,
  type CartLine,
} from "@/features/orders/cart-logic";
import { Button } from "@/components/ui/button";

export type { CartLine };

type CartContextValue = {
  cafeSlug: string;
  tableToken: string | null;
  tableCode: string | null;
  currency: string;
  lines: CartLine[];
  itemCount: number;
  /** Client-side estimate only. */
  estimatedSubtotal: number;
  addItem: (item: Omit<CartLine, "quantity">) => void;
  setQuantity: (menuItemId: string, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  clear: () => void;
  ready: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  cafeSlug,
  tableToken,
  tableCode,
  currency,
  children,
}: {
  cafeSlug: string;
  tableToken: string | null;
  tableCode: string | null;
  currency: string;
  children: ReactNode;
}) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [otherCafe, setOtherCafe] = useState<{ slug: string; keys: string[] } | null>(
    null,
  );

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(cartStorageKey(cafeSlug, tableToken));
      setLines(raw ? parseCartLines(JSON.parse(raw)) : []);

      const keys: string[] = [];
      for (let index = 0; index < sessionStorage.length; index += 1) {
        const key = sessionStorage.key(index);
        if (key) keys.push(key);
      }
      const others = findOtherCafeCarts(
        keys,
        (key) => sessionStorage.getItem(key),
        cafeSlug,
      );
      if (others.length > 0) {
        setOtherCafe({
          slug: others[0]?.cafeSlug ?? "another cafe",
          keys: others.map((entry) => entry.key),
        });
      } else {
        setOtherCafe(null);
      }
    } catch {
      setLines([]);
      setOtherCafe(null);
    }
    setReady(true);
  }, [cafeSlug, tableToken]);

  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(cartStorageKey(cafeSlug, tableToken), JSON.stringify(lines));
    } catch {
      // ignore quota / private mode
    }
  }, [lines, cafeSlug, tableToken, ready]);

  const addItem = useCallback((item: Omit<CartLine, "quantity">) => {
    setLines((prev) => addCartLine(prev, item));
  }, []);

  const setQuantity = useCallback((menuItemId: string, quantity: number) => {
    setLines((prev) => setCartQuantity(prev, menuItemId, quantity));
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    setLines((prev) => removeCartLine(prev, menuItemId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const itemCount = useMemo(() => cartItemCount(lines), [lines]);
  const estimatedSubtotal = useMemo(() => cartEstimatedSubtotal(lines), [lines]);

  const value = useMemo(
    () => ({
      cafeSlug,
      tableToken,
      tableCode,
      currency,
      lines,
      itemCount,
      estimatedSubtotal,
      addItem,
      setQuantity,
      removeItem,
      clear,
      ready,
    }),
    [
      cafeSlug,
      tableToken,
      tableCode,
      currency,
      lines,
      itemCount,
      estimatedSubtotal,
      addItem,
      setQuantity,
      removeItem,
      clear,
      ready,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {otherCafe ? (
        <div
          className="bg-background/80 fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="other-cafe-cart-title"
        >
          <div className="bg-background w-full max-w-sm space-y-4 rounded-2xl border p-5 shadow-lg">
            <div className="space-y-1">
              <h2 id="other-cafe-cart-title" className="text-base font-semibold">
                Start a new cart?
              </h2>
              <p className="text-muted-foreground text-sm">
                Your current cart is from another cafe. Start a new cart?
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="min-h-12 flex-1"
                onClick={() => setOtherCafe(null)}
              >
                Keep cart
              </Button>
              <Button
                type="button"
                className="min-h-12 flex-1"
                onClick={() => {
                  try {
                    for (const key of otherCafe.keys) {
                      sessionStorage.removeItem(key);
                    }
                  } catch {
                    // ignore
                  }
                  setOtherCafe(null);
                }}
              >
                Start new cart
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
