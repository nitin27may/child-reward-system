# Child Reward System API Documentation

**Version:** 2.0  
**Base URL:** `https://your-domain.com/api`  
**Last Updated:** January 5, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Rate Limiting & CORS](#rate-limiting--cors)
5. [API Endpoints](#api-endpoints)
   - [V2 API (Current)](#v2-api-current)
   - [V1 API (Legacy)](#v1-api-legacy)
6. [TypeScript Types](#typescript-types)
7. [Testing Examples](#testing-examples)
8. [Migration Guide](#migration-guide)

---

## Overview

The Child Reward System API provides a RESTful interface for managing family reward tracking, including daily activities, bonuses, deductions, and weekly summaries. The API uses JSON for request and response bodies.

### API Versions

- **V2 API** (`/api/v2/*`): Current version with improved data structures and aggregation capabilities
- **V1 API** (`/api/*`): Legacy endpoints for backward compatibility

---

## Authentication

All API endpoints require authentication using Supabase Auth. Authentication is handled via HTTP-only cookies set by the authentication system.

### Authentication Flow

```typescript
// Client-side authentication check
const { data: { user }, error } = await supabase.auth.getUser()

if (!user) {
  // Redirect to login
  router.push('/auth/login')
}
```

### Authorization

- All endpoints verify the authenticated user's `family_id` from the `profiles` table
- Resources (children, categories, tracking data) are scoped to the user's family
- Attempting to access another family's resources returns `404 Not Found`

### HTTP Headers

All requests should include:
```
Content-Type: application/json
Cookie: sb-<project-ref>-auth-token=<token>
```

---

## Error Handling

### Error Response Format

```json
{
  "error": "Human-readable error message"
}
```

### HTTP Status Codes

| Code | Meaning | Common Scenarios |
|------|---------|------------------|
| `200` | OK | Successful GET, PUT requests |
| `201` | Created | Successful POST requests |
| `400` | Bad Request | Missing required parameters, invalid input |
| `401` | Unauthorized | Authentication required, invalid token |
| `404` | Not Found | Resource doesn't exist or doesn't belong to user's family |
| `500` | Internal Server Error | Database errors, unexpected failures |

### Example Error Responses

```json
// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 400 Bad Request
{
  "error": "Child ID required"
}

// 404 Not Found
{
  "error": "Child not found"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch dashboard"
}
```

---

## Rate Limiting & CORS

### CORS Configuration

The API middleware (Next.js) handles CORS automatically. All endpoints support:
- Credentials: included
- Methods: GET, POST, PUT, DELETE
- Headers: Content-Type, Authorization

### Rate Limiting

Currently, no explicit rate limiting is implemented. Standard Next.js/Vercel infrastructure limits apply:
- Serverless function timeout: 10 seconds (Vercel Hobby), 60 seconds (Pro)
- Concurrent executions: Platform-dependent

---

## API Endpoints

## V2 API (Current)

### Dashboard

#### GET `/api/v2/dashboard`

Retrieves comprehensive dashboard data including current week stats, year-to-date Christmas fund, monthly totals, behavior trends, and recent weeks.

**Query Parameters:**
- `childId` (required): UUID of the child

**Response:**
```json
{
  "child": {
    "id": "uuid",
    "name": "John Doe"
  },
  "currentWeek": {
    "weekStart": "2026-01-05",
    "weekEnd": "2026-01-11",
    "totalPoints": 45,
    "screenTime": 225,
    "maxScreenTime": 420,
    "allowance": 22.5,
    "daysTracked": 5,
    "averageDaily": 9
  },
  "christmasFund": {
    "current": 125.5,
    "goal": 500,
    "progress": 25.1
  },
  "thisMonth": {
    "totalPoints": 180,
    "screenTime": 900,
    "allowance": 90
  },
  "behaviorTrends": [
    {
      "date": "2026-01-01",
      "points": 10,
      "categories": {
        "health_nutrition": 3,
        "screen_discipline": 2,
        "self_study": 2,
        "household": 3
      }
    }
  ],
  "recentWeeks": [
    {
      "weekStart": "2025-12-29",
      "weekEnd": "2026-01-04",
      "totalPoints": 60,
      "screenTime": 300,
      "allowance": 30,
      "isPaid": false
    }
  ]
}
```

**cURL Example:**
```bash
curl -X GET 'https://your-domain.com/api/v2/dashboard?childId=uuid' \
  -H 'Cookie: sb-project-auth-token=your-token'
```

---

### Tracking

#### GET `/api/v2/tracking`

Retrieves daily tracking data with flexible query options.

**Query Parameters:**
- `childId` (required): UUID of the child
- `date` (optional): Single date in YYYY-MM-DD format
- `startDate` + `endDate` (optional): Date range query
- `recent` (optional): If set, returns last 7 days

**Response (single date):**
```json
{
  "id": "uuid",
  "child_id": "uuid",
  "date": "2026-01-05",
  "day_of_week": 1,
  "category_points": {
    "health_nutrition": 3,
    "screen_discipline": 2,
    "self_study": 2,
    "household": 3,
    "behavior_respect": 2
  },
  "daily_bonuses": 2,
  "daily_deductions": 0,
  "total_points": 14,
  "screen_time_used": 60,
  "notes": "Great day!",
  "bonus_events": [
    {
      "id": "uuid",
      "daily_tracking_id": "uuid",
      "type": "bonus",
      "category": "Perfect sugar-free day",
      "points": 2,
      "description": null,
      "created_at": "2026-01-05T12:00:00Z"
    }
  ]
}
```

**Response (date range or recent):**
```json
[
  {
    "id": "uuid",
    "child_id": "uuid",
    "date": "2026-01-05",
    "day_of_week": 1,
    "category_points": { "health_nutrition": 3 },
    "daily_bonuses": 0,
    "daily_deductions": 0,
    "total_points": 3,
    "screen_time_used": 0,
    "notes": null,
    "bonus_events": []
  }
]
```

**cURL Examples:**
```bash
# Get single date
curl -X GET 'https://your-domain.com/api/v2/tracking?childId=uuid&date=2026-01-05' \
  -H 'Cookie: sb-project-auth-token=your-token'

# Get date range
curl -X GET 'https://your-domain.com/api/v2/tracking?childId=uuid&startDate=2026-01-01&endDate=2026-01-07' \
  -H 'Cookie: sb-project-auth-token=your-token'

# Get recent (last 7 days)
curl -X GET 'https://your-domain.com/api/v2/tracking?childId=uuid&recent=true' \
  -H 'Cookie: sb-project-auth-token=your-token'
```

---

#### POST `/api/v2/tracking`

Creates or updates daily tracking data (upsert based on child_id + date).

**Request Body:**
```json
{
  "childId": "uuid",
  "date": "2026-01-05",
  "category_points": {
    "health_nutrition": 3,
    "screen_discipline": 2,
    "self_study": 2,
    "household": 3,
    "behavior_respect": 2
  },
  "daily_bonuses": 2,
  "daily_deductions": 0,
  "screen_time_used": 60,
  "notes": "Excellent behavior today",
  "bonus_events": [
    {
      "type": "bonus",
      "category": "Perfect sugar-free day",
      "points": 2,
      "description": "No sweets all day"
    }
  ]
}
```

**Response:**
```json
{
  "id": "uuid",
  "child_id": "uuid",
  "date": "2026-01-05",
  "day_of_week": 1,
  "category_points": {
    "health_nutrition": 3,
    "screen_discipline": 2,
    "self_study": 2,
    "household": 3,
    "behavior_respect": 2
  },
  "daily_bonuses": 2,
  "daily_deductions": 0,
  "total_points": 14,
  "screen_time_used": 60,
  "notes": "Excellent behavior today",
  "bonus_events": [
    {
      "id": "uuid",
      "daily_tracking_id": "uuid",
      "type": "bonus",
      "category": "Perfect sugar-free day",
      "points": 2,
      "description": "No sweets all day",
      "created_at": "2026-01-05T12:00:00Z"
    }
  ]
}
```

**cURL Example:**
```bash
curl -X POST 'https://your-domain.com/api/v2/tracking' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-project-auth-token=your-token' \
  -d '{
    "childId": "uuid",
    "date": "2026-01-05",
    "category_points": {
      "health_nutrition": 3,
      "screen_discipline": 2
    },
    "daily_bonuses": 2,
    "daily_deductions": 0
  }'
```

---

### Configuration

#### GET `/api/v2/config`

Retrieves family configuration settings. Creates default configuration if none exists.

**Response:**
```json
{
  "pointsToMinutes": 5,
  "pointsToDollars": 0.5,
  "christmasGoal": 500,
  "maxWeeklyScreenTime": 420
}
```

**cURL Example:**
```bash
curl -X GET 'https://your-domain.com/api/v2/config' \
  -H 'Cookie: sb-project-auth-token=your-token'
```

---

#### PUT `/api/v2/config`

Updates family configuration settings. All fields are optional.

**Request Body:**
```json
{
  "pointsToMinutes": 5,
  "pointsToDollars": 0.5,
  "christmasGoal": 500,
  "maxWeeklyScreenTime": 420
}
```

**Response:**
```json
{
  "pointsToMinutes": 5,
  "pointsToDollars": 0.5,
  "christmasGoal": 500,
  "maxWeeklyScreenTime": 420
}
```

**cURL Example:**
```bash
curl -X PUT 'https://your-domain.com/api/v2/config' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-project-auth-token=your-token' \
  -d '{
    "pointsToMinutes": 5,
    "christmasGoal": 600
  }'
```

---

### Categories

#### GET `/api/v2/categories`

Retrieves all active categories for the family, ordered by `order_index`.

**Response:**
```json
[
  {
    "id": "uuid",
    "family_id": "uuid",
    "name": "Health & Nutrition",
    "key": "health_nutrition",
    "emoji": "🥗",
    "icon": "🥗",
    "max_points": 3,
    "description": null,
    "sort_order": 0,
    "order_index": 0,
    "is_active": true,
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  }
]
```

**cURL Example:**
```bash
curl -X GET 'https://your-domain.com/api/v2/categories' \
  -H 'Cookie: sb-project-auth-token=your-token'
```

---

#### POST `/api/v2/categories`

Creates a new category for the family.

**Request Body:**
```json
{
  "name": "Reading Time",
  "emoji": "📖",
  "maxPoints": 3,
  "description": "Daily reading activities",
  "sortOrder": 5
}
```

**Response:**
```json
{
  "id": "uuid",
  "family_id": "uuid",
  "name": "Reading Time",
  "emoji": "📖",
  "max_points": 3,
  "description": "Daily reading activities",
  "sort_order": 5,
  "is_active": true,
  "created_at": "2026-01-05T12:00:00Z",
  "updated_at": "2026-01-05T12:00:00Z"
}
```

**cURL Example:**
```bash
curl -X POST 'https://your-domain.com/api/v2/categories' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-project-auth-token=your-token' \
  -d '{
    "name": "Reading Time",
    "emoji": "📖",
    "maxPoints": 3
  }'
```

---

#### PUT `/api/v2/categories`

Updates an existing category. All fields except `id` are optional.

**Request Body:**
```json
{
  "id": "uuid",
  "name": "Health & Fitness",
  "emoji": "💪",
  "maxPoints": 4,
  "description": "Physical activity and nutrition",
  "sortOrder": 0,
  "isActive": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "family_id": "uuid",
  "name": "Health & Fitness",
  "emoji": "💪",
  "max_points": 4,
  "description": "Physical activity and nutrition",
  "sort_order": 0,
  "is_active": true,
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-05T12:00:00Z"
}
```

**cURL Example:**
```bash
curl -X PUT 'https://your-domain.com/api/v2/categories' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-project-auth-token=your-token' \
  -d '{
    "id": "uuid",
    "name": "Health & Fitness",
    "maxPoints": 4
  }'
```

---

#### DELETE `/api/v2/categories`

Deletes a category (hard delete).

**Query Parameters:**
- `id` (required): UUID of the category

**Response:**
```json
{
  "success": true
}
```

**cURL Example:**
```bash
curl -X DELETE 'https://your-domain.com/api/v2/categories?id=uuid' \
  -H 'Cookie: sb-project-auth-token=your-token'
```

---

### Bonuses

#### GET `/api/v2/bonuses`

Retrieves all active bonus presets for the family.

**Response:**
```json
[
  {
    "id": "uuid",
    "label": "Perfect sugar-free day",
    "points": 2,
    "icon": null,
    "description": null,
    "isActive": true
  }
]
```

**cURL Example:**
```bash
curl -X GET 'https://your-domain.com/api/v2/bonuses' \
  -H 'Cookie: sb-project-auth-token=your-token'
```

---

#### POST `/api/v2/bonuses`

Creates a new bonus preset.

**Request Body:**
```json
{
  "name": "Early morning study",
  "points": 3,
  "description": "Studied before school"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Early morning study",
  "points": 3,
  "description": "Studied before school",
  "isActive": true
}
```

**cURL Example:**
```bash
curl -X POST 'https://your-domain.com/api/v2/bonuses' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-project-auth-token=your-token' \
  -d '{
    "name": "Early morning study",
    "points": 3
  }'
```

---

#### PUT `/api/v2/bonuses`

Updates an existing bonus preset.

**Request Body:**
```json
{
  "id": "uuid",
  "name": "Perfect sugar-free day",
  "points": 3,
  "description": "No sugar all day",
  "isActive": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Perfect sugar-free day",
  "points": 3,
  "description": "No sugar all day",
  "isActive": true
}
```

**cURL Example:**
```bash
curl -X PUT 'https://your-domain.com/api/v2/bonuses' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-project-auth-token=your-token' \
  -d '{
    "id": "uuid",
    "points": 3
  }'
```

---

#### DELETE `/api/v2/bonuses`

Deletes a bonus preset (hard delete).

**Query Parameters:**
- `id` (required): UUID of the bonus

**Response:**
```json
{
  "success": true
}
```

**cURL Example:**
```bash
curl -X DELETE 'https://your-domain.com/api/v2/bonuses?id=uuid' \
  -H 'Cookie: sb-project-auth-token=your-token'
```

---

### Deductions

#### GET `/api/v2/deductions`

Retrieves all active deduction presets for the family.

**Response:**
```json
[
  {
    "id": "uuid",
    "label": "Disrespectful behavior",
    "points": -2,
    "icon": null,
    "description": null,
    "isActive": true
  }
]
```

**cURL Example:**
```bash
curl -X GET 'https://your-domain.com/api/v2/deductions' \
  -H 'Cookie: sb-project-auth-token=your-token'
```

---

#### POST `/api/v2/deductions`

Creates a new deduction preset.

**Request Body:**
```json
{
  "name": "Forgot homework",
  "points": -3,
  "description": "Did not complete homework"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Forgot homework",
  "points": -3,
  "description": "Did not complete homework",
  "isActive": true
}
```

**cURL Example:**
```bash
curl -X POST 'https://your-domain.com/api/v2/deductions' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-project-auth-token=your-token' \
  -d '{
    "name": "Forgot homework",
    "points": -3
  }'
```

---

#### PUT `/api/v2/deductions`

Updates an existing deduction preset.

**Request Body:**
```json
{
  "id": "uuid",
  "name": "Disrespectful behavior",
  "points": -3,
  "description": "Being rude or disrespectful",
  "isActive": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Disrespectful behavior",
  "points": -3,
  "description": "Being rude or disrespectful",
  "isActive": true
}
```

**cURL Example:**
```bash
curl -X PUT 'https://your-domain.com/api/v2/deductions' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-project-auth-token=your-token' \
  -d '{
    "id": "uuid",
    "points": -3
  }'
```

---

#### DELETE `/api/v2/deductions`

Deletes a deduction preset (hard delete).

**Query Parameters:**
- `id` (required): UUID of the deduction

**Response:**
```json
{
  "success": true
}
```

**cURL Example:**
```bash
curl -X DELETE 'https://your-domain.com/api/v2/deductions?id=uuid' \
  -H 'Cookie: sb-project-auth-token=your-token'
```

---

### Initialize

#### GET `/api/v2/initialize`

Checks if the family system is initialized with default categories, bonuses, and deductions.

**Response:**
```json
{
  "initialized": true,
  "categories": 5,
  "bonuses": 5,
  "deductions": 7,
  "hasConfig": true
}
```

**cURL Example:**
```bash
curl -X GET 'https://your-domain.com/api/v2/initialize' \
  -H 'Cookie: sb-project-auth-token=your-token'
```

---

#### POST `/api/v2/initialize`

Initializes the family system with default categories, bonuses, deductions, and configuration.

**Default Categories:**
- Health & Nutrition (🥗, max 3 points)
- Screen Discipline (📱, max 2 points)
- Self-Study & Learning (📚, max 2 points)
- Household Contribution (🏠, max 3 points)
- Behavior & Respect (⭐, max 2 points)

**Default Bonuses:**
- Perfect sugar-free day (2 points)
- Extraordinary helpfulness (3 points)
- Homework ahead of schedule (2 points)
- Helped sibling/peer without prompting (2 points)
- Perfect week bonus (10 points)

**Default Deductions:**
- Disrespectful behavior (-2 points)
- Refused to do assigned chore (-3 points)
- Lied about completing something (-5 points)
- Physical aggression (-5 points)
- Sneaking screen time (-5 points)
- Morning routine not completed (-1 point)
- Tantrum/meltdown (-3 points)

**Default Configuration:**
- Points to minutes: 0.5
- Points to dollars: 1.0
- Christmas goal: $500
- Max weekly screen time: 60 minutes

**Response:**
```json
{
  "message": "System initialized successfully",
  "categories": 5,
  "bonuses": 5,
  "deductions": 7
}
```

**Response (if already initialized):**
```json
{
  "message": "System already initialized",
  "alreadyInitialized": true
}
```

**cURL Example:**
```bash
curl -X POST 'https://your-domain.com/api/v2/initialize' \
  -H 'Cookie: sb-project-auth-token=your-token'
```

---

### Weekly Summaries

#### GET `/api/v2/weekly`

Retrieves weekly summaries for a child.

**Query Parameters:**
- `childId` (required): UUID of the child
- `weekStart` (optional): Specific week start date in YYYY-MM-DD format
- `limit` (optional): Number of weeks to return (default: 10)

**Response (single week):**
```json
{
  "id": "uuid",
  "child_id": "uuid",
  "week_start": "2026-01-05",
  "week_end": "2026-01-11",
  "total_points": 60,
  "screen_time_earned": 300,
  "screen_time_used": 120,
  "allowance_earned": 30,
  "is_paid": false,
  "paid_at": null,
  "notes": null,
  "created_at": "2026-01-05T12:00:00Z",
  "updated_at": "2026-01-05T12:00:00Z"
}
```

**Response (multiple weeks):**
```json
[
  {
    "id": "uuid",
    "child_id": "uuid",
    "week_start": "2026-01-05",
    "week_end": "2026-01-11",
    "total_points": 60,
    "screen_time_earned": 300,
    "allowance_earned": 30,
    "is_paid": false
  }
]
```

**cURL Examples:**
```bash
# Get specific week
curl -X GET 'https://your-domain.com/api/v2/weekly?childId=uuid&weekStart=2026-01-05' \
  -H 'Cookie: sb-project-auth-token=your-token'

# Get recent weeks
curl -X GET 'https://your-domain.com/api/v2/weekly?childId=uuid&limit=5' \
  -H 'Cookie: sb-project-auth-token=your-token'
```

---

#### POST `/api/v2/weekly`

Generates or regenerates a weekly summary for a specific week.

**Request Body:**
```json
{
  "childId": "uuid",
  "date": "2026-01-05"
}
```

**Response:**
```json
{
  "id": "uuid",
  "child_id": "uuid",
  "week_start": "2026-01-05",
  "week_end": "2026-01-11",
  "total_points": 60,
  "screen_time_earned": 300,
  "allowance_earned": 30,
  "is_paid": false,
  "paid_at": null,
  "notes": null,
  "created_at": "2026-01-05T12:00:00Z",
  "updated_at": "2026-01-05T12:00:00Z"
}
```

**cURL Example:**
```bash
curl -X POST 'https://your-domain.com/api/v2/weekly' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-project-auth-token=your-token' \
  -d '{
    "childId": "uuid",
    "date": "2026-01-05"
  }'
```

---

#### PUT `/api/v2/weekly`

Updates a weekly summary (typically for marking as paid).

**Request Body:**
```json
{
  "id": "uuid",
  "isPaid": true,
  "paidAt": "2026-01-12T10:00:00Z",
  "notes": "Paid in cash",
  "screenTimeUsed": 180
}
```

**Response:**
```json
{
  "id": "uuid",
  "child_id": "uuid",
  "week_start": "2026-01-05",
  "week_end": "2026-01-11",
  "total_points": 60,
  "screen_time_earned": 300,
  "screen_time_used": 180,
  "allowance_earned": 30,
  "is_paid": true,
  "paid_at": "2026-01-12T10:00:00Z",
  "notes": "Paid in cash",
  "created_at": "2026-01-05T12:00:00Z",
  "updated_at": "2026-01-12T10:00:00Z"
}
```

**cURL Example:**
```bash
curl -X PUT 'https://your-domain.com/api/v2/weekly' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-project-auth-token=your-token' \
  -d '{
    "id": "uuid",
    "isPaid": true,
    "paidAt": "2026-01-12T10:00:00Z"
  }'
```

---

## V1 API (Legacy)

### Children Management

#### GET `/api/children`

Retrieves all active children in the family.

**Response:**
```json
[
  {
    "id": "uuid",
    "family_id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "date_of_birth": "2015-05-20",
    "avatar_url": null,
    "avatar_color": "#3b82f6",
    "can_view_dashboard": true,
    "is_active": true,
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  }
]
```

**cURL Example:**
```bash
curl -X GET 'https://your-domain.com/api/children' \
  -H 'Cookie: sb-project-auth-token=your-token'
```

---

#### POST `/api/children`

Creates a new child in the family.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "dateOfBirth": "2018-03-15",
  "avatarUrl": null,
  "avatar_color": "#ef4444",
  "canViewDashboard": false
}
```

**Response:**
```json
{
  "id": "uuid",
  "family_id": "uuid",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "date_of_birth": "2018-03-15",
  "avatar_url": null,
  "avatar_color": "#ef4444",
  "can_view_dashboard": false,
  "is_active": true,
  "created_at": "2026-01-05T12:00:00Z",
  "updated_at": "2026-01-05T12:00:00Z"
}
```

**cURL Example:**
```bash
curl -X POST 'https://your-domain.com/api/children' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-project-auth-token=your-token' \
  -d '{
    "name": "Jane Doe",
    "dateOfBirth": "2018-03-15",
    "avatar_color": "#ef4444"
  }'
```

---

#### PUT `/api/children`

Updates an existing child. All fields except `id` are optional.

**Request Body:**
```json
{
  "id": "uuid",
  "name": "Johnny Doe",
  "email": "johnny@example.com",
  "dateOfBirth": "2015-05-20",
  "avatarUrl": "https://example.com/avatar.jpg",
  "avatar_color": "#10b981",
  "canViewDashboard": true,
  "isActive": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "family_id": "uuid",
  "name": "Johnny Doe",
  "email": "johnny@example.com",
  "date_of_birth": "2015-05-20",
  "avatar_url": "https://example.com/avatar.jpg",
  "avatar_color": "#10b981",
  "can_view_dashboard": true,
  "is_active": true,
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-05T12:00:00Z"
}
```

**cURL Example:**
```bash
curl -X PUT 'https://your-domain.com/api/children' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-project-auth-token=your-token' \
  -d '{
    "id": "uuid",
    "name": "Johnny Doe",
    "canViewDashboard": true
  }'
```

---

#### DELETE `/api/children`

Soft deletes a child by setting `is_active` to false.

**Query Parameters:**
- `id` (required): UUID of the child

**Response:**
```json
{
  "success": true
}
```

**cURL Example:**
```bash
curl -X DELETE 'https://your-domain.com/api/children?id=uuid' \
  -H 'Cookie: sb-project-auth-token=your-token'
```

---

## TypeScript Types

### API Request/Response Types

```typescript
// Dashboard
interface DashboardResponse {
  child: {
    id: string
    name: string
  }
  currentWeek: {
    weekStart: string
    weekEnd: string
    totalPoints: number
    screenTime: number
    maxScreenTime: number
    allowance: number
    daysTracked: number
    averageDaily: number
  }
  christmasFund: {
    current: number
    goal: number
    progress: number
  }
  thisMonth: {
    totalPoints: number
    screenTime: number
    allowance: number
  }
  behaviorTrends: Array<{
    date: string
    points: number
    categories: Record<string, number>
  }>
  recentWeeks: Array<{
    weekStart: string
    weekEnd: string
    totalPoints: number
    screenTime: number
    allowance: number
    isPaid: boolean
  }>
}

// Tracking
interface DailyTracking {
  id: string
  child_id: string
  date: string
  day_of_week: number
  category_points: Record<string, number>
  daily_bonuses: number
  daily_deductions: number
  total_points: number
  screen_time_used: number
  notes: string | null
  bonus_events: BonusEvent[]
}

interface BonusEvent {
  id: string
  daily_tracking_id: string
  type: 'bonus' | 'deduction'
  category: string
  points: number
  description: string | null
  created_at: string
}

interface TrackingCreateRequest {
  childId: string
  date: string
  category_points: Record<string, number>
  daily_bonuses?: number
  daily_deductions?: number
  screen_time_used?: number
  notes?: string
  bonus_events?: Array<{
    type: 'bonus' | 'deduction'
    category: string
    points: number
    description?: string
  }>
}

// Configuration
interface ConfigResponse {
  pointsToMinutes: number
  pointsToDollars: number
  christmasGoal: number
  maxWeeklyScreenTime: number
}

interface ConfigUpdateRequest {
  pointsToMinutes?: number
  pointsToDollars?: number
  christmasGoal?: number
  maxWeeklyScreenTime?: number
}

// Category
interface Category {
  id: string
  family_id: string
  name: string
  key?: string
  emoji: string
  icon?: string
  max_points: number
  description: string | null
  sort_order: number
  order_index?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface CategoryCreateRequest {
  name: string
  emoji?: string
  maxPoints?: number
  description?: string
  sortOrder?: number
}

interface CategoryUpdateRequest {
  id: string
  name?: string
  emoji?: string
  maxPoints?: number
  description?: string
  sortOrder?: number
  isActive?: boolean
}

// Bonus Preset
interface BonusPreset {
  id: string
  label: string
  points: number
  icon: string | null
  description: string | null
  isActive: boolean
}

interface BonusCreateRequest {
  name: string
  points?: number
  description?: string
}

interface BonusUpdateRequest {
  id: string
  name?: string
  points?: number
  description?: string
  isActive?: boolean
}

// Deduction Preset
interface DeductionPreset {
  id: string
  label: string
  points: number
  icon: string | null
  description: string | null
  isActive: boolean
}

interface DeductionCreateRequest {
  name: string
  points?: number
  description?: string
}

interface DeductionUpdateRequest {
  id: string
  name?: string
  points?: number
  description?: string
  isActive?: boolean
}

// Weekly Summary
interface WeeklySummary {
  id: string
  child_id: string
  week_start: string
  week_end: string
  total_points: number
  screen_time_earned: number
  screen_time_used: number
  allowance_earned: number
  is_paid: boolean
  paid_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface WeeklySummaryCreateRequest {
  childId: string
  date: string
}

interface WeeklySummaryUpdateRequest {
  id: string
  isPaid?: boolean
  paidAt?: string
  notes?: string
  screenTimeUsed?: number
}

// Child
interface Child {
  id: string
  family_id: string
  name: string
  email: string | null
  date_of_birth: string | null
  avatar_url: string | null
  avatar_color: string
  can_view_dashboard: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ChildCreateRequest {
  name: string
  email?: string
  dateOfBirth?: string
  avatarUrl?: string
  avatar_color?: string
  canViewDashboard?: boolean
}

interface ChildUpdateRequest {
  id: string
  name?: string
  email?: string
  dateOfBirth?: string
  avatarUrl?: string
  avatar_color?: string
  canViewDashboard?: boolean
  can_view_dashboard?: boolean
  isActive?: boolean
}

// Initialize
interface InitializeStatusResponse {
  initialized: boolean
  categories: number
  bonuses: number
  deductions: number
  hasConfig: boolean
}

interface InitializeResponse {
  message: string
  categories?: number
  bonuses?: number
  deductions?: number
  alreadyInitialized?: boolean
}

// Error
interface ErrorResponse {
  error: string
}
```

---

## Testing Examples

### Testing with cURL

#### Complete Setup Flow

```bash
# 1. Initialize system (after authentication)
curl -X POST 'https://your-domain.com/api/v2/initialize' \
  -H 'Cookie: sb-project-auth-token=your-token'

# 2. Check initialization status
curl -X GET 'https://your-domain.com/api/v2/initialize' \
  -H 'Cookie: sb-project-auth-token=your-token'

# 3. Get configuration
curl -X GET 'https://your-domain.com/api/v2/config' \
  -H 'Cookie: sb-project-auth-token=your-token'

# 4. Create a child
curl -X POST 'https://your-domain.com/api/children' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-project-auth-token=your-token' \
  -d '{
    "name": "Alice Smith",
    "dateOfBirth": "2015-06-15",
    "avatar_color": "#8b5cf6"
  }'

# 5. Get all children (copy child ID from response)
curl -X GET 'https://your-domain.com/api/children' \
  -H 'Cookie: sb-project-auth-token=your-token'

# 6. Get categories
curl -X GET 'https://your-domain.com/api/v2/categories' \
  -H 'Cookie: sb-project-auth-token=your-token'

# 7. Save daily tracking
curl -X POST 'https://your-domain.com/api/v2/tracking' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-project-auth-token=your-token' \
  -d '{
    "childId": "child-uuid-here",
    "date": "2026-01-05",
    "category_points": {
      "health_nutrition": 3,
      "screen_discipline": 2,
      "self_study": 2,
      "household": 3,
      "behavior_respect": 2
    },
    "daily_bonuses": 2,
    "daily_deductions": 0,
    "bonus_events": [
      {
        "type": "bonus",
        "category": "Perfect sugar-free day",
        "points": 2
      }
    ]
  }'

# 8. Get dashboard
curl -X GET 'https://your-domain.com/api/v2/dashboard?childId=child-uuid-here' \
  -H 'Cookie: sb-project-auth-token=your-token'

# 9. Generate weekly summary
curl -X POST 'https://your-domain.com/api/v2/weekly' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-project-auth-token=your-token' \
  -d '{
    "childId": "child-uuid-here",
    "date": "2026-01-05"
  }'

# 10. Mark weekly summary as paid
curl -X PUT 'https://your-domain.com/api/v2/weekly' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-project-auth-token=your-token' \
  -d '{
    "id": "summary-uuid-here",
    "isPaid": true,
    "paidAt": "2026-01-12T10:00:00Z"
  }'
```

### Testing with TypeScript/JavaScript

```typescript
// Using fetch API
async function getDashboard(childId: string): Promise<DashboardResponse> {
  const response = await fetch(
    `/api/v2/dashboard?childId=${childId}`,
    {
      credentials: 'include',
    }
  )

  if (!response.ok) {
    const error: ErrorResponse = await response.json()
    throw new Error(error.error)
  }

  return response.json()
}

async function saveTracking(data: TrackingCreateRequest): Promise<DailyTracking> {
  const response = await fetch('/api/v2/tracking', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error: ErrorResponse = await response.json()
    throw new Error(error.error)
  }

  return response.json()
}

async function updateConfig(config: ConfigUpdateRequest): Promise<ConfigResponse> {
  const response = await fetch('/api/v2/config', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(config),
  })

  if (!response.ok) {
    const error: ErrorResponse = await response.json()
    throw new Error(error.error)
  }

  return response.json()
}

// Usage example
try {
  const dashboard = await getDashboard('child-uuid')
  console.log('Current week points:', dashboard.currentWeek.totalPoints)
  console.log('Christmas fund progress:', dashboard.christmasFund.progress)
} catch (error) {
  console.error('Failed to fetch dashboard:', error)
}
```

---

## Migration Guide

### Migrating from V1 to V2

#### Key Changes

1. **Dashboard Endpoint**: V2 provides aggregated dashboard data
   - **V1**: Required multiple API calls to get dashboard data
   - **V2**: Single `/api/v2/dashboard` call with comprehensive data

2. **Tracking Structure**: Improved category tracking
   - **V1**: Categories stored as separate columns
   - **V2**: Categories stored in `category_points` JSON object for flexibility

3. **Bonus/Deduction Events**: New event tracking
   - **V1**: Only totals stored
   - **V2**: Detailed `bonus_events` table with descriptions

4. **Configuration Management**: Centralized configuration
   - **V1**: Configuration scattered across requests
   - **V2**: `/api/v2/config` endpoint for all settings

5. **Weekly Summaries**: Automated weekly calculations
   - **V1**: Manual calculation required
   - **V2**: `/api/v2/weekly` with POST to generate summaries

#### Migration Steps

**Step 1: Update Dashboard Calls**

```typescript
// V1 (multiple calls)
const child = await fetch(`/api/children/${childId}`)
const tracking = await fetch(`/api/tracking?childId=${childId}`)
const config = await fetch(`/api/config`)
// Manual calculations...

// V2 (single call)
const dashboard = await fetch(`/api/v2/dashboard?childId=${childId}`)
// All data included: currentWeek, christmasFund, thisMonth, trends, etc.
```

**Step 2: Update Tracking Saves**

```typescript
// V1
await fetch('/api/tracking', {
  method: 'POST',
  body: JSON.stringify({
    childId,
    date,
    health_nutrition: 3,
    screen_discipline: 2,
    // ... separate fields
  })
})

// V2
await fetch('/api/v2/tracking', {
  method: 'POST',
  body: JSON.stringify({
    childId,
    date,
    category_points: {
      health_nutrition: 3,
      screen_discipline: 2,
      // ... grouped in object
    },
    bonus_events: [
      {
        type: 'bonus',
        category: 'Perfect sugar-free day',
        points: 2
      }
    ]
  })
})
```

**Step 3: Use Configuration Endpoint**

```typescript
// V1
// Configuration passed with each request

// V2
const config = await fetch('/api/v2/config')
// Returns: pointsToMinutes, pointsToDollars, christmasGoal, maxWeeklyScreenTime

// Update configuration
await fetch('/api/v2/config', {
  method: 'PUT',
  body: JSON.stringify({
    christmasGoal: 600,
    maxWeeklyScreenTime: 480
  })
})
```

**Step 4: Implement Weekly Summaries**

```typescript
// V1
// No weekly summary feature

// V2
// Generate weekly summary
await fetch('/api/v2/weekly', {
  method: 'POST',
  body: JSON.stringify({
    childId,
    date: '2026-01-05'
  })
})

// Get weekly summaries
const weeks = await fetch(`/api/v2/weekly?childId=${childId}&limit=10`)

// Mark as paid
await fetch('/api/v2/weekly', {
  method: 'PUT',
  body: JSON.stringify({
    id: summaryId,
    isPaid: true,
    paidAt: new Date().toISOString()
  })
})
```

**Step 5: Initialize System**

```typescript
// Check if initialized
const status = await fetch('/api/v2/initialize')

// Initialize with defaults if needed
if (!status.initialized) {
  await fetch('/api/v2/initialize', { method: 'POST' })
}
```

#### Backward Compatibility

- **Children Management**: V1 `/api/children` endpoints remain unchanged
- **Authentication**: No changes to authentication flow
- **Database**: V2 uses same database tables with enhanced structure

#### Data Migration Script

No data migration is required as V2 API works with the existing database schema. The V2 API adds new capabilities while maintaining compatibility with existing data.

---

## Best Practices

### API Usage Recommendations

1. **Error Handling**: Always check response status and handle errors appropriately
   ```typescript
   if (!response.ok) {
     const error = await response.json()
     console.error('API Error:', error.error)
     // Handle specific error codes
   }
   ```

2. **Caching**: Cache configuration data client-side to reduce API calls
   ```typescript
   // Cache config for 5 minutes
   const config = await getCachedConfig()
   ```

3. **Batch Operations**: Use dashboard endpoint instead of multiple calls
   ```typescript
   // ✅ Good: Single dashboard call
   const dashboard = await fetch(`/api/v2/dashboard?childId=${id}`)
   
   // ❌ Bad: Multiple separate calls
   const child = await fetch(`/api/children/${id}`)
   const tracking = await fetch(`/api/v2/tracking?childId=${id}`)
   const config = await fetch(`/api/v2/config`)
   ```

4. **Date Handling**: Always use YYYY-MM-DD format for dates
   ```typescript
   const today = new Date().toISOString().split('T')[0]
   ```

5. **Weekly Boundaries**: V2 API uses Monday as week start (consistent with `day_of_week` calculation)

6. **Type Safety**: Use provided TypeScript types for compile-time safety
   ```typescript
   const tracking: DailyTracking = await response.json()
   ```

---

## Support & Resources

- **Database Schema**: See [DATABASE.md](./DATABASE.md)
- **Authentication**: Powered by Supabase Auth
- **Framework**: Next.js 14+ App Router with Route Handlers
- **Database**: PostgreSQL with Supabase

---

## Changelog

### Version 2.0 (Current)
- Added V2 API endpoints with improved structure
- Introduced dashboard aggregation endpoint
- Added weekly summary generation
- Improved category tracking with JSON structure
- Added bonus_events detailed tracking
- Centralized configuration management

### Version 1.0
- Initial API release
- Basic CRUD operations for children
- Simple tracking structure

---

**Generated:** January 5, 2026  
**API Version:** 2.0  
**Documentation Status:** Complete
