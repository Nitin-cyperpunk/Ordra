# Smart menu import (Module 10.7)

Owners and managers can upload an existing menu (PDF / JPG / PNG / WEBP), review a structured draft, then approve creation of categories and items.

AI never publishes directly.

## Flow

1. Upload → private Storage + `menu_imports` row (`uploaded` → `processing`)
2. Document processor + menu extractor → `extracted_payload`
3. Status `review` (or `failed`)
4. Human edit / select items
5. `commit_menu_import` RPC creates categories/items atomically → `completed`

## Tables

- `menu_imports` — job metadata, provider id, draft JSON, approval audit fields
- `menu_items.source_import_id` — optional link back to the import job

## Storage

Private bucket `menu-imports` (10 MB). Path:

```text
cafe/{cafe_id}/imports/{import_id}/original.{ext}
```

Owner/manager only via Storage RLS.

## Providers

App code depends on `DocumentProcessor` + `MenuExtractor` interfaces.

- Local PDF text (`pdf-parse`) + heuristic extractor when no API key
- Optional Gemini (`GEMINI_API_KEY`) for images / weak PDF text

## Routes

- `/dashboard/cafes/[cafeId]/menu/import`
- `/dashboard/cafes/[cafeId]/menu/import/[importId]`
