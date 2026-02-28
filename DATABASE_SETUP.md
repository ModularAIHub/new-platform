# Database Connection Runbook

Incident date: February 28, 2026

This document captures the database connection failure we hit across `new-platform` and `tweet-genie`, what the actual root cause was, how we diagnosed it, and what to do next time.

## Scope

This runbook is relevant to:

- [new-platform/server/config/database.js](/f:/suitegenie/new-platform/server/config/database.js)
- [tweet-genie/server/config/database.js](/f:/suitegenie/tweet-genie/server/config/database.js)
- [new-platform/server/.env](/f:/suitegenie/new-platform/server/.env)
- [tweet-genie/server/.env](/f:/suitegenie/tweet-genie/server/.env)

## What Happened

We were seeing login and register failures, followed by broader app failures in Tweet Genie and the main platform.

The important part is that we actually hit more than one problem:

1. A wrong database URL / password was used in one app.
2. After repeated failed auth attempts, the Supabase pooler started returning:
   `XX000 Circuit breaker open: Too many authentication errors`
3. Even after fixing the password, the pooler stayed unhealthy for a while.
4. The direct database host still worked.

So the final situation was:

- Wrong credentials caused the first breakage.
- Pooler circuit-breaker behavior kept the pooled connection broken after the credentials were corrected.
- Direct connection was a valid temporary workaround.

## Symptoms We Saw

Common errors during this incident:

- `password authentication failed for user "postgres"`
- `Connection terminated unexpectedly`
- `Connection terminated due to connection timeout`
- `Circuit breaker open: Too many authentication errors`
- frontend `500` responses on:
  - `/api/credits/balance`
  - `/api/twitter/status`
  - `/api/twitter/token-status`
  - `/api/dashboard/bootstrap`

What those usually mean:

- `28P01 password authentication failed`: wrong username/password or wrong connection string format
- `timeout` / `connection terminated`: network path or upstream connectivity issue
- `XX000 Circuit breaker open`: the pooler is refusing traffic after repeated auth failures; this is not a normal application bug

## Root Cause

### Root cause 1: wrong connection string

Tweet Genie had an incorrect `DATABASE_URL`, which caused hard auth failures against Postgres.

That is an app config problem, not a React/frontend problem.

### Root cause 2: Supabase pooler remained unhealthy after bad auth attempts

After enough failed attempts, both pooler endpoints continued returning:

- session-style pooler on `:5432`
- transaction-style pooler on `:6543`

At the same time, the direct database host succeeded.

This is the key lesson:

If direct works and pooler still returns circuit-breaker/auth errors, the immediate issue is no longer your SQL code. It is the pooled connection path.

## What Was Not The Cause

These were not the primary cause of the incident:

- React `useState` / `useEffect`
- normal frontend `axios` calls
- login form logic
- `pg.Pool` timeouts on healthy connections

The frontend was only calling the backend. The failing hop was backend -> Postgres.

## Connection Modes

These are the connection patterns we care about.

### Direct connection

Pattern:

```text
postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
```

Use when:

- local development
- long-lived Node servers
- temporary emergency fallback when the pooler is unhealthy

Tradeoff:

- not the preferred permanent option for serverless runtimes

### Session pooler

Pattern:

```text
postgresql://postgres.<project-ref>:<password>@aws-1-<region>.pooler.supabase.com:5432/postgres
```

Use when:

- persistent backend
- needs pooled access over IPv4

### Transaction pooler

Pattern:

```text
postgresql://postgres.<project-ref>:<password>@aws-1-<region>.pooler.supabase.com:6543/postgres
```

Use when:

- serverless functions
- edge-style short-lived compute

## Decision Rule We Used

For this incident, the practical rule was:

1. If auth fails with `28P01`, fix the connection string first.
2. If the pooler keeps returning `circuit breaker open` after the credential fix, stop using the pooler temporarily.
3. Switch local testing to the direct host.
4. Finish app-level debugging locally.
5. Later, move back to the pooler if the runtime really needs it.

