import { THEME_INIT_SCRIPT } from "@/lib/theme";

/**
 * Inline head script — applies theme before first paint (no next/script).
 */
export function ThemeScript() {
  return (
    <script
      // Prevents FOUC; must stay synchronous in <head>.
      dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
    />
  );
}
