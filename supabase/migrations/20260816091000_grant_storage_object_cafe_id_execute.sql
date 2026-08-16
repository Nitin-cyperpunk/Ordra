-- Fix: private.storage_object_cafe_id was revoked from PUBLIC without a follow-up
-- grant to authenticated. Storage RLS policies call it as the invoking role, so
-- menu-import (and cafe-assets) uploads fail with:
--   permission denied for function storage_object_cafe_id

grant execute on function private.storage_object_cafe_id(text) to authenticated;
grant execute on function private.storage_object_cafe_id(text) to service_role;
