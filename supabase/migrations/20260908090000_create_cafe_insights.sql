-- Module 15: Cafe analytics aggregation (no AI).
-- Revenue = completed orders only. Day/hour buckets use cafe timezone.

create index if not exists orders_cafe_completed_at_idx
  on public.orders (cafe_id, completed_at desc)
  where status = 'completed' and completed_at is not null;

comment on index public.orders_cafe_completed_at_idx is
  'Module 15: cafe revenue/order analytics filtered by completed_at';

create index if not exists orders_cafe_rejected_at_idx
  on public.orders (cafe_id, rejected_at desc)
  where status = 'rejected' and rejected_at is not null;

comment on index public.orders_cafe_rejected_at_idx is
  'Module 15: cancelled-order counts by rejected_at';

create or replace function public.get_cafe_insights(
  p_cafe_id uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_prev_from timestamptz,
  p_prev_to timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tz text;
  v_currency text;
  v_current jsonb;
  v_previous jsonb;
  v_hourly jsonb;
  v_daily jsonb;
  v_top_items jsonb;
  v_categories jsonb;
  v_tables jsonb;
  v_status jsonb;
begin
  if auth.uid() is null then
    raise exception 'INSIGHTS_FORBIDDEN';
  end if;

  if private.current_user_cafe_role(p_cafe_id) is null then
    raise exception 'INSIGHTS_FORBIDDEN';
  end if;

  if p_from is null or p_to is null or p_from >= p_to then
    raise exception 'INSIGHTS_BAD_RANGE';
  end if;

  if p_prev_from is null or p_prev_to is null or p_prev_from >= p_prev_to then
    raise exception 'INSIGHTS_BAD_RANGE';
  end if;

  select coalesce(timezone, 'Asia/Kolkata'), coalesce(currency, 'INR')
  into v_tz, v_currency
  from public.cafes
  where id = p_cafe_id;

  if not found then
    raise exception 'INSIGHTS_FORBIDDEN';
  end if;

  -- Current period completed sales
  select jsonb_build_object(
    'revenue', coalesce(sum(o.total), 0),
    'orders', count(*)::int,
    'sessions', count(distinct o.customer_session_id)::int,
    'aov', case
      when count(*) = 0 then 0
      else round(coalesce(sum(o.total), 0) / count(*), 2)
    end
  )
  into v_current
  from public.orders o
  where o.cafe_id = p_cafe_id
    and o.status = 'completed'
    and o.completed_at >= p_from
    and o.completed_at < p_to;

  -- Previous period completed sales (comparison)
  select jsonb_build_object(
    'revenue', coalesce(sum(o.total), 0),
    'orders', count(*)::int,
    'sessions', count(distinct o.customer_session_id)::int,
    'aov', case
      when count(*) = 0 then 0
      else round(coalesce(sum(o.total), 0) / count(*), 2)
    end
  )
  into v_previous
  from public.orders o
  where o.cafe_id = p_cafe_id
    and o.status = 'completed'
    and o.completed_at >= p_prev_from
    and o.completed_at < p_prev_to;

  -- Status counts in current window (completed by completed_at; cancelled by rejected_at)
  select jsonb_build_object(
    'completed', (
      select count(*)::int
      from public.orders o
      where o.cafe_id = p_cafe_id
        and o.status = 'completed'
        and o.completed_at >= p_from
        and o.completed_at < p_to
    ),
    'cancelled', (
      select count(*)::int
      from public.orders o
      where o.cafe_id = p_cafe_id
        and o.status = 'rejected'
        and o.rejected_at >= p_from
        and o.rejected_at < p_to
    ),
    'active', (
      select count(*)::int
      from public.orders o
      where o.cafe_id = p_cafe_id
        and o.status in ('pending', 'confirmed', 'preparing', 'ready')
    )
  )
  into v_status;

  -- Returning vs new guest sessions (among completed in period).
  -- Returning = session had a completed order before p_from.
  select v_current || jsonb_build_object(
    'new_sessions', coalesce((
      select count(*)::int
      from (
        select distinct o.customer_session_id as session_id
        from public.orders o
        where o.cafe_id = p_cafe_id
          and o.status = 'completed'
          and o.completed_at >= p_from
          and o.completed_at < p_to
      ) ps
      where not exists (
        select 1
        from public.orders prior
        where prior.cafe_id = p_cafe_id
          and prior.status = 'completed'
          and prior.customer_session_id = ps.session_id
          and prior.completed_at < p_from
      )
    ), 0),
    'returning_sessions', coalesce((
      select count(*)::int
      from (
        select distinct o.customer_session_id as session_id
        from public.orders o
        where o.cafe_id = p_cafe_id
          and o.status = 'completed'
          and o.completed_at >= p_from
          and o.completed_at < p_to
      ) ps
      where exists (
        select 1
        from public.orders prior
        where prior.cafe_id = p_cafe_id
          and prior.status = 'completed'
          and prior.customer_session_id = ps.session_id
          and prior.completed_at < p_from
      )
    ), 0)
  )
  into v_current;

  -- Hourly (cafe-local) from completed_at
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'hour', bucket.hour,
      'orders', bucket.orders,
      'revenue', bucket.revenue
    )
    order by bucket.hour
  ), '[]'::jsonb)
  into v_hourly
  from (
    select
      extract(hour from timezone(v_tz, o.completed_at))::int as hour,
      count(*)::int as orders,
      coalesce(sum(o.total), 0) as revenue
    from public.orders o
    where o.cafe_id = p_cafe_id
      and o.status = 'completed'
      and o.completed_at >= p_from
      and o.completed_at < p_to
    group by 1
  ) bucket;

  -- Daily (cafe-local calendar date)
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'date', bucket.day,
      'orders', bucket.orders,
      'revenue', bucket.revenue
    )
    order by bucket.day
  ), '[]'::jsonb)
  into v_daily
  from (
    select
      (timezone(v_tz, o.completed_at))::date as day,
      count(*)::int as orders,
      coalesce(sum(o.total), 0) as revenue
    from public.orders o
    where o.cafe_id = p_cafe_id
      and o.status = 'completed'
      and o.completed_at >= p_from
      and o.completed_at < p_to
    group by 1
  ) bucket;

  -- Top items (snapshots)
  select coalesce(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  into v_top_items
  from (
    select
      oi.item_name_snapshot as name,
      sum(oi.quantity)::int as quantity,
      coalesce(sum(oi.line_total), 0) as revenue
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.cafe_id = p_cafe_id
      and o.status = 'completed'
      and o.completed_at >= p_from
      and o.completed_at < p_to
    group by oi.item_name_snapshot
    order by sum(oi.line_total) desc, sum(oi.quantity) desc
    limit 8
  ) t;

  -- Categories (current menu category when FK still present; else Uncategorized)
  select coalesce(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  into v_categories
  from (
    select
      coalesce(mc.name, 'Uncategorized') as name,
      sum(oi.quantity)::int as quantity,
      coalesce(sum(oi.line_total), 0) as revenue
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    left join public.menu_items mi on mi.id = oi.menu_item_id
    left join public.menu_categories mc on mc.id = mi.category_id
    where o.cafe_id = p_cafe_id
      and o.status = 'completed'
      and o.completed_at >= p_from
      and o.completed_at < p_to
    group by coalesce(mc.name, 'Uncategorized')
    order by sum(oi.line_total) desc
    limit 12
  ) t;

  -- Tables
  select coalesce(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  into v_tables
  from (
    select
      coalesce(ct.code, 'Unknown') as table_code,
      count(*)::int as orders,
      coalesce(sum(o.total), 0) as revenue
    from public.orders o
    left join public.cafe_tables ct on ct.id = o.table_id
    where o.cafe_id = p_cafe_id
      and o.status = 'completed'
      and o.completed_at >= p_from
      and o.completed_at < p_to
    group by coalesce(ct.code, 'Unknown')
    order by sum(o.total) desc
    limit 8
  ) t;

  return jsonb_build_object(
    'timezone', v_tz,
    'currency', v_currency,
    'range', jsonb_build_object(
      'from', p_from,
      'to', p_to,
      'prev_from', p_prev_from,
      'prev_to', p_prev_to
    ),
    'current', v_current,
    'previous', v_previous,
    'status', v_status,
    'hourly', v_hourly,
    'daily', v_daily,
    'top_items', v_top_items,
    'categories', v_categories,
    'tables', v_tables
  );
end;
$$;

revoke all on function public.get_cafe_insights(uuid, timestamptz, timestamptz, timestamptz, timestamptz)
  from public, anon;
grant execute on function public.get_cafe_insights(uuid, timestamptz, timestamptz, timestamptz, timestamptz)
  to authenticated;

comment on function public.get_cafe_insights(uuid, timestamptz, timestamptz, timestamptz, timestamptz) is
  'Module 15 cafe analytics. Membership-gated. Aggregates completed-order revenue in cafe timezone buckets.';
