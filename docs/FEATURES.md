# Features Documentation

Complete feature documentation for the Child Reward System - a comprehensive behavior tracking and reward management platform for families.

## Core Features Overview

The system implements a **dual-track point system** where children earn points through daily activities that convert simultaneously to:
1. **Weekly Screen Time** (resets Monday)
2. **Target Fund Savings** (cumulative year-to-date)

---

## 1. Multi-Family Multi-Tenancy

**Complete data isolation using PostgreSQL Row Level Security (RLS)**

- Each family operates independently with separate:
  - Configuration settings (conversion rates, goals)
  - Children roster
  - Custom categories, bonuses, deductions
  - Historical tracking data

- **Role-based access:**
  - **Parent:** Full CRUD access to all family data
  - **Child:** Read-only access to own data (if enabled)

- **Implementation:** `families` and `profiles` tables with RLS policies using helper functions: `get_user_family_id()`, `is_parent()`, `child_in_family()`

---

## 2. Dashboard (Real-time Analytics)

**Location:** [app/page.tsx](../app/page.tsx), [app/api/v2/dashboard/route.ts](../app/api/v2/dashboard/route.ts)

### Features:
- **Current week progress:**
  - Total points earned
  - Screen time earned vs maximum cap
  - Progress bars and percentages
  - Days tracked counter
  - Average daily points

- **Target fund progress:**
  - Year-to-date cumulative savings
  - Goal amount with progress percentage
  - Visual progress indicator
  - Dollar amount display

- **30-day behavior trends:**
  - Line chart showing daily point fluctuations
  - Category breakdown tooltips
  - Interactive data points

- **Recent weeks summary:**
  - Last 4 weeks performance cards
  - Week-by-week comparison
  - Screen time and fund contributions

- **Child selector dropdown:**
  - Quick switch between children
  - Avatar display with initials
  - Persistent selection (localStorage)

### Charts:
- Line Chart: 30-day behavior trends (Recharts)
- Bar Chart: Weekly progress breakdown
- Progress Bars: Screen time and fund progress
- Stat Cards: Key metrics with icons

---

## 3. Daily Tracking System

**Location:** [app/tracking/page.tsx](../app/tracking/page.tsx), [app/api/v2/tracking/route.ts](../app/api/v2/tracking/route.ts)

### Features:
- **Date navigation:**
  - Navigate to any past date or today
  - Chevron left/right for day-by-day browsing
  - Cannot track future dates

- **Dynamic category tracking:**
  - Loads categories from family configuration
  - Each category: current value with +/- buttons
  - Real-time point validation (0 to max_points)
  - Emoji icons for visual identification

- **Default 5 categories** (fully customizable):
  - 🥗 Health & Nutrition (max 3 pts)
  - 📱 Screen Discipline (max 2 pts)
  - 📚 Self-Study & Learning (max 2 pts)
  - 🏠 Household Contribution (max 3 pts)
  - ⭐ Behavior & Respect (max 2 pts)

- **Quick-add bonuses:**
  - Preset options with emoji buttons
  - Custom point values (positive)
  - Multiple bonuses per day
  - Examples: "Perfect sugar-free day" (+2), "Extraordinary helpfulness" (+3)

- **Quick-add deductions:**
  - Preset options with emoji buttons
  - Negative point values
  - Examples: "Disrespectful behavior" (-2), "Lied about something" (-5)

- **Daily notes:**
  - Free-text observations
  - Character limit: 500 chars

- **Real-time calculations:**
  - Total = category_points + bonuses + deductions
  - Screen time earned = total × points_to_minutes
  - Fund contribution = total × points_to_dollars

### Data Storage:
**category_points:** JSONB for flexibility
```json
{
  "healthNutrition": 3,
  "screenDiscipline": 2,
  "selfStudy": 2,
  "household": 3,
  "behaviorRespect": 2
}
```

---

## 4. Weekly Review & Management

**Location:** [app/weekly/page.tsx](../app/weekly/page.tsx), [app/api/v2/weekly/route.ts](../app/api/v2/weekly/route.ts)

### Features:
- **Flexible date range selector:**
  - Custom start and end dates
  - Week navigation buttons
  - Defaults to current week

- **Comprehensive statistics:**
  - Total points earned
  - Screen time earned (minutes)
  - Screen time used (manual entry)
  - Target fund contribution (dollars)
  - Days tracked counter

