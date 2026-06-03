# RefDecoder — Reference Gaps Report
Generated: 2026-05-27

## Summary
| Metric | Count |
|---|---|
| Total refs in database before this run | 65 |
| New refs added this run | 514 |
| Total refs now | 579 |
| New refs with model family + decoded material | 260 |
| New refs with family only (material null) | 129 |
| New refs with number only (no family) | 125 |
| High-confidence new refs (appeared on 3+ sources) | 60 |

Per-source contribution this run:
```
  Rubber B               91 found,   56 new
  Wrist Aficionado      141 found,  116 new
  Tiger River            76 found,   59 new
  Chrono6538            184 found,  154 new
  WatchGuys             442 found,  387 new
```

> Note: `why_it_matters` (editorial market significance) cannot be auto-decoded from
> digits, so every newly-scraped ref currently has it null. These are the prime
> candidates for manual enrichment below.

## High Priority Gaps
References that appear on **3+ sources** (well-corroborated, clearly real) but still
have a null `why_it_matters`. These are the highest-value targets for hand-written
significance notes:

| Reference | Family | Sources |
|---|---|---|
| 126655 | Yacht-Master | rubberb, wristaficionado, tigerriver, chrono6538, watchguys |
| 116610 | Submariner | rubberb, tigerriver, chrono6538, watchguys |
| 126234 | Datejust | rubberb, wristaficionado, tigerriver, watchguys |
| 126710 | GMT-Master II | wristaficionado, tigerriver, chrono6538, watchguys |
| 128238 | Day-Date | rubberb, wristaficionado, tigerriver, watchguys |
| 14060 | Submariner | rubberb, tigerriver, chrono6538, watchguys |
| 14270 | Explorer | rubberb, tigerriver, chrono6538, watchguys |
| 16610 | Submariner | rubberb, tigerriver, chrono6538, watchguys |
| 226570 | Explorer II | rubberb, wristaficionado, chrono6538, watchguys |
| 1019 | Milgauss | tigerriver, chrono6538, watchguys |
| 114200 | Air-King | tigerriver, chrono6538, watchguys |
| 116334 | Datejust | tigerriver, chrono6538, watchguys |
| 116400 | Milgauss | tigerriver, chrono6538, watchguys |
| 116400GV | Milgauss | tigerriver, chrono6538, watchguys |
| 116505 | Daytona | rubberb, chrono6538, watchguys |
| 116613 | Submariner | tigerriver, chrono6538, watchguys |
| 116618 | Submariner | tigerriver, chrono6538, watchguys |
| 116660 | Sea-Dweller | rubberb, chrono6538, watchguys |
| 116688 | Yacht-Master II | tigerriver, chrono6538, watchguys |
| 124200 | Oyster Perpetual | wristaficionado, chrono6538, watchguys |

## Families with Most Missing Data
Ranked by number of newly-added references; "% material" = share with a confidently
decoded case material (the rest need manual material/dial/era data):

| Family | New refs | % material decoded |
|---|---|---|
| (undecoded / unknown family) | 125 | 42% |
| Datejust | 59 | 78% |
| Day-Date | 34 | 88% |
| Lady-Datejust | 32 | 78% |
| Daytona | 30 | 77% |
| GMT-Master II | 27 | 85% |
| Cellini | 23 | 0% |
| Date | 22 | 64% |
| Submariner | 19 | 84% |
| Oyster Perpetual | 19 | 79% |
| Sky-Dweller | 18 | 78% |
| Daytona (Manual Wind) | 12 | 0% |
| Explorer | 11 | 45% |
| Ladies Date / Ladies Datejust | 9 | 67% |
| Yacht-Master | 9 | 22% |
| Daytona Cosmograph | 8 | 75% |
| Air-King | 7 | 43% |
| Yacht-Master II | 6 | 83% |
| Milgauss | 5 | 40% |
| Sea-Dweller | 5 | 80% |
| GMT-Master | 5 | 60% |
| Deepsea | 5 | 40% |
| Datejust 31 | 4 | 25% |
| Explorer II | 3 | 67% |
| Day-Date II | 3 | 67% |
| Yacht-Master 31 | 2 | 50% |
| Yacht-Master 29 | 2 | 0% |
| Datejust 36 | 2 | 100% |
| Midsize Oyster Perpetual Datejust | 2 | 100% |
| Day-Date 36 | 2 | 100% |
| Datejust 41 | 1 | 100% |
| Day-Date 40 | 1 | 100% |
| Ladies Oyster Perpetual | 1 | 100% |
| Datejust II | 1 | 100% |

## Recommended Next Sources to Scrape
Based on what these five sources covered well (modern 6-digit refs) versus what is
still thin (vintage 4-digit families, ladies' references, and editorial significance):

1. **Jake's Rolex World — Reference Library** — https://www.jakehassociates.com / rolexmagazine.com
   Strongest vintage coverage (4-digit Submariner/Daytona/GMT), good for the
   125 number-only refs that currently have no family.
3. **Rolex official current collection** — https://www.rolex.com/watches
   Authoritative for current-production 12x/22x refs, dial colors, and exact materials —
   the cleanest source for filling dial_color and case_material.
4. **WatchSleuth Rolex Reference Search** — http://www.watchsleuth.com/oysterinfo/
   Structured reference→model/year database, ideal for batch-filling era and family
   on the ladies' (6xxxx/7xxxx) and Cellini (4xxx/5xxx) references.
5. **r/rolex & RolexForums reference threads** — https://www.rolexforums.com
   Community nicknames and "why it matters" context — the editorial layer that the
   five structured catalogues above lack.