## How We Diagnosed It

The useful diagnosis sequence was:

1. Confirm whether the browser is talking to Supabase directly.
   Result: no, the browser was talking to our backend.
2. Confirm whether login/register fail on the backend -> DB hop.
   Result: yes.
3. Compare connection modes with one-off `pg` tests.
   Result:
   - pooler `:5432` failed
   - pooler `:6543` failed
   - direct host succeeded

That comparison is what isolated the problem correctly.

## Recovery Checklist

Use this checklist next time.

### Step 1: stop bad traffic

Stop every process still using the bad connection string:

- local dev servers
- background workers
- staging deployments
- production deployments

If one stale process keeps retrying the old credentials, the pooler can stay noisy.

### Step 2: verify the exact connection string

Do not hand-build the string if you can avoid it.

Copy the exact current value from Supabase dashboard.

Check all of these:

- username format
- password
- host
- port
- whether it is direct vs pooler

### Step 3: test outside the app

Before blaming app code, run a one-off connection test with `pg`.

Expected outcomes:

- `SELECT 1` succeeds: the DB path is healthy
- `28P01`: credentials or string are wrong
- `XX000 circuit breaker open`: pooler path is still unhealthy

### Step 4: choose the temporary mode

If pooler is still unhealthy but direct works:

- use direct locally
- use direct temporarily in production only if absolutely necessary and traffic is tiny

### Step 5: restart after env changes

Changing `.env` does nothing until the process is restarted.

This sounds obvious, but it is easy to forget during a stressful incident.

## Local Development Guidance

For local testing, direct connection is acceptable and often simpler.

Recommended local rule:

- `new-platform`: direct is fine
- `tweet-genie`: direct is fine

This is especially useful when:

- we are validating team mode fixes
- we are checking OAuth/account wiring
- we are isolating app bugs unrelated to connection pooling

## Production Guidance

For production, use the connection mode that matches the runtime.

Working rule from this incident:

- persistent server: direct or session pooler can be fine
- serverless runtime: transaction pooler is the intended long-term choice

Temporary exception:

- if the pooler is unhealthy and we need a short-term recovery, direct can be used as a workaround

That should be treated as temporary, not as the final architecture decision.

## Repo-Specific Notes

### New Platform

[new-platform/server/config/database.js](/f:/suitegenie/new-platform/server/config/database.js)

- uses a single `Pool`
- marks timeout / terminated / circuit-breaker style errors as `DATABASE_UNAVAILABLE`
- retries transient query failures once by default

### Tweet Genie

[tweet-genie/server/config/database.js](/f:/suitegenie/tweet-genie/server/config/database.js)

- uses a separate `Pool`
- retries retryable connection errors
- was the app where the wrong `DATABASE_URL` was discovered during this incident

### Tweet Genie refresh path

One unrelated but useful note from the same debugging session:

`tweet-genie` should use a real backend URL for platform refresh flows, not the frontend URL.

That means `PLATFORM_API_URL` should point to the backend, for example:

```text
http://localhost:3000
```

not the Vite frontend.

## What To Do If This Happens Again

Short version:

1. Check whether the credentials are wrong.
2. Run a one-off direct connection test.
3. Run a one-off pooler connection test.
4. If direct works and pooler fails, stop debugging React and stop rewriting auth code.
5. Use direct locally, finish app debugging, then revisit pooler later.

## Security Reminder

Never keep real database passwords in docs, commits, screenshots, or chat logs longer than necessary.

If a real credential was pasted anywhere public or semi-public during debugging:

1. rotate the password
2. update every environment
3. restart all affected services

## Final Lesson

The biggest mistake in incidents like this is assuming every error is the same error.

In this case, we had:

- an initial credential problem
- a later pooler-path problem
- app-level symptoms that looked like generic backend bugs

Those are different layers. Separating them quickly is what made the diagnosis useful.