- **Daily breakdown visualization:**
  - Stacked bar chart:
    - Category points (green)
    - Bonuses (blue)
    - Deductions (red)
  - Day-by-day comparison

- **Screen time tracking:**
  - Pie chart: Used vs Remaining
  - Manual input for usage
  - Validation against earned time

- **Weekly reflection:**
  - Notes (1000 chars)
  - Behavior goals for next week (500 chars)

### Calculations:
```
Screen Time Earned = Total Weekly Points × points_to_minutes
Fund Contribution = Total Weekly Points × points_to_dollars
```

---

## 5. Children Management

**Location:** [app/children/page.tsx](../app/children/page.tsx), [app/api/children/route.ts](../app/api/children/route.ts)

### Features:
- **Add new child:**
  - Name (required)
  - Email (optional, for child login)
  - Date of birth (optional)
  - Avatar color picker (10 colors)
  - Dashboard access toggle

- **Edit child profile:**
  - Update all fields
  - Change avatar color
  - Enable/disable dashboard access

- **Soft delete:**
  - Sets `is_active = false`
  - Preserves historical data
  - Child disappears from active lists

- **Dashboard access control:**
  - Toggle `can_view_dashboard`
  - When enabled + email set:
    - Child can log in
    - View own dashboard (read-only)
    - Cannot modify data

- **Avatar customization:**
  - 10 colors: Blue, Red, Green, Yellow, Purple, Pink, Indigo, Orange, Teal, Cyan
  - Initials generation (first 2 letters)

### Child Login Flow:
1. Parent adds child with email
2. Child signs up with that email
3. System detects match → creates child profile
4. Links profile to child record
5. Child can log in (if dashboard enabled)

---

## 6. Configuration & Settings

**Location:** [app/config/page.tsx](../app/config/page.tsx)

### General Settings:
- **Points to Minutes:** Default 0.5 (range: 0.1-10.0)
- **Points to Dollars:** Default $1.00 (range: $0.10-$100)
- **Target fund goal:** Default $500 (range: $1-$10,000)
- **Target description:** Custom goal name (e.g., "Summer Camp Fund")
- **Target date:** Any future date
- **Max weekly screen time:** Default 60 minutes (range: 0-10,080)

### Category Management:
- Add/edit/delete custom categories
- Emoji icon picker
- Max points per day
- Description
- Sort order
- Active/inactive toggle

### Bonus Presets:
**Default 4:**
- Perfect sugar-free day (+2)
- Extraordinary helpfulness (+3)
- Homework ahead of schedule (+2)
- Helped sibling/peer (+2)

### Deduction Presets:
**Default 7:**
- Disrespectful behavior (-2)
- Refused chore (-3)
- Lied about something (-5)
- Physical aggression (-5)
- Sneaking screen time (-5)
- Morning routine not completed (-1)
- Tantrum/meltdown (-3)

---

## 7. Authentication System

