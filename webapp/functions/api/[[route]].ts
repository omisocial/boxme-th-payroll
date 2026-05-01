/**
 * Cloudflare Pages Function — catch-all for /api/*
 * Delegates to Hono router. Uses hono/cloudflare-pages handle() adapter.
 *
 * Bindings required in Cloudflare Pages project settings:
 *   DB         — D1 database (boxme-payroll)
 *   SESSION_KV — KV namespace
 *   FILES      — R2 bucket (enable R2 in dashboard first)
 */
import { handle } from 'hono/cloudflare-pages'
import app from '../../src/server/router'

export const onRequest = handle(app)
