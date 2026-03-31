# EVM Balance Monitor

## Current State
- Full-stack DApp with Motoko backend and React frontend
- `InternetIdentityProvider` is already set up in `main.tsx`
- `useInternetIdentity` hook exists but is not used to gate access
- App is fully visible to any visitor without authentication
- Backend has no caller-based access control; anyone can read/write data

## Requested Changes (Diff)

### Add
- Login gate screen: when `identity` is null/anonymous, show a centered login page with app logo, title, description, and "Login with Internet Identity" button
- Logout button in the header (top-right area, next to Refresh button)
- Loading state while Internet Identity initializes (`isInitializing === true`)

### Modify
- `App.tsx`: wrap the dashboard with an auth check using `useInternetIdentity`; render login screen if not authenticated, dashboard if authenticated
- `useActor.ts`: keep as-is (already reads `identity`)

### Remove
- Nothing removed

## Implementation Plan
1. In `App.tsx`, import `useInternetIdentity`
2. If `isInitializing`, render a full-screen spinner
3. If `identity` is falsy or principal is anonymous, render a `LoginScreen` component
4. If authenticated, render the existing dashboard + add logout button in header
5. Create `LoginScreen` as an inline or separate component: dark-themed, centered card with app icon, title, tagline, and a primary "Login with Internet Identity" button
6. Add logout button in header that calls `clear()` from `useInternetIdentity`
