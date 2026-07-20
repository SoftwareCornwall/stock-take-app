# Developer Handoff Pack
## Stock Take Mobile Web App

## 1. Product Overview

A mobile-first web application designed to allow staff to conduct an annual stock take of equipment across departments, with minimal typing and fast interaction in constrained environments.

## 2. Users

- Internal staff (approx. 4 users)
- Tech literate
- Use personal mobile devices
- Shared login

## 3. Core Workflow

1. Login
2. Select super department
3. Select or create sub department
4. View scrollable list of items (all start at 0)
5. Tap item to update count
6. Use + / - to adjust count
7. Select condition
8. Add serial number if required
9. Confirm update
10. Complete stock take via confirmation button
11. Export CSV

## 4. Data Model

### Departments
- Super departments
  - Tech Cornwall
  - Agile on the Beach

### Sub Departments
- User creatable
- Belong to one super department

### Catalogue Items
- Name
- Category
- Serial tracked (true/false)

### Session Items
- Item name
- Sub department
- Quantity (starts at 0)
- Condition
- Serial number (optional)

## 5. Business Rules

- Each stock take starts with all counts at 0
- Counts represent items found during stock take
- No duplicate item entries per session
- Existing item must be updated instead
- Completed sessions cannot be edited
- Archive instead of delete
- Operations signs off

## 6. Counting Behaviour

- Plus and minus buttons adjust count
- Count cannot go below 0
- Confirm button saves changes
- No keyboard required for known items

## 7. Serial Number Rules

- Optional when creating item
- Only shown if item is serial tracked

## 8. CSV Export

### One file per super department

### Non serial items
- Sub Department
- Item Name
- Quantity
- Condition

### Serial tracked items
- Sub Department
- Item Name
- Serial Number
- Quantity
- Condition

## 9. UX Principles

- Mobile first
- Minimal typing
- Scroll and tap interaction
- Large tap targets
- Fast response

## 10. Technical Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase (Free tier)
- Vercel (Hobby)

## 11. Concurrency

- Multiple users allowed
- Last write wins
- No locking required

## 12. Session Rules

- Sessions auto named by date
- Can save and resume
- Completion locks session

## 13. Acceptance Criteria

- User can start session in under 30 seconds
- Known item added with no typing
- CSV export usable without cleanup
- App usable on mobile in tight spaces

## 14. Annual Process

1. Wake backend
2. Test app
3. Run stock take
4. Export CSV
5. Leave dormant

## 15. MVP Scope

Included:
- Login
- Departments
- Catalogue
- Counting
- CSV export

Excluded:
- Barcode scanning
- Offline mode
- Depreciation
- Role permissions

## 16. Risks

- Catalogue quality
- Data overwrite
- Minimal audit trail

## 17. Final Notes

- Prioritise simplicity over features
- Optimise for speed of use
- Validate with real users in environment
