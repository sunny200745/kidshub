# KidsHub - Daycare Management Platform

A modern daycare management platform with separate applications for daycare owners/staff and parents.

## Applications

### KidsHub Owner (`/kidshub-owner`)
Management dashboard for daycare owners and staff to:
- Manage children, classrooms, and staff
- Track daily activities and attendance
- Communicate with parents
- View schedules and reports

**Run locally:**
```bash
cd kidshub-owner
npm install
npm run dev
# Opens at http://localhost:5173
```

### KidsHub Parent (`/kidshub`)
Mobile-friendly app for parents to:
- View their child's daily activities
- See photos and milestones
- Message teachers directly
- Check daily schedules

**Run locally:**
```bash
cd kidshub
npm install
npm run dev
# Opens at http://localhost:5174
```

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS
- **Backend:** Firebase (Auth, Firestore, Storage)
- **Icons:** Lucide React
- **Routing:** React Router DOM

## Deployment

Both apps are deployed on Vercel:
- Owner App: `kidshub-owner.vercel.app`
- Parent App: `kidshub.vercel.app`

## Firebase Setup

Both apps share the same Firebase project. The configuration is already set up in:
- `kidshub-owner/src/firebase/config.js`
- `kidshub/src/firebase/config.js`

## License

MIT
