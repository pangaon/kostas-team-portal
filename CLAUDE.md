# CLAUDE.md — kostas-team-portal

Agent instructions for this repo. Read this first.

## What this is
A youth sports team portal: rosters, lineups, a live game console (scorers, fair-play minutes, subs), snacks scheduling, league standings, parent and coach roles, and push notifications. Live at badoni.ca and badoni.app.

## Stack
Next.js with Supabase (Postgres, Realtime, Storage), Stripe payments, and Web Push (VAPID). It is a PWA with an auto-updating service worker.

## Branches and deploy
Two branches: main is production (badoni.ca / badoni.app, auto-deploys on Vercel); platform is the active development branch where the newest work lives. To ship, merge platform into main. Workflow: pull, make a branch, edit, verify, commit, push, and Vercel builds automatically. Never create v2 folders or duplicate copies; use git branches instead.

## Rules
Secrets live in environment variables (see .env.example). Never commit .env or print keys, tokens, or the Stripe secret. Keep Stripe webhooks signature-verified and enforce auth and ownership checks on every mutation. Watch performance: avoid N+1 queries and batch storage reads.

## Data
Reusable datasets belong in the owner's Datasets folder, not in this repo.
