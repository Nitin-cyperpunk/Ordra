# Indexing Strategy

## Defaults

- Primary keys: UUID (`gen_random_uuid()`)
- Foreign keys: index `cafe_id` on every tenant table
- Composite indexes for common filters: `(cafe_id, created_at DESC)`
- Unique constraints scoped to tenant where needed: `(cafe_id, slug)`

## Guidelines

1. Index for query patterns you measure, not imagined ones.
2. Prefer composite indexes that match `WHERE cafe_id = ? AND …`.
3. Avoid low-selectivity indexes.
4. Use `EXPLAIN ANALYZE` when optimizing.

## Later

- Partial indexes for open orders
- BRIN for very large time-series if BigQuery is not used for analytics

## What you should learn

- How Postgres chooses indexes
- Cost of write amplification from too many indexes