**Location:** [app/auth/*](../app/auth/), [contexts/auth-context.tsx](../contexts/auth-context.tsx)

### Features:

#### Email/Password Authentication:
- Sign up with email and password
- Login with credentials
- Password reset via email

#### Google OAuth 2.0:
- One-click Google sign-in
- Automatic profile creation
- PKCE flow for security

#### Session Management:
- Cookie-based sessions (httpOnly, secure)
- Automatic refresh via middleware
- 7-day expiry (Supabase default)
- Multi-device support

#### Role-Based Access Control:
- **Parent role:**
  - Full CRUD on all family data
  - Add/edit/delete children
  - Modify configuration
  - Manage categories/bonuses/deductions

- **Child role:**
  - Read-only own data
  - View own dashboard (if enabled)
  - Cannot modify data
  - Cannot access siblings

### Flows:

**Parent Signup:**
1. Enter email, password, name
2. Supabase creates auth user
3. Trigger creates profile (role='parent')
4. Redirect to family setup
5. Enter family name
6. System initializes defaults
7. Redirect to dashboard

**Child Login:**
1. Parent adds child with email
2. Child signs up with that email
3. System detects match → creates child profile
4. Redirect to read-only dashboard

---

## 8. Progressive Web App (PWA)

**Location:** [public/manifest.json](../public/manifest.json), [public/sw.js](../public/sw.js)

### Features:
- **Home screen installation:**
  - "Add to Home Screen" prompt
  - Standalone app experience
  - App icon on device

- **Offline support:**
  - Service worker with cache strategies
  - Cached static assets
  - Offline fallback page

- **App manifest:**
  - Theme color: #1e293b (slate-800)
  - Background: #f8fafc (slate-50)
  - Display: standalone
  - Orientation: portrait-primary

- **App icons:** 72×72 to 512×512 sizes

---

## Business Logic: Dual-Track Reward System

### Track 1: Weekly Screen Time

**Purpose:** Short-term incentive with weekly reset

**Formula:**
```
Screen Time Earned (minutes) = Total Weekly Points × points_to_minutes
```

**Weekly Reset:**
- Resets every Monday at 00:00
- Week: Monday-Sunday (ISO standard)
- Unused time does NOT carry over

**Maximum Cap:**
```
Screen Time = MIN(Calculated, max_weekly_screen_time)
```

**Example:**
- 50 points × 0.5 = 25 minutes
- 150 points × 0.5 = 75 → capped at 60 minutes

### Track 2: Target Fund (Cumulative)

**Purpose:** Long-term savings goal

**Formula:**
```
Fund Contribution ($) = Total Points × points_to_dollars
```

**Cumulative Tracking:**
- Does NOT reset weekly
- Year-to-date accumulation
- Progress toward goal

**Progress:**
```typescript
const fundSavings = yearTotalPoints × pointsToDollars
const progress = (fundSavings / goal) × 100
```

**Example:**
- 1000 points × $1.00 = $1000
- Goal: $500 → Progress: 200%

### Point Accumulation:
```
Total Daily = Category Points + Bonuses + Deductions
```

**Points Can Go Negative:** Yes (accountability)
- Screen Time: 0 minutes (cannot be negative)
- Fund: Can be negative (debt concept)

---

## UI/UX Features

### Navigation:
- Desktop: Left sidebar
- Mobile: Bottom tab bar + hamburger menu
- Responsive breakpoints: lg (1024px)
- Active page highlighting

### Child Selector:
- Compact mode for mobile
- Expanded mode for desktop
- Avatar with initials/image
- Color-coded backgrounds
- Persistent selection (localStorage)

### Charts:
- Recharts library (v3.6.0)
- Line charts: Behavior trends
- Bar charts: Daily breakdown, weekly progress
- Pie charts: Screen time distribution
- Responsive sizing
- Interactive tooltips

### Loading States:
- Spinner icons (Loader2)
- Progressive loading for charts

### Error Handling:
- Toast notifications
- Inline error messages
- Form validation
- Graceful degradation

---

## Performance Features

- Dynamic imports for heavy components
- Code splitting via Next.js App Router
- Image optimization with Sharp
- Font optimization
- Database indexes on frequent queries
- RLS policy optimization
- JSONB for flexible data
- Connection pooling (Supabase)
- Service worker caching

---

## Security Features

- Row Level Security (RLS) on all tables
- Multi-tenancy isolation via family_id
- Role-based access control
- CSRF protection via cookies
- Input validation at API
- Parameterized queries
- HTTPS enforcement
- Secure session management
- Password hashing

---

## Mobile Experience

- Responsive design (Tailwind CSS)
- Touch-friendly UI
- Bottom navigation for mobile
- PWA installation
- Portrait orientation
- Mobile-first approach

---

## Integration Features

**Current:**
- Supabase Auth
- Supabase Database (PostgreSQL)
- Google OAuth

**Future:**
- Calendar sync
- Email notifications (SendGrid, Resend)
- SMS notifications (Twilio)
- Payment processing (Stripe)
- Export to spreadsheet
- Zapier/Make integration

---

## Feature Comparison

| Feature | Parent View | Child View |
|---------|-------------|------------|
| Dashboard | ✅ Full access | ✅ Read-only (own) |
| Daily Tracking | ✅ Full CRUD | ❌ No access |
| Weekly Review | ✅ Full access | ✅ Read-only (own) |
| Children Mgmt | ✅ Full CRUD | ❌ No access |
| Configuration | ✅ Full CRUD | ❌ No access |
| Reports | ✅ Generate | ✅ View own |

---

**Feature Set Version:** 1.0  
**Last Updated:** January 5, 2026  
**Related:** [API](./API.md) | [Database](./DATABASE.md) | [Architecture](./ARCHITECTURE.md)
