# Cafe assets Storage

Bucket `cafe-assets` is created in Module 8:

`20260814200100_create_cafe_assets_storage.sql`

## Paths

```text
cafe/{cafe_id}/menu/{item_id}/{uuid}.{ext}   # menu images (implemented)
cafe/{cafe_id}/logo/{uuid}.{ext}             # reserved
cafe/{cafe_id}/cover/{uuid}.{ext}            # reserved
```

## Policies

- SELECT: public (future digital menu / QR)
- INSERT/UPDATE/DELETE: authenticated owner/manager of the cafe UUID in the path

## Limits

- 2 MiB
- PNG / JPEG / WebP only (HEIC deferred)
- No Cloudinary/CDN transforms yet
