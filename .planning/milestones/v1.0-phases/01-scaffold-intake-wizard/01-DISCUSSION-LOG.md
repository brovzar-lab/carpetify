# Phase 1: Scaffold + Intake Wizard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-21
**Phase:** 01-scaffold-intake-wizard
**Areas discussed:** Wizard navigation, Project dashboard, Financial input UX, Screenplay parse UI

---

## Wizard Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Free navigation | All 5 screens accessible anytime via sidebar/tabs | ✓ |
| Sequential unlock | Screens unlock as prior ones completed | |
| Soft sequential | Guided order with warnings, user CAN skip | |

**User's choice:** Free navigation
**Notes:** No sequential gating. User fills screens in any order.

| Option | Description | Selected |
|--------|-------------|----------|
| Sidebar with steps | Persistent left sidebar with completion status icons | ✓ |
| Top stepper bar | Horizontal 1-2-3-4-5 indicator | |
| Tab bar | Horizontal tabs | |

**User's choice:** Sidebar with steps

| Option | Description | Selected |
|--------|-------------|----------|
| Traffic light icons | 🟢 complete, 🟡 partial, 🔴 errors per screen | ✓ |
| Counts | "3/8 fields" or "2 issues" | |
| Both | Icon + count | |

**User's choice:** Traffic light icons

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-save | Debounced to Firestore, no save button, like Notion | ✓ |
| Explicit save | Save button per screen | |
| You decide | Claude picks | |

**User's choice:** Auto-save (Recommended)

---

## Project Dashboard

| Option | Description | Selected |
|--------|-------------|----------|
| Project cards | Card per project with title, genre, period, completion % | ✓ |
| Table/list | Compact rows | |
| You decide | Claude picks | |

**User's choice:** Project cards

**Card info selected (multi-select):** Title + genre + period, Overall completion %, Validation status, Budget + EFICINE amount — all four selected.

| Option | Description | Selected |
|--------|-------------|----------|
| Delete with confirm | Permanent deletion with dialog | ✓ |
| Archive only | Hidden but recoverable | |

**User's choice:** Delete with confirm

| Option | Description | Selected |
|--------|-------------|----------|
| Quick create | Button creates blank project, lands in wizard | ✓ |
| Mini form first | Modal for title + genre + period | |

**User's choice:** Quick create

| Option | Description | Selected |
|--------|-------------|----------|
| Independent only | Each project is a silo | |
| Shared ERPI data | Company info entered once, shared across projects | ✓ |

**User's choice:** Shared ERPI data

| Option | Description | Selected |
|--------|-------------|----------|
| Block with message | Disable create at 3 projects | |
| Allow unlimited | No project limit | ✓ |

**User's choice:** Allow unlimited

| Option | Description | Selected |
|--------|-------------|----------|
| Settings/profile area | Separate "Datos ERPI" section | ✓ |
| First project setup | Entered during first project wizard | |
| You decide | | |

**User's choice:** Settings/profile area

| Option | Description | Selected |
|--------|-------------|----------|
| No grouping | Flat list | |
| Group by period | Projects grouped under period headers | ✓ |

**User's choice:** Group by period

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, in ERPI settings | Prior EFICINE history alongside company data | ✓ |
| Per project | Each wizard asks independently | |
| You decide | | |

**User's choice:** Yes, in ERPI settings

| Option | Description | Selected |
|--------|-------------|----------|
| Clean and minimal | Notion/Linear feel | ✓ |
| Data-dense | Project management tool feel | |
| You decide | | |

**User's choice:** Clean and minimal

| Option | Description | Selected |
|--------|-------------|----------|
| Countdown banner | Days until next registration close at top | |
| On project cards | Each card shows days until its period closes | ✓ |
| No deadline UI | User knows the dates | |
| You decide | | |

**User's choice:** On project cards

| Option | Description | Selected |
|--------|-------------|----------|
| Light only | Single theme | |
| Dark mode too | System-preference-aware | ✓ |

**User's choice:** Dark mode too

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, clone button | Clone with all data for resubmission | ✓ |
| No, start fresh | Each project starts blank | |
| You decide | | |

