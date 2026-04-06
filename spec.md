# EVM Balance Monitor

## Current State
The app is at Version 9 (rollback to Version 5 with address copy feature). It includes:
- Per-user data isolation via Internet Identity Principal (Version 5 feature)
- Password gate ("dyfqpl") before Internet Identity login (Version 5 feature)
- Retry logic and per-address retry buttons (Version 4 feature)
- Address copy feature
- Dark-themed professional UI

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- **LoginScreen.tsx**: Remove the password gate entirely. The login page should directly show the Internet Identity login button without any password input step.
- **Backend (main.mo)**: Confirm it has NO per-Principal data isolation (all users share the same data store) - matches Version 4 behavior. Current code appears correct.

### Remove
- Password gate from LoginScreen (the two-step verify-then-login flow)
- Per-user data isolation from backend (already removed in current version)

## Implementation Plan
1. Rewrite LoginScreen.tsx to show a simple login card with just the Internet Identity login button, no password input
2. Backend main.mo already matches Version 4 (no per-Principal isolation) - no changes needed
3. Validate and deploy
