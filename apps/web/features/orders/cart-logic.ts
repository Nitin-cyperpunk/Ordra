export type CartLine = {
  menuItemId: string;
  name: string;
  /** Display/estimate only — server recalculates on place order. */
  unitPrice: string;
  quantity: number;
};

export const CART_STORAGE_PREFIX = "ordra-cart:";

export function cartStorageKey(cafeSlug: string, tableToken: string | null): string {
  return `${CART_STORAGE_PREFIX}${cafeSlug}:${tableToken ?? "none"}`;
}

export function parseCartLines(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const lines: CartLine[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const menuItemId = String(row.menuItemId ?? "");
    const name = String(row.name ?? "").trim();
    const unitPrice = String(row.unitPrice ?? "");
    const quantity = Number(row.quantity);
    if (!menuItemId || !name) continue;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) continue;
    lines.push({ menuItemId, name, unitPrice, quantity });
  }
  return lines;
}

export function addCartLine(
  lines: CartLine[],
  item: Omit<CartLine, "quantity">,
): CartLine[] {
  const existing = lines.find((line) => line.menuItemId === item.menuItemId);
  if (existing) {
    return lines.map((line) =>
      line.menuItemId === item.menuItemId
        ? { ...line, quantity: Math.min(99, line.quantity + 1) }
        : line,
    );
  }
  return [...lines, { ...item, quantity: 1 }];
}

export function setCartQuantity(
  lines: CartLine[],
  menuItemId: string,
  quantity: number,
): CartLine[] {
  if (quantity <= 0) {
    return lines.filter((line) => line.menuItemId !== menuItemId);
  }
  return lines.map((line) =>
    line.menuItemId === menuItemId ? { ...line, quantity: Math.min(99, quantity) } : line,
  );
}

export function removeCartLine(lines: CartLine[], menuItemId: string): CartLine[] {
  return lines.filter((line) => line.menuItemId !== menuItemId);
}

export function cartItemCount(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function cartEstimatedSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => {
    const n = Number(line.unitPrice);
    return sum + (Number.isFinite(n) ? n : 0) * line.quantity;
  }, 0);
}

export type OtherCafeCart = {
  cafeSlug: string;
  key: string;
};

/** Detect carts stored for a different cafe (sessionStorage keys). */
export function findOtherCafeCarts(
  keys: string[],
  getValue: (key: string) => string | null,
  currentSlug: string,
): OtherCafeCart[] {
  const found: OtherCafeCart[] = [];
  for (const key of keys) {
    if (!key.startsWith(CART_STORAGE_PREFIX)) continue;
    const rest = key.slice(CART_STORAGE_PREFIX.length);
    const cafeSlug = rest.split(":")[0] ?? "";
    if (!cafeSlug || cafeSlug === currentSlug) continue;
    const lines = parseCartLines(safeParseJson(getValue(key)));
    if (lines.length === 0) continue;
    found.push({ cafeSlug, key });
  }
  return found;
}

function safeParseJson(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