**User's choice:** Yes, clone button

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, auto-open last | Dashboard is waypoint | |
| Always show dashboard | Dashboard is home | ✓ |

**User's choice:** Always show dashboard

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, readiness score | % or label per card | ✓ |
| Just traffic light | Validation counts cover it | |
| You decide | | |

**User's choice:** Yes, readiness score

---

## Financial Input UX

| Option | Description | Selected |
|--------|-------------|----------|
| Live sidebar panel | Persistent compliance panel on right | |
| Inline under fields | Indicators below each input | |
| Both | Inline + summary panel | ✓ |

**User's choice:** Both

| Option | Description | Selected |
|--------|-------------|----------|
| Dynamic list | "+ Agregar aportante" button, add/remove rows | ✓ |
| Fixed table | Pre-built table with blank rows | |
| You decide | | |

**User's choice:** Dynamic list

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, live formatting | Format as user types | |
| Format on blur | Format when field loses focus | ✓ |
| You decide | | |

**User's choice:** Format on blur

| Option | Description | Selected |
|--------|-------------|----------|
| Immediate red alert | Instant field border + error | |
| Warning after blur | Show after user finishes typing | ✓ |
| You decide | | |

**User's choice:** Warning after blur

| Option | Description | Selected |
|--------|-------------|----------|
| Toggle reveals fields | Inline additional fields | ✓ |
| Separate sub-screen | Own tab within financial screen | |
| You decide | | |

**User's choice:** Toggle reveals fields

| Option | Description | Selected |
|--------|-------------|----------|
| Always visible | Fixed right panel | ✓ |
| Collapsible | Expandable with click | |
| You decide | | |

**User's choice:** Always visible

| Option | Description | Selected |
|--------|-------------|----------|
| Per-person on team screen | In-kind per team member, financial shows total | ✓ |
| Summary on financial | Lump total on financial screen | |
| Both linked | Both editable, kept in sync | |

**User's choice:** Per-person on team screen

| Option | Description | Selected |
|--------|-------------|----------|
| Pie/donut chart | Visual funding breakdown | |
| Stacked bar | Horizontal bar | |
| Numbers only | Keep it clean | ✓ |
| You decide | | |

**User's choice:** Numbers only

| Option | Description | Selected |
|--------|-------------|----------|
| Toggle to show | "Tiene gestor?" switch reveals fee field | ✓ |
| Always visible | Field always present | |
| You decide | | |

**User's choice:** Toggle to show

---

## Screenplay Parse UI

| Option | Description | Selected |
|--------|-------------|----------|
| Editable table | Table with editable cells | |
| Side-by-side | PDF viewer left, parsed data right | ✓ |
| Summary + detail | Summary cards with expandable detail | |

**User's choice:** Side-by-side

| Option | Description | Selected |
|--------|-------------|----------|
| Manual entry fallback | Warning + manual fields | ✓ |
| Retry with options | Retry different settings | |
| You decide | | |

**User's choice:** Manual entry fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Replace with warning | Confirm dialog, preserves other data | ✓ |
| Version history | Keep both versions | |
| You decide | | |

**User's choice:** Replace with warning

| Option | Description | Selected |
|--------|-------------|----------|
| Continuous scroll | Scroll through full screenplay | ✓ |
| Page by page | Prev/next navigation | |
| You decide | | |

**User's choice:** Continuous scroll

| Option | Description | Selected |
|--------|-------------|----------|
| Scene-level detail | Every scene listed, editable | |
| Aggregated only | Just totals | |
| Both | Summary at top, expandable detail below | ✓ |

**User's choice:** Both

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, add/remove | Add missing items, remove false positives | ✓ |
| Edit only | Edit names but can't add new | |
| You decide | | |

**User's choice:** Yes, add/remove

---

## Claude's Discretion

- Loading skeleton design and transitions
- Exact sidebar width, spacing, typography
- Error state handling for Firestore connectivity
- Debounce timing for auto-save
- PDF viewer library choice
- Form field ordering within screens
- Empty state illustrations and copy

## Deferred Ideas

None — discussion stayed within phase scope.
