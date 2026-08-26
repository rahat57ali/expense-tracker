# Ledgr — Claude Code Instructions

## Project Overview
Ledgr is a React Native (Expo) personal expense tracking app for Android. 
PKR currency. Local-first — no backend, no auth, no cloud sync.

## Stack
- React Native with Expo
- TypeScript
- AsyncStorage for all persistence
- expo-av for audio recording and playback
- expo-sharing, expo-file-system, expo-document-picker for data management
- SheetJS (xlsx) for import/export
- lucide-react-native for icons
- date-fns for date handling
- Outfit and Inter font families

## Design System — Never Violate
- Background: `#0A0A0A`
- Card background: `#141414`
- Elevated surface: `#1A1A1A`
- Primary accent: `#00F0FF` (cyan)
- Secondary accent: `#8A2BE2` (purple)
- Danger: `#EF4444`
- Success: `#10B981`
- Primary text: `#FFFFFF`
- Secondary text: `#A0A0A0`
- Muted text: `#606060`
- Fonts: Outfit_800ExtraBold, Outfit_600SemiBold, Inter_700Bold, Inter_500Medium
- Do not introduce any new colors, fonts, or styling patterns under any circumstance

## Project Structure
- `src/screens/` — main tab screens
- `src/components/` — reusable components and modals
- `src/lib/` — context providers and utility functions
- `assets/` — images and fonts

## Key Files
- `src/lib/LedgrContext.tsx` — primary state management
- `src/lib/store.ts` — data models and interfaces
- `src/lib/VoiceMemoContext.tsx` — voice memo state
- `src/components/grocery/` — grocery list components
- `src/screens/SettingsScreen.tsx` — budget config and data management
- `App.tsx` — root component and navigation

## AsyncStorage Keys
- `ledgr_expenses` — all expenses
- `ledgr_budget` — budget and budgetMonth
- `ledgr_rollover_recovery` — month-end wizard recovery state
- `ledgr_grocery_lists` — grocery lists and items
- `ledgr_voice_memos` — voice memo metadata

## Coding Rules
- Do not refactor or restructure working code unless explicitly asked
- Do not install new dependencies without asking first
- Do not modify files unrelated to the current task
- When fixing a bug, change only what is necessary
- Always match the existing code style and patterns in the file being edited
- Do not rewrite surrounding logic when making targeted fixes
- If a task is ambiguous, ask before implementing
- Never hardcode dates, amounts, or month lengths — always use device clock
- All date calculations must use date-fns

## Architecture Rules
- All data is local — no API calls, no external services
- All expenses are filtered by `budget.budgetMonth` on Overview and Track screens
- Stats screen uses unfiltered historical data across all months
- A single shared utility function handles days-left calculation — never duplicate it
- Bill renewal must advance to the same calendar day next month — never +30 days

## DEV TOOLS
A hidden developer section exists in SettingsScreen wrapped in:
`const SHOW_DEV_TOOLS = true; // TODO: Remove before release`
Activated by tapping the Settings tab icon 10 times consecutively.
Do not remove this code unless explicitly asked.