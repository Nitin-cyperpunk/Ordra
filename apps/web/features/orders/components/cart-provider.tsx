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

export type CartLine = {
  menuItemId: string;
  name: string;
  /** Display/estimate only — server recalculates on place order. */
  unitPrice: string;
  quantity: number;
};

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

function storageKey(cafeSlug: string, tableToken: string | null): string {
  return `ordra-cart:${cafeSlug}:${tableToken ?? "none"}`;
}

function parsePrice(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

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

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey(cafeSlug, tableToken));
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        if (Array.isArray(parsed)) setLines(parsed);
      } else {
        setLines([]);
      }
    } catch {
      setLines([]);
    }
    setReady(true);
  }, [cafeSlug, tableToken]);

  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(storageKey(cafeSlug, tableToken), JSON.stringify(lines));
    } catch {
      // ignore quota / private mode
    }
  }, [lines, cafeSlug, tableToken, ready]);

  const addItem = useCallback((item: Omit<CartLine, "quantity">) => {
    setLines((prev) => {
      const existing = prev.find((line) => line.menuItemId === item.menuItemId);
      if (existing) {
        return prev.map((line) =>
          line.menuItemId === item.menuItemId
            ? { ...line, quantity: Math.min(99, line.quantity + 1) }
            : line,
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const setQuantity = useCallback((menuItemId: string, quantity: number) => {
    setLines((prev) => {
      if (quantity <= 0) {
        return prev.filter((line) => line.menuItemId !== menuItemId);
      }
      return prev.map((line) =>
        line.menuItemId === menuItemId
          ? { ...line, quantity: Math.min(99, quantity) }
          : line,
      );
    });
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    setLines((prev) => prev.filter((line) => line.menuItemId !== menuItemId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const itemCount = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines],
  );

  const estimatedSubtotal = useMemo(
    () =>
      lines.reduce((sum, line) => sum + parsePrice(line.unitPrice) * line.quantity, 0),
    [lines],
  );

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

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
