# Virtus AI Operations Intelligence Database Architecture

## Current State

- Supabase client files exist in lib/
- Admin service-role client exists
- No formal Supabase migrations folder existed before this phase
- Existing security reference file:
  - supabase-security/rls-and-storage-policies.sql

## Architecture Principle

Operations Intelligence must be multi-tenant.

Every operational table must connect to:

- workspace_id
- created_by
- assigned user or employee where relevant
- department where relevant
- audit timestamps
- status fields
- future RLS policies

## Core Flow

Employee report
-> AI extraction
-> structured records
-> tasks / payments / urgent issues / decisions
-> daily reports
-> management alerts
-> AI summaries
-> dashboard intelligence
