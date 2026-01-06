# Child Reward System - Dual Track Earning

A comprehensive reward tracking system with two independent tracks:
1. **Weekly Screen Time Track** - Resets every Monday
2. **Christmas Fund Track** - Cumulative savings until Christmas 2025

## Features

✨ **Dual-Track System**
- Screen Time Points: Earn points Monday-Friday, redeem on weekends
- Christmas Fund Points: Accumulate money towards a Christmas goal
- Both tracks can go negative (consequences system)

📊 **Beautiful Dashboard**
- Real-time tracking of both reward tracks
- Interactive charts and visualizations
- Weekly and monthly summaries
- Behavior trend analysis

📱 **Daily Tracking**
- 5 category tracking: Health, Screen Discipline, Self-Study, Household, Behavior
- Quick-add bonuses and deductions
- Real-time point calculation

📅 **Weekly Reviews**
- Comprehensive week summaries
- Screen time usage tracking
- Goal setting for next week

⚙️ **Configurable**
- Adjustable point conversion rates (points to minutes, points to dollars)
- Customizable Christmas goal
- Flexible screen time limits

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **UI**: shadcn/ui components with Tailwind CSS v4
- **Charts**: Recharts for data visualization
- **Theme**: Sky blue / Sea theme with smooth gradients

## Getting Started

### Installation

1. Install dependencies:
```bash
npm install
```

2. Initialize the database:
```bash
npm run db:push
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

### Initial Setup

1. Navigate to **Settings** page
2. Configure conversion rates:
   - **Points to Minutes**: How many minutes per point (default 0.5)
   - **Points to Dollars**: Dollar value per point (default $1)
   - **Christmas Goal**: Set target amount (default $500)
   - **Max Weekly Screen Time**: Maximum minutes (default 60)

## Usage Guide

### Daily Workflow

1. **Daily Tracking** (every evening)
   - Select date
   - Mark points in each category
   - Add bonuses/deductions using quick buttons
   - Add notes
   - Save

2. **Dashboard** (anytime)
   - View current week progress
   - Check Christmas fund
   - Review behavior trends

3. **Weekly Review** (Sunday evening)
   - Review week performance
   - Enter screen time used
   - Write reflection notes
   - Set behavior goal for next week

## Database Commands

```bash
# Push schema changes
npm run db:push

# Open Prisma Studio (visual database browser)
npm run db:studio

# Reset database (deletes all data)
rm prisma/dev.db && npm run db:push
```

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   ├── config/           # Settings page
│   ├── tracking/         # Daily tracking
│   ├── weekly/           # Weekly review
│   └── page.tsx          # Dashboard
├── components/
│   ├── ui/               # UI components
│   └── navigation.tsx    # Nav bar
├── lib/
│   ├── prisma.ts         # DB client
│   └── utils.ts          # Utilities
└── prisma/
    └── schema.prisma     # DB schema
```

## Point System

**Base Categories (0-12 points/day):**
- 🥗 Health & Nutrition (0-3)
- 📱 Screen Discipline (0-2)
- 📚 Self-Study (0-2)
- 🏠 Household (0-3)
- ⭐ Behavior (0-2)

**Bonuses:** Perfect day (+2), Extra help (+3), etc.
**Deductions:** Disrespect (-2), Refused chore (-3), etc.

## Troubleshooting

**Prisma Client not generated:**
```bash
npx prisma generate
```

**Build errors:**
```bash
rm -rf .next
npm run dev
```

## Support

Check browser console for errors. Verify `prisma/dev.db` exists.

## Documentation

Comprehensive documentation for developers and AI agents:

- **[Architecture](docs/ARCHITECTURE.md)** - System architecture, component diagrams, data flow, authentication flow, deployment architecture with Mermaid diagrams
- **[Features](docs/FEATURES.md)** - Complete feature inventory with all 8 major features, dual-track system, business logic, and UI/UX details
- **[Database](docs/DATABASE.md)** - Database schema with ER diagrams, all 10 tables, RLS policies, functions, triggers, and migrations
- **[API](docs/API.md)** - Complete API reference for all V2 endpoints with request/response examples, TypeScript types, and cURL commands
- **[Deployment](docs/DEPLOYMENT.md)** - Production deployment guide for Supabase and Vercel, including setup, configuration, monitoring, and troubleshooting
- **[Future Roadmap](docs/FUTURE_ROADMAP.md)** - Planned features Q1-Q4 2026, including short-term goals, mobile app, adult tracking, and more

## Future Features

### Coming Soon (Q1 2026)
- 🎯 **Short-term goals** - Set multiple goals with custom deadlines
- ✅ **Weekly finalization** - Mark weeks as complete and track allowance payout
- 📄 **Data export** - Export tracking data to CSV/PDF/Excel
- 📧 **Email notifications** - Automated weekly summaries and goal completion alerts

### On the Roadmap (Q2-Q4 2026)
- 👨‍💼 **Adult habit tracking** - Generalize system for adult habit tracking with custom reward types
- 🏆 **Achievement system** - Gamification with badges, streaks, and milestones
- 📱 **Mobile app** - React Native apps for iOS and Android
- 🤖 **AI insights** - Machine learning powered behavior predictions and recommendations
- 👨‍👩‍👧‍👦 **Family collaboration** - Multi-parent access and real-time sync
- 🌐 **Multi-language** - Support for Spanish, French, German, and Mandarin

See [FUTURE_ROADMAP.md](docs/FUTURE_ROADMAP.md) for complete details.

---

**Built for effective, transparent behavior management with real-world consequences.**
