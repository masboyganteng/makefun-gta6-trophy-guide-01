# Leonida Ledger — GTA 6 Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/masboyganteng/makefun-gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/masboyganteng/makefun-gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline web app that is the best guide and tracker for the 55 PlayStation 5
trophies of **Grand Theft Auto VI**: every trophy with its official name,
description and grade, a checklist saved in your browser, filters, a spoiler
setting, a six-phase roadmap to the platinum, missable trophies flagged from
the official descriptions, and a guide to each trophy — written in the author's
own words — that cites its sources.

## What it does

- **Tracker** — all 55 trophies (1 platinum, 2 gold, 6 silver, 46 bronze) with
  official name, description and grade; tick trophies off, add a personal note
  per trophy, and progress saves in your browser (localStorage).
- **Filters** — by grade, by kind (story / strangers & side / activities /
  collectibles / combat & crime / money & property / one-off moments / 100%),
  by missable flag, by earned/unearned, and free-text search.
- **Spoiler setting** — hides the names and descriptions of story trophies
  until you earn them.
- **Export / import** — back up your progress as JSON and import it back on
  any browser.
- **Roadmap to the Platinum** — six phases in order: story, one-off moments,
  stranger strands, activity grinds, collectibles and crime, then money,
  the finale and cleanup.
- **Watch Out** — the 16 trophies whose official descriptions name one specific
  mission, place or moment, flagged so you do them when they appear.
- **Cited guides** — every guide names its sources (official trophy list via
  Exophase, PSNProfiles for the counts PSN tracks). Anything not confirmed on
  launch day is marked **unconfirmed** instead of invented.

## Honesty note

The game launched 19 November 2026 and this guide was written on launch day
without playing it. Every guide is built from the trophy's official
description; no specific location, step or count is stated unless the official
description or a named source supports it.

## Run it

Static files, no build step, no network requests:

```sh
node serve.ts
# then open http://localhost:8080
```

Or serve `app/` with any static file server. It works with the network off.

Try the demo view (13 of 55 trophies pre-earned, so the progress bar, the
spoiler setting and the detail pane are all visible at once):

```text
http://localhost:8080/?demo=1
http://localhost:8080/?demo=1&shot=roadmap
http://localhost:8080/?demo=1&shot=watch
```

## Screenshots

`shots.json` lists the four screenshots in `screenshots/`: the tracker with a
guide open (cover), a trophy guide in detail, the roadmap, and the watch-out
list.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` with the vendored make.fun library.
