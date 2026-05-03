# AutoHub Frontend

This project now runs as a frontend-only React + Vite app.

## What changed

- Backend API usage was replaced with a local `localStorage` data layer in `services/api.js`
- Auth, listings, inspections, and admin data now persist in the browser
- Server code, MongoDB setup, and environment files were removed

## Run locally

```bash
npm run dev
```

## Demo accounts

- Admin: `admin@autohub.com` / `123456`
- User: `user@example.com` / `123456`

## Notes

- App data is stored in the browser under `localStorage`
- Clearing browser storage resets the app back to demo seed data
