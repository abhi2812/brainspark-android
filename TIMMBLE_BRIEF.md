# Timmble — Project Brief

_A short overview of what we're building and how, for review._

## What it is

A mobile app (Android first) of short, friendly learning games for kids **~3–8**,
set up and monitored by a parent. **Free, no ads, no data selling.**

## Positioning (deliberate)

We do **not** claim to boost IQ or "cognitive ability" — that's scientifically
unsupported and legally risky (see Lumosity's $2M FTC settlement). We position
honestly as **fun, safe educational play + practice**. The **parent is the
customer**; trust and delight are the product.

## Where it came from

- Formerly **"BrainSpark"** → renamed to **Timmble** (BrainSpark was already taken
  on the Play Store by a competitor, plus trademark conflicts).
- Domain **timmble.com** secured.
- Android package id **`com.safestop.timmble`** (SafeStop is the parent entity).

## Architecture (how)

| Layer | Choice | Notes |
|---|---|---|
| **App** | React Native (Expo libraries) | Built **natively & free** via Gradle → signed APK. No paid cloud build service. |
| **Backend** | **Go** (`net/http` + Postgres) | Rewritten from an untested Java module. 5 endpoints; idempotent session writes. Repo: `github.com/abhi2812/timmble-api`. |
| **Hosting** | **AWS Lightsail**, 1 box | Go binary + Postgres + Caddy (auto-HTTPS) + systemd. **~$5–7/month flat.** Live at `https://api.timmble.com`. |
| **Testing** | Go unit + end-to-end; app integration tests | Backend verified over live HTTPS. App tests render screens and drive real flows. |

**Cost discipline:** deliberately **no load balancer / managed DB / cloud meters.**
An earlier over-provisioned AWS stack produced a ~$68/mo surprise bill; it was torn
down and replaced with the flat ~$5–7/mo box above.

## Current focus

The app's UX read as generic / "AI-made." We're doing a design overhaul to a
**mascot-led** identity:

- An original character (**"Timmo"**) as the face of the app.
- A custom design system (warm palette, real type scale, motion) replacing the
  default template look.
- Hand-built **SVG art** replacing emoji icons.
- Validated by installing **real APK builds** on a phone and judging against a
  concrete "slop vs. crafted" rubric.

## Status

- ✅ Backend live & verified (HTTPS, database, all endpoints).
- ✅ Rebrand complete (name, package id, repos, signing key).
- ✅ AWS cost issue resolved (~$60/mo stopped; credit requested).
- 🔄 UI redesign of the first screen (Home) drafted; visual + test verification in progress.

## What's next

1. Get the new app integration tests running green.
2. Build a fresh APK and eyeball the redesigned Home against the rubric.
3. Iterate screen-by-screen (depth over breadth) until it reads as crafted, not templated.
4. Closed-testing pilot on Google Play with real families; measure whether kids
   return for a 2nd session (the real signal that any of this matters).
