# Features Documentation

Complete feature documentation for the Child Reward System - a comprehensive behavior tracking and reward management platform for families.

---

## Table of Contents

1. [Core System Overview](#core-system-overview)
2. [Authentication & User Management](#1-authentication--user-management)
3. [Multi-Family Multi-Tenancy](#2-multi-family-multi-tenancy)
4. [Dashboard & Analytics](#3-dashboard--analytics)
5. [Daily Tracking System](#4-daily-tracking-system)
6. [Weekly Review & Management](#5-weekly-review--management)
7. [Children Management](#6-children-management)
8. [Configuration & Settings](#7-configuration--settings)
9. [Progressive Web App (PWA)](#8-progressive-web-app-pwa)
10. [UI/UX Features](#uiux-features)
11. [Performance & Security](#performance--security)

---

## Core System Overview

The system implements a **dual-track point system** where children earn points through daily activities that convert simultaneously to:

1. **Weekly Screen Time Track** (resets every Monday)
   - Short-term incentive
   - Capped at maximum weekly limit
   - Non-cumulative, resets weekly

2. **Target Fund Savings Track** (cumulative year-to-date)
   - Long-term savings goal
   - Accumulates continuously
   - Tracks progress toward custom target
   - Customizable target name and date

### Point System Formula:
```
Daily Total = Category Points + Bonuses + Deductions

Screen Time (minutes) = Weekly Points × points_to_minutes (capped at max)
Fund Contribution ($) = All-Time Points × points_to_dollars
```

**Key Feature:** Points can go negative (accountability system)

---

## 1. Authentication & User Management

**Location:** [app/auth/*](../app/auth/), [contexts/auth-context.tsx](../contexts/auth-context.tsx)

### 1.1 Sign Up & Sign In

**Multiple Authentication Methods:**
- **Email/Password:** Traditional authentication with password reset
- **Google OAuth 2.0:** One-click sign-in with Google account

**Implementation:**
- Supabase Auth for authentication backend
- PKCE flow for OAuth security
- HTTP-only secure cookies for session management
- 7-day session expiry (configurable)

### 1.2 User Roles

**Two distinct roles with different permissions:**

| Role | Description | Access Level |
|------|-------------|--------------|
| **Parent** | Family administrator | Full CRUD on all family data |
| **Child** | Family member | Read-only access to own data |

### 1.3 Parent Signup Flow

```
1. User signs up with email/password or Google
2. System creates auth.users record
3. Trigger automatically creates profile record (role='parent')
4. Redirect to family setup page
5. User enters family name
6. System initializes:
   - Family record
   - Default configuration
   - 5 default categories
   - 4 bonus presets
   - 7 deduction presets
7. Redirect to dashboard
```

### 1.4 Child Login Flow

**Unique feature:** Children can have optional dashboard access

```
1. Parent adds child with email in Children Management
2. Child signs up using that email
3. System detects email match
4. Creates profile with role='child'
5. Links profile to child record
6. Inherits family_id
7. Child can log in to view read-only dashboard
```

**Dashboard Access Control:**
- Parents can enable/disable dashboard access per child
- Children only see their own data
- No modification permissions

### 1.5 Session Management

**Features:**
- Cookie-based sessions (httpOnly, secure, sameSite)
- Automatic token refresh via middleware
- Multi-device support
- Graceful session expiry handling
- Automatic redirect to login on session loss

**Middleware Protection:**
- All routes except `/auth/*` require authentication
- Automatic session refresh on each request
- Redirect with return URL for seamless navigation

### 1.6 Family Setup

**Location:** [app/auth/setup/page.tsx](../app/auth/setup/page.tsx)

**One-time family initialization:**
- Only shown to new parents without family
- Creates family record
- Links profile to family
- Initializes default configuration
- Pre-populates suggested family name

**Features:**
- Auto-detects if family already exists (redirects to dashboard)
- Pre-fills family name suggestion based on user's name
- Single-step setup process
- Success confirmation before redirect

### 1.7 Authentication Error Handling

**Location:** [app/auth/error/page.tsx](../app/auth/error/page.tsx)

- User-friendly error page
- Clear error messaging
- Quick links back to login/signup
- Graceful OAuth failure handling

---

## 2. Multi-Family Multi-Tenancy

---

---

## 2. Multi-Family Multi-Tenancy

**Complete data isolation using PostgreSQL Row Level Security (RLS)**

### 2.1 Core Concept

Each family operates in complete isolation with their own:
- Configuration settings (conversion rates, goals, target date)
- Children roster
- Custom categories
- Custom bonus/deduction presets
- Complete tracking history
- Weekly summaries

### 2.2 Role-Based Access Control

**Parent Access:**
- Full CRUD operations on all family data
- Add/edit/delete children
- Modify configuration
- Manage categories, bonuses, deductions
- View all children's data
- Access all historical data

**Child Access (optional):**
- Read-only access to own data only
- View own dashboard (if enabled by parent)
- Cannot modify any data
- Cannot view siblings' data
- Cannot access configuration

### 2.3 Implementation

**Database Level:**
- `families` table stores family metadata
- `family_id` foreign key on all related tables
- RLS policies on every table

**Helper Functions:**
- `get_user_family_id()` - Returns authenticated user's family ID
- `is_parent()` - Checks if user has parent role
- `child_in_family()` - Validates child belongs to user's family

**Security:**
- All queries automatically filtered by family_id
- Attempting to access other family's data returns 404
- No cross-family data leakage possible
- Enforced at database level (cannot be bypassed)

---

## 3. Dashboard & Analytics

**Location:** [app/page.tsx](../app/page.tsx), [app/api/v2/dashboard/route.ts](../app/api/v2/dashboard/route.ts)

The dashboard provides real-time analytics and comprehensive behavior tracking visualization.

### 3.1 Current Week Progress

**Statistics Displayed:**
- Total points earned this week (Monday-Sunday)
- Days tracked counter (out of 7)
- Average daily points
- Screen time earned (in minutes)
- Screen time cap/maximum
- Progress bar showing screen time utilization
- Percentage progress display

**Screen Time Calculation:**
```
Earned Minutes = Total Weekly Points × points_to_minutes
Capped Minutes = MIN(Earned Minutes, max_weekly_screen_time)
```

### 3.2 Target Fund Progress

**Year-to-Date Tracking:**
- Total fund accumulated (in dollars)
- Custom goal amount
- Progress percentage
- Visual progress bar
- Days until target date
- Custom target description (e.g., "Summer Camp Fund")

**Fund Calculation:**
```
Fund Amount = Total All-Time Points × points_to_dollars
Progress = (Fund Amount / Goal Amount) × 100%
```

### 3.3 Behavior Trends (30-Day Chart)

**Interactive Line Chart:**
- Shows last 30 days of activity
- Daily point totals plotted
- Smooth line visualization
- Interactive tooltips on hover
- Category breakdown in tooltips
- Responsive design (adjusts to screen size)

**Powered by:** Recharts library (v3.6.0)

### 3.4 Recent Weeks Summary

**Last 4-8 Weeks Display:**
- Week-by-week performance cards
- Week number and date range
- Total points for each week
- Screen time earned
- Fund contribution
- Quick comparison across weeks
- Scrollable card layout

### 3.5 Child Selector

**Multi-Child Support:**
- Dropdown selector in header
- Displays child name with avatar
- Color-coded avatar backgrounds
- Initials display
- Persistent selection (localStorage)
- Quick switch between children
- Real-time dashboard update on selection change

**Responsive Behavior:**
- Compact mode on mobile
- Expanded mode on desktop
- Touch-friendly on mobile devices

### 3.6 Charts & Visualizations

**Chart Types Used:**
1. **Line Chart:** 30-day behavior trends
2. **Area Chart:** Weekly progress visualization
3. **Bar Chart:** Historical weekly comparison
4. **Progress Bars:** Screen time and fund progress
5. **Stat Cards:** Key metrics with icons

**Chart Features:**
- Interactive tooltips
- Responsive sizing
- Smooth animations
- Loading states
- Empty state handling
- Dynamic data updates

### 3.7 Welcome Page (Unauthenticated)

**For visitors not logged in:**
- Feature highlights
- System benefits
- Call-to-action buttons:
  - Sign Up
  - Sign In
  - View Demo (future)
- Attractive hero section
- Feature showcase with icons

---

## 4. Daily Tracking System

**Location:** [app/tracking/page.tsx](../app/tracking/page.tsx), [app/api/v2/tracking/route.ts](../app/api/v2/tracking/route.ts)

The core feature for recording daily behavior and earning points.

### 4.1 Date Navigation

**Flexible Date Selection:**
- Calendar-style date picker
- Navigate to any past date
- Quick "Today" button
- Chevron left/right for day-by-day browsing
- **Cannot track future dates** (validation enforced)
- Displays selected date prominently

### 4.2 Dynamic Category Tracking

**Category System:**
- Loads categories from family configuration
- Each category displays:
  - Emoji icon for visual identification
  - Category name
  - Current points value
  - Maximum points limit
  - Plus (+) and minus (-) buttons
  
**Default 5 Categories** (fully customizable):
1. 🥗 **Health & Nutrition** (0-3 points)
2. 📱 **Screen Discipline** (0-2 points)
3. 📚 **Self-Study & Learning** (0-2 points)
4. 🏠 **Household Contribution** (0-3 points)
5. ⭐ **Behavior & Respect** (0-2 points)

**Real-Time Validation:**
- Points must be between 0 and max_points
- Increment/decrement buttons
- Visual feedback on limit reached
- Prevents invalid values

### 4.3 Quick-Add Bonuses

**Preset Bonus System:**
- Loads bonus presets from configuration
- Quick-click emoji buttons
- Automatically adds positive points
- Multiple bonuses can be added per day
- Each bonus displays:
  - Emoji icon
  - Description
  - Point value
  - Remove button (×)

**Default 4 Bonus Presets:**
- ⭐ Perfect sugar-free day (+2)
- 🌟 Extraordinary helpfulness (+3)
- 📚 Homework ahead of schedule (+2)
- 🤝 Helped sibling/peer (+2)

**Custom Bonus:**
- Text input field
- Custom point value
- Manual add button

### 4.4 Quick-Add Deductions

**Preset Deduction System:**
- Loads deduction presets from configuration
- Quick-click emoji buttons
- Automatically subtracts points (negative values)
- Multiple deductions per day
- Each deduction displays:
  - Emoji icon
  - Description
  - Negative point value
  - Remove button (×)

**Default 7 Deduction Presets:**
- 😤 Disrespectful behavior (-2)
- ❌ Refused chore (-3)
- 🤥 Lied about something (-5)
- 🤜 Physical aggression (-5)
- 📱 Sneaking screen time (-5)
- 😴 Morning routine not completed (-1)
- 😡 Tantrum/meltdown (-3)

**Custom Deduction:**
- Text input field
- Custom negative point value
- Manual add button

### 4.5 Notes & Observations

**Daily Notes Field:**
- Free-text area for observations
- Character limit: 500 characters
- Optional field
- Saved with tracking data
- Useful for behavior context

### 4.6 Real-Time Calculations

**Live Point Totals:**
- Category points sum
- Bonuses sum (always positive)
- Deductions sum (always negative)
- **Grand Total** = Categories + Bonuses + Deductions

**Dual-Track Display:**
- Screen time earned today (minutes)
- Fund contribution today (dollars)
- Formulas applied in real-time

**Visual Feedback:**
- Color-coded totals (green/red)
- Progress indicators
- Immediate updates on any change

### 4.7 Data Persistence

**Save Mechanism:**
- Explicit "Save" button
- UPSERT operation (create or update)
- Success/error toast notifications
- Optimistic UI updates
- Auto-save not implemented (intentional - requires parent review)

**Data Storage:**
```typescript
{
  child_id: UUID,
  date: DATE,
  category_points: JSONB, // { "healthNutrition": 3, ... }
  bonuses: ARRAY,         // [{ description, points }, ...]
  deductions: ARRAY,      // [{ description, points }, ...]
  notes: TEXT,
  total_points_earned: INTEGER  // Calculated by trigger
}
```

### 4.8 Empty State Handling

**When No Data Exists:**
- Shows empty form with all categories at 0
- No bonuses/deductions
- Empty notes field
- Clear call-to-action to start tracking

---

## 5. Weekly Review & Management

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
