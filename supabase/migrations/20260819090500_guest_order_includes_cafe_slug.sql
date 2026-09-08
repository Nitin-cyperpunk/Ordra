-- Module 13: return cafe slug on guest order lookup so tracking can link back to the menu.
-- Signature unchanged; still service_role only.

create or replace function public.get_customer_order(
  p_public_token text,
  p_customer_session_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_cafe_name text;
  v_cafe_slug text;
  v_table_code text;
  v_items jsonb;
begin
  if p_public_token is null or trim(p_public_token) = '' then
    return null;
  end if;
  if p_customer_session_id is null or char_length(p_customer_session_id) < 32 then
    return null;
  end if;

  select * into v_order
  from public.orders
  where public_token = trim(p_public_token)
    and customer_session_id = p_customer_session_id;

  if not found then
    return null;
  end if;

  select c.name, c.slug, t.code
  into v_cafe_name, v_cafe_slug, v_table_code
  from public.cafes c
  join public.cafe_tables t on t.id = v_order.table_id
  where c.id = v_order.cafe_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', oi.id,
      'name', oi.item_name_snapshot,
      'price', oi.item_price_snapshot,
      'quantity', oi.quantity,
      'line_total', oi.line_total
    ) order by oi.created_at
  ), '[]'::jsonb)
  into v_items
  from public.order_items oi
  where oi.order_id = v_order.id;

  return jsonb_build_object(
    'public_token', v_order.public_token,
    'order_number', v_order.order_number,
    'status', v_order.status,
    'subtotal', v_order.subtotal,
    'total', v_order.total,
    'notes', v_order.notes,
    'created_at', v_order.created_at,
    'cafe_name', v_cafe_name,
    'cafe_slug', v_cafe_slug,
    'table_code', v_table_code,
    'currency', (select currency from public.cafes where id = v_order.cafe_id),
    'items', v_items
  );
end;
$$;

revoke all on function public.get_customer_order(text, text) from public, anon, authenticated;
grant execute on function public.get_customer_order(text, text) to service_role;
