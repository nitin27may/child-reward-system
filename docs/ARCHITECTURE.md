# Architecture Documentation

Complete system architecture for the Child Reward System, including component diagrams, data flow, authentication, and deployment architecture.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Component Architecture](#component-architecture)
4. [Data Flow](#data-flow)
5. [Authentication Flow](#authentication-flow)
6. [Feature Workflows](#feature-workflows)
7. [Database Architecture](#database-architecture)
8. [Deployment Architecture](#deployment-architecture)
9. [Technology Stack](#technology-stack)

---

## System Overview

The Child Reward System is a **Next.js 15** full-stack application with **Supabase** backend, built as a **Progressive Web App (PWA)** for families to track children's behavior and manage dual-track rewards (screen time + savings goal).

### Architecture Principles:
- **Multi-tenancy:** Complete data isolation per family via RLS
- **Role-based access:** Parent (admin) vs Child (read-only)
- **Server-side rendering:** Next.js App Router with RSC
- **Real-time data:** Supabase Realtime (future)
- **Offline-first:** Service Worker for PWA
- **Type-safe:** TypeScript throughout

---

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        PWA[PWA Service Worker]
        Mobile[Mobile Browser/App]
    end
    
    subgraph "Application Layer - Next.js 15"
        AppRouter[App Router]
        ServerComponents[Server Components]
        ClientComponents[Client Components]
        API[API Routes /api/v2]
        Middleware[Auth Middleware]
    end
    
    subgraph "Authentication Layer"
        SupabaseAuth[Supabase Auth]
        GoogleOAuth[Google OAuth 2.0]
        EmailAuth[Email/Password]
    end
    
    subgraph "Database Layer - Supabase"
        PostgreSQL[(PostgreSQL Database)]
        RLS[Row Level Security]
        Functions[Database Functions]
        Triggers[Triggers]
    end
    
    subgraph "External Services"
        Vercel[Vercel Hosting]
        Analytics[Vercel Analytics]
    end
    
    Browser --> PWA
    PWA --> AppRouter
    Mobile --> AppRouter
    
    AppRouter --> Middleware
    Middleware --> SupabaseAuth
    
    AppRouter --> ServerComponents
    AppRouter --> ClientComponents
    ServerComponents --> API
    ClientComponents --> API
    
    API --> SupabaseAuth
    API --> PostgreSQL
    
    SupabaseAuth --> GoogleOAuth
    SupabaseAuth --> EmailAuth
    
    PostgreSQL --> RLS
    PostgreSQL --> Functions
    PostgreSQL --> Triggers
    
    Vercel -.deploys.-> AppRouter
    Analytics -.monitors.-> AppRouter
```

---

## Component Architecture

### Frontend Component Hierarchy

```mermaid
graph TD
    RootLayout[app/layout.tsx<br/>Root Layout]
    AuthProvider[AuthProvider Context]
    Navigation[Navigation Component]
    
    RootLayout --> AuthProvider
    RootLayout --> Navigation
    
    subgraph "Pages"
        Dashboard[Dashboard Page<br/>app/page.tsx]
        Tracking[Tracking Page<br/>app/tracking/page.tsx]
        Weekly[Weekly Page<br/>app/weekly/page.tsx]
        Children[Children Page<br/>app/children/page.tsx]
        Config[Config Page<br/>app/config/page.tsx]
    end
    
    AuthProvider --> Dashboard
    AuthProvider --> Tracking
    AuthProvider --> Weekly
    AuthProvider --> Children
    AuthProvider --> Config
    
    Navigation -.links.-> Dashboard
    Navigation -.links.-> Tracking
    Navigation -.links.-> Weekly
    Navigation -.links.-> Children
    Navigation -.links.-> Config
    
    subgraph "Shared Components"
        ChildSelector[Child Selector]
        Charts[Charts - Recharts]
        UI[UI Components<br/>Button, Card, Input]
        EmojiPicker[Emoji Picker]
        PageHeader[Page Header]
    end
    
    Dashboard --> ChildSelector
    Dashboard --> Charts
    Tracking --> ChildSelector
    Tracking --> EmojiPicker
    Weekly --> ChildSelector
    Weekly --> Charts
    Children --> UI
    Config --> EmojiPicker
    Config --> UI
    
    subgraph "API Routes V2"
        DashAPI[/api/v2/dashboard]
        TrackAPI[/api/v2/tracking]
        WeeklyAPI[/api/v2/weekly]
        ConfigAPI[/api/v2/config]
        CatAPI[/api/v2/categories]
        BonusAPI[/api/v2/bonuses]
        DedAPI[/api/v2/deductions]
        InitAPI[/api/v2/initialize]
    end
    
    Dashboard --> DashAPI
    Tracking --> TrackAPI
    Weekly --> WeeklyAPI
    Config --> ConfigAPI
    Config --> CatAPI
    Config --> BonusAPI
    Config --> DedAPI
```

### API Route Architecture

```mermaid
graph LR
    subgraph "V2 API Routes"
        Dashboard[/api/v2/dashboard<br/>GET: Aggregated analytics]
        Tracking[/api/v2/tracking<br/>GET, POST, PUT]
        Weekly[/api/v2/weekly<br/>GET: Weekly summaries]
        Config[/api/v2/config<br/>GET, PUT]
        Categories[/api/v2/categories<br/>GET, POST, PUT, DELETE]
        Bonuses[/api/v2/bonuses<br/>GET, POST, PUT, DELETE]
        Deductions[/api/v2/deductions<br/>GET, POST, PUT, DELETE]
        Initialize[/api/v2/initialize<br/>POST: Family setup]
    end
    
    subgraph "V1 Legacy"
        Children[/api/children<br/>GET, POST, PUT, DELETE]
    end
    
    Dashboard --> Supabase
    Tracking --> Supabase
    Weekly --> Supabase
    Config --> Supabase
    Categories --> Supabase
    Bonuses --> Supabase
    Deductions --> Supabase
    Initialize --> Supabase
    Children --> Supabase
    
    Supabase[(Supabase PostgreSQL)]
```

---

## Data Flow

### Daily Tracking Data Flow

```mermaid
sequenceDiagram
    participant User
    participant TrackingPage
    participant API
    participant Supabase
    participant DB
    
    User->>TrackingPage: Select date & child
    TrackingPage->>API: GET /api/v2/tracking?childId=X&date=Y
    API->>Supabase: Auth check
    Supabase-->>API: User session
    API->>DB: SELECT from daily_tracking<br/>WHERE child_id=X AND date=Y
    DB-->>API: Return tracking data
    API-->>TrackingPage: JSON response
    TrackingPage-->>User: Display categories & points
    
    User->>TrackingPage: Update category points
    TrackingPage->>API: POST /api/v2/tracking<br/>{childId, date, categoryPoints}
    API->>Supabase: Verify auth & RLS
    API->>DB: INSERT/UPDATE daily_tracking<br/>RETURNING calculate_daily_total_points()
    DB-->>API: Updated record with totals
    API-->>TrackingPage: Success with totals
    TrackingPage-->>User: Show updated points
    
    Note over DB: Trigger: calculate_daily_total_points()<br/>Updates total_points_earned
```

### Dashboard Aggregation Flow

```mermaid
sequenceDiagram
    participant User
    participant Dashboard
    participant API
    participant DB
    
    User->>Dashboard: Load dashboard
    Dashboard->>API: GET /api/v2/dashboard?childId=X
    
    API->>DB: Query current week tracking
    DB-->>API: Week data
    
    API->>DB: Query year-to-date points
    DB-->>API: YTD total
    
    API->>DB: Query last 30 days
    DB-->>API: Daily points array
    
    API->>DB: Query last 4 weeks
    DB-->>API: Weekly summaries
    
    API->>DB: Query configuration
    DB-->>API: Conversion rates & goals
    
    API->>API: Calculate:<br/>- Screen time earned<br/>- Fund savings<br/>- Progress percentages
    
    API-->>Dashboard: Aggregated analytics JSON
    Dashboard-->>User: Display charts & stats
```

### Weekly Summary Calculation

```mermaid
flowchart TD
    Start([Weekly Review Request]) --> SelectWeek[Select Week Range]
    SelectWeek --> FetchTracking[Fetch all daily_tracking<br/>for child + week]
    FetchTracking --> SumPoints[Sum total_points_earned]
    SumPoints --> GetConfig[Get configuration:<br/>points_to_minutes<br/>points_to_dollars<br/>max_weekly_screen_time]
    
    GetConfig --> CalcScreen[Calculate Screen Time:<br/>points × points_to_minutes]
    CalcScreen --> ApplyCap{Screen time ><br/>max_weekly_screen_time?}
    ApplyCap -->|Yes| CapScreen[Cap at maximum]
    ApplyCap -->|No| UseCalc[Use calculated]
    
    CapScreen --> CalcFund[Calculate Fund:<br/>points × points_to_dollars]
    UseCalc --> CalcFund
    
    CalcFund --> Upsert[UPSERT weekly_summaries:<br/>- total_points<br/>- screen_time_earned<br/>- fund_contribution]
    
    Upsert --> Return[Return weekly summary]
    Return --> End([Display Weekly Review])
```

---

## Authentication Flow

### Parent Signup & Family Initialization

```mermaid
sequenceDiagram
    participant User
    participant SignupPage
    participant SupabaseAuth
    participant Database
    participant SetupPage
    participant InitAPI
    
    User->>SignupPage: Enter email, password, name
    SignupPage->>SupabaseAuth: signUp(email, password)
    SupabaseAuth->>Database: INSERT INTO auth.users
    Database->>Database: Trigger: handle_new_user()<br/>INSERT INTO profiles<br/>(role='parent')
    Database-->>SupabaseAuth: User created
    SupabaseAuth-->>SignupPage: Success with session
    SignupPage->>SetupPage: Redirect to /auth/setup
    
    User->>SetupPage: Enter family name
    SetupPage->>InitAPI: POST /api/v2/initialize<br/>{familyName}
    InitAPI->>Database: BEGIN TRANSACTION
    InitAPI->>Database: INSERT INTO families
    Database-->>InitAPI: family_id
    InitAPI->>Database: UPDATE profiles<br/>SET family_id
    InitAPI->>Database: INSERT INTO configurations<br/>(defaults)
    InitAPI->>Database: INSERT INTO categories<br/>(5 defaults)
    InitAPI->>Database: INSERT INTO bonus_presets<br/>(4 defaults)
    InitAPI->>Database: INSERT INTO deduction_presets<br/>(7 defaults)
    InitAPI->>Database: COMMIT
    InitAPI-->>SetupPage: Success
    SetupPage->>Dashboard: Redirect to /
    Dashboard-->>User: Show dashboard
```

### Google OAuth Flow

```mermaid
sequenceDiagram
    participant User
    participant LoginPage
    participant SupabaseAuth
    participant Google
    participant Database
    participant Dashboard
    
    User->>LoginPage: Click "Sign in with Google"
    LoginPage->>SupabaseAuth: signInWithOAuth('google')
    SupabaseAuth->>Google: Redirect to Google consent
    User->>Google: Approve permissions
    Google->>SupabaseAuth: Redirect with code
    SupabaseAuth->>Google: Exchange code for token
    Google-->>SupabaseAuth: Access token + user info
    SupabaseAuth->>Database: INSERT auth.users<br/>(if new user)
    Database->>Database: Trigger: handle_new_user()<br/>INSERT profiles (role='parent')
    SupabaseAuth->>LoginPage: Redirect to /auth/callback
    LoginPage->>Dashboard: Check family_id
    
    alt Family exists
        Dashboard-->>User: Show dashboard
    else No family
        Dashboard->>SetupPage: Redirect to /auth/setup
        SetupPage-->>User: Initialize family
    end
```

### Child Login Flow

```mermaid
sequenceDiagram
    participant Parent
    participant ChildMgmt
    participant Database
    participant Child
    participant SignupPage
    participant SupabaseAuth
    participant Dashboard
    
    Parent->>ChildMgmt: Add child with email
    ChildMgmt->>Database: INSERT INTO children<br/>(name, email, family_id)
    Database-->>ChildMgmt: Child created
    
    Child->>SignupPage: Sign up with email
    SignupPage->>SupabaseAuth: signUp(email, password)
    SupabaseAuth->>Database: INSERT auth.users
    Database->>Database: Trigger: handle_new_user()<br/>Check for matching child email
    
    alt Email matches child
        Database->>Database: INSERT profiles (role='child')<br/>Link to child record<br/>Inherit family_id
        Database-->>SignupPage: Linked to child
        SignupPage->>Dashboard: Redirect to /
        Dashboard-->>Child: Read-only dashboard
    else No match
        Database->>Database: INSERT profiles (role='parent')<br/>No family_id
        Database-->>SignupPage: New parent
        SignupPage->>SetupPage: Redirect to /auth/setup
    end
```

### Session Management & Middleware

```mermaid
flowchart TD
    Request([HTTP Request]) --> Middleware[middleware.ts]
    Middleware --> CheckCookie{Session cookie exists?}
    
    CheckCookie -->|No| PublicRoute{Is public route?}
    PublicRoute -->|Yes| Allow[Allow access]
    PublicRoute -->|No| Redirect1[Redirect to login]
    
    CheckCookie -->|Yes| RefreshSession[Supabase refreshSession]
    RefreshSession --> Valid{Session valid?}
    
    Valid -->|Yes| UpdateCookie[Update cookie]
    Valid -->|No| ClearCookie[Clear invalid cookie]
    
    UpdateCookie --> ProtectedRoute{Is protected route?}
    ClearCookie --> Redirect2[Redirect to login]
    
    ProtectedRoute -->|Yes and Authed| Allow
    ProtectedRoute -->|No| Allow
    ProtectedRoute -->|Yes and Not Authed| Redirect2
    
    Allow --> NextRequest[Continue to page or API]
    Redirect1 --> End([Response])
    Redirect2 --> End
    NextRequest --> End
```

---

## Feature Workflows

### Complete Daily Tracking Workflow

```mermaid
flowchart TD
    Start([User opens Tracking page]) --> LoadPage[Load tracking page]
    LoadPage --> CheckAuth{Authenticated?}
    CheckAuth -->|No| LoginRedirect[Redirect to login]
    CheckAuth -->|Yes| CheckRole{Role?}
    
    CheckRole -->|Child| Deny[Show Access Denied]
    CheckRole -->|Parent| LoadChildren[Fetch children list]
    
    LoadChildren --> SelectChild[Select child from dropdown]
    SelectChild --> SelectDate[Select date]
    SelectDate --> FetchTracking[GET tracking data]
    
    FetchTracking --> HasData{Data exists?}
    HasData -->|No| ShowEmpty[Show empty form]
    HasData -->|Yes| PopulateForm[Populate form]
    
    ShowEmpty --> DisplayForm[Display tracking form]
    PopulateForm --> DisplayForm
    
    DisplayForm --> UserAction{User action?}
    
    UserAction -->|Increment category| Validate1{Within range?}
    Validate1 -->|Yes| UpdateLocal1[Update local state]
    Validate1 -->|No| ShowError1[Show error toast]
    UpdateLocal1 --> UserAction
    
    UserAction -->|Add bonus| ValidateBonus{Valid points?}
    ValidateBonus -->|Yes| AddBonus[Add to bonus array]
    ValidateBonus -->|No| ShowError2[Show error]
    AddBonus --> UserAction
    
    UserAction -->|Add deduction| ValidateDeduction{Valid points?}
    ValidateDeduction -->|Yes| AddDeduction[Add to deduction array]
    ValidateDeduction -->|No| ShowError3[Show error]
    AddDeduction --> UserAction
    
    UserAction -->|Save| PreparePayload[Prepare JSON payload]
    PreparePayload --> SaveAPI[POST to API]
    
    SaveAPI --> DBOperation[UPSERT daily tracking]
    DBOperation --> CalcTrigger[Calculate totals]
    CalcTrigger --> ReturnData[Return updated record]
    ReturnData --> ShowSuccess[Show success toast]
    ShowSuccess --> DisplayForm
    
    UserAction -->|Navigate date| SelectDate
    UserAction -->|Switch child| SelectChild
    
    Deny --> End([End])
    LoginRedirect --> End
    ShowSuccess --> End
```

### Weekly Review Workflow

```mermaid
flowchart TD
    Start([User opens Weekly page]) --> LoadPage[Load /weekly]
    LoadPage --> Auth{Authenticated?}
    Auth -->|No| Login[Redirect /auth/login]
    Auth -->|Yes| LoadChildren[Fetch children]
    
    LoadChildren --> SelectChild[Select child]
    SelectChild --> SelectWeek[Select week<br/>Monday-Sunday]
    SelectWeek --> FetchWeekly[GET /api/v2/weekly<br/>?childId=X&startDate=Y&endDate=Z]
    
    FetchWeekly --> FetchConfig[GET /api/v2/config]
    FetchConfig --> Calculate[Calculate:<br/>- Total points<br/>- Screen time = points × rate<br/>- Capped at max<br/>- Fund = points × dollar rate]
    
    Calculate --> FetchDaily[GET daily breakdown<br/>for 7 days]
    FetchDaily --> RenderCharts[Render charts:<br/>- Daily points bar chart<br/>- Screen time pie<br/>- Fund progress bar]
    
    RenderCharts --> Display[Display summary:<br/>- Total points<br/>- Screen time earned<br/>- Fund contribution<br/>- Daily breakdown<br/>- Category distribution]
    
    Display --> UserAction{User action?}
    UserAction -->|Change week| SelectWeek
    UserAction -->|Change child| SelectChild
    UserAction -->|View day detail| NavTracking[Navigate to /tracking<br/>with date]
    
    Login --> End([End])
    NavTracking --> End
    Display --> End
```

### Configuration Update Workflow

```mermaid
flowchart TD
    Start([User opens Config page]) --> LoadPage[Load /config]
    LoadPage --> Auth{Authenticated<br/>& Parent?}
    Auth -->|No| Deny[Show "Access Denied"]
    Auth -->|Yes| LoadConfig[GET /api/v2/config]
    
    LoadConfig --> LoadCategories[GET /api/v2/categories]
    LoadCategories --> LoadBonuses[GET /api/v2/bonuses]
    LoadBonuses --> LoadDeductions[GET /api/v2/deductions]
    LoadDeductions --> RenderTabs[Render tabs:<br/>General, Categories,<br/>Bonuses, Deductions]
    
    RenderTabs --> UserAction{User action?}
    
    UserAction -->|Update general| ValidateGeneral{Valid ranges?}
    ValidateGeneral -->|Yes| SaveGeneral[PUT /api/v2/config]
    ValidateGeneral -->|No| ErrorGeneral[Show validation error]
    SaveGeneral --> Success1[Show success]
    Success1 --> RenderTabs
    
    UserAction -->|Add category| ValidateCat{Valid data?}
    ValidateCat -->|Yes| SaveCat[POST /api/v2/categories]
    ValidateCat -->|No| ErrorCat[Show error]
    SaveCat --> ReloadCat[Reload categories]
    ReloadCat --> RenderTabs
    
    UserAction -->|Edit category| SaveEditCat[PUT /api/v2/categories/:id]
    SaveEditCat --> ReloadCat
    
    UserAction -->|Delete category| ConfirmDel{Confirm?}
    ConfirmDel -->|Yes| DeleteCat[DELETE /api/v2/categories/:id]
    ConfirmDel -->|No| RenderTabs
    DeleteCat --> ReloadCat
    
    UserAction -->|Manage bonus| SaveBonus[POST/PUT/DELETE<br/>/api/v2/bonuses]
    SaveBonus --> ReloadBonus[Reload bonuses]
    ReloadBonus --> RenderTabs
    
    UserAction -->|Manage deduction| SaveDed[POST/PUT/DELETE<br/>/api/v2/deductions]
    SaveDed --> ReloadDed[Reload deductions]
    ReloadDed --> RenderTabs
    
    Deny --> End([End])
    RenderTabs --> End
```

---

## Database Architecture

### Schema Relationships (from DATABASE.md)

```mermaid
erDiagram
    FAMILIES ||--o{ PROFILES : "has members"
    FAMILIES ||--o{ CHILDREN : "has children"
    FAMILIES ||--|| CONFIGURATIONS : "has config"
    FAMILIES ||--o{ CATEGORIES : "defines"
    FAMILIES ||--o{ BONUS_PRESETS : "defines"
    FAMILIES ||--o{ DEDUCTION_PRESETS : "defines"
    CHILDREN ||--o{ DAILY_TRACKING : "tracks daily"
    CHILDREN ||--o{ WEEKLY_SUMMARIES : "has summaries"
    DAILY_TRACKING ||--o{ BONUS_EVENTS : "contains events"
    PROFILES ||--o| CHILDREN : "may link to"
```

### Row Level Security (RLS) Flow

```mermaid
flowchart TD
    Query([SQL Query]) --> RLS{RLS Policy Check}
    
    RLS --> GetUser[Get authenticated user<br/>auth.uid()]
    GetUser --> GetFamily[get_user_family_id()<br/>Returns user's family_id]
    
    GetFamily --> CheckRole{Check role}
    CheckRole -->|Parent| ParentCheck[is_parent() = true<br/>Can access all family data]
    CheckRole -->|Child| ChildCheck[child_in_family()<br/>Can only access own data]
    
    ParentCheck --> FilterFamily[Filter by family_id]
    ChildCheck --> FilterChild[Filter by family_id<br/>AND child_id = linked_profile_id]
    
    FilterFamily --> ExecuteQuery[Execute filtered query]
    FilterChild --> ExecuteQuery
    
    ExecuteQuery --> Return[Return results]
    
    RLS -->|No auth| Deny[Return empty set]
    Deny --> Return
```

### Database Function Flow

```mermaid
flowchart LR
    subgraph "Helper Functions"
        GetFamily[get_user_family_id]
        IsParent[is_parent]
        ChildInFamily[child_in_family]
    end
    
    subgraph "Data Functions"
        CalcDaily[calculate_daily_total_points]
        GetWeekly[get_weekly_summary]
        UpsertWeekly[upsert_weekly_summary]
    end
    
    subgraph "Triggers"
        NewUser[handle_new_user]
        InitFamily[initialize_family]
        UpdatedAt[updated_at trigger]
    end
    
    GetFamily --> IsParent
    GetFamily --> ChildInFamily
    IsParent --> RLS[RLS Policies]
    ChildInFamily --> RLS
    
    CalcDaily --> DailyTracking[(daily_tracking)]
    GetWeekly --> WeeklySummaries[(weekly_summaries)]
    UpsertWeekly --> WeeklySummaries
    
    NewUser --> AuthUsers[(auth.users)]
    InitFamily --> Families[(families)]
    UpdatedAt --> AllTables[(All tables)]
```

---

## Deployment Architecture

### Production Deployment (Vercel + Supabase)

```mermaid
graph TB
    subgraph "DNS Layer"
        DNS[Custom Domain DNS]
    end
    
    subgraph "Vercel Edge Network"
        EdgeCache[Edge Cache CDN]
        EdgeFunctions[Edge Middleware]
    end
    
    subgraph "Vercel Serverless"
        NextServer[Next.js Server]
        APIRoutes[API Routes Serverless]
        StaticAssets[Static Assets]
    end
    
    subgraph "Supabase Cloud"
        SupabaseAuth[Auth Service]
        SupabaseDB[PostgreSQL Database]
        SupabaseAPI[REST API - PostgREST]
        SupabaseRealtime[Realtime Service]
    end
    
    subgraph "External Services"
        GoogleAuth[Google OAuth]
        VercelAnalytics[Vercel Analytics]
    end
    
    DNS --> EdgeCache
    EdgeCache --> EdgeFunctions
    EdgeFunctions --> NextServer
    
    NextServer --> APIRoutes
    NextServer --> StaticAssets
    
    APIRoutes --> SupabaseAuth
    APIRoutes --> SupabaseDB
    
    SupabaseAuth --> GoogleAuth
    SupabaseDB --> SupabaseAPI
    SupabaseDB --> SupabaseRealtime
    
    NextServer --> VercelAnalytics
    
    EdgeCache -.serves.-> StaticAssets
```

### Development vs Production

```mermaid
flowchart LR
    subgraph Development
        DevLocal[localhost:3000]
        DevSupabase[Supabase Dev Project]
        DevLocal --> DevSupabase
    end
    
    subgraph Staging
        StageVercel[Vercel Preview]
        StageSupabase[Supabase Staging]
        StageVercel --> StageSupabase
    end
    
    subgraph Production
        ProdVercel[Vercel Production]
        ProdSupabase[Supabase Production]
        ProdVercel --> ProdSupabase
    end
    
    Git[Git Push] -->|main branch| ProdVercel
    Git -->|feature branch| StageVercel
    
    DevLocal -.local dev.-> Git
```

### CI/CD Pipeline

```mermaid
flowchart TD
    Start([Git Push]) --> Branch{Branch?}
    
    Branch -->|feature/*| CreatePR[Create Pull Request]
    Branch -->|main| DeployProd[Deploy to Production]
    
    CreatePR --> VercelBuild[Vercel: Build Preview]
    VercelBuild --> BuildSuccess{Build success?}
    
    BuildSuccess -->|Yes| DeployPreview[Deploy to Preview URL]
    BuildSuccess -->|No| BuildFail[Notify failure]
    
    DeployPreview --> RunTests[Run tests - future]
    RunTests --> Comment[Comment preview URL on PR]
    
    Comment --> Review[Code review]
    Review --> Merge{Merge to main?}
    
    Merge -->|Yes| DeployProd
    Merge -->|No| CreatePR
    
    DeployProd --> BuildProd[Vercel: Build Production]
    BuildProd --> ProdSuccess{Build success?}
    
    ProdSuccess -->|Yes| DeployLive[Deploy to yourdomain.com]
    ProdSuccess -->|No| Rollback[Auto-rollback to previous]
    
    DeployLive --> Monitor[Monitor with Analytics]
    Monitor --> End([Live])
    
    BuildFail --> End
    Rollback --> End
```

---

## Technology Stack

### Frontend Stack

```mermaid
graph TD
    subgraph "Framework"
        Next[Next.js 15.1.4<br/>App Router + RSC]
        React[React 19]
    end
    
    subgraph "Styling"
        Tailwind[Tailwind CSS 3.4.17]
        UI[shadcn/ui Components]
    end
    
    subgraph "State Management"
        Context[React Context<br/>AuthContext]
        LocalStorage[localStorage<br/>Child selection]
    end
    
    subgraph "Data Visualization"
        Recharts[Recharts 3.6.0<br/>Charts library]
    end
    
    subgraph "PWA"
        SW[Service Worker]
        Manifest[Web App Manifest]
    end
    
    Next --> React
    Next --> Tailwind
    Tailwind --> UI
    React --> Context
    React --> LocalStorage
    React --> Recharts
    Next --> SW
    Next --> Manifest
```

### Backend Stack

```mermaid
graph TD
    subgraph "Backend Framework"
        API[Next.js API Routes<br/>Serverless Functions]
    end
    
    subgraph "Database"
        Supabase[Supabase]
        PostgreSQL[(PostgreSQL 15)]
        RLS[Row Level Security]
    end
    
    subgraph "Authentication"
        SupabaseAuth[Supabase Auth]
        Google[Google OAuth 2.0]
        Email[Email/Password]
    end
    
    subgraph "TypeScript"
        Types[Generated Types<br/>types/supabase.ts]
    end
    
    API --> Supabase
    Supabase --> PostgreSQL
    PostgreSQL --> RLS
    Supabase --> SupabaseAuth
    SupabaseAuth --> Google
    SupabaseAuth --> Email
    Supabase --> Types
```

### Development Tools

```mermaid
graph LR
    subgraph "Development"
        VSCode[VS Code]
        ESLint[ESLint]
        Prettier[Prettier - future]
        TypeScript[TypeScript 5.x]
    end
    
    subgraph "Build Tools"
        Turbopack[Turbopack<br/>Dev server]
        PostCSS[PostCSS]
    end
    
    subgraph "Deployment"
        Vercel[Vercel CLI]
        Git[Git/GitHub]
    end
    
    VSCode --> ESLint
    VSCode --> TypeScript
    TypeScript --> Turbopack
    Turbopack --> PostCSS
    Git --> Vercel
```

---

## Performance Considerations

### Optimization Strategies

```mermaid
flowchart TD
    Request([User Request]) --> Cache{Cached?}
    
    Cache -->|Yes| ServeCache[Serve from Edge Cache]
    Cache -->|No| SSR{Server render?}
    
    SSR -->|Yes| ServerRender[Server Component Render]
    SSR -->|No| ClientRender[Client Component Render]
    
    ServerRender --> FetchData[Fetch from Supabase]
    ClientRender --> FetchData
    
    FetchData --> DBOptimize{Optimized?}
    DBOptimize -->|Yes| FastQuery[Use indexes<br/>RLS optimized]
    DBOptimize -->|No| SlowQuery[Full table scan]
    
    FastQuery --> Return[Return data]
    SlowQuery --> Return
    
    Return --> CacheResponse[Cache static assets]
    CacheResponse --> Deliver[Deliver to client]
    
    ServeCache --> Deliver
    Deliver --> End([Response])
```

### Database Optimization

- **Indexes:** On family_id, child_id, date columns
- **RLS:** Optimized policies with function inlining
- **JSONB:** Efficient storage for category_points
- **Connection pooling:** Supabase manages pool
- **Prepared statements:** All queries parameterized

---

## Security Architecture

### Security Layers

```mermaid
flowchart TD
    Request([Client Request]) --> HTTPS{HTTPS?}
    HTTPS -->|No| Reject[Reject connection]
    HTTPS -->|Yes| Cookie{Valid cookie?}
    
    Cookie -->|No| Public{Public route?}
    Public -->|Yes| Allow[Allow access]
    Public -->|No| Redirect[Redirect to login]
    
    Cookie -->|Yes| ValidateSession[Validate session<br/>with Supabase]
    ValidateSession --> SessionValid{Valid?}
    
    SessionValid -->|No| ClearCookie[Clear cookie + redirect]
    SessionValid -->|Yes| CheckRLS[Check RLS policies]
    
    CheckRLS --> FamilyCheck{Belongs to family?}
    FamilyCheck -->|No| Deny[Return 403]
    FamilyCheck -->|Yes| RoleCheck{Has permission?}
    
    RoleCheck -->|No| Deny
    RoleCheck -->|Yes| Execute[Execute query]
    
    Execute --> Sanitize[Sanitize output]
    Sanitize --> Return[Return response]
    
    Reject --> End([End])
    Redirect --> End
    ClearCookie --> End
    Deny --> End
    Return --> End
    Allow --> End
```

---

## Future Architecture Enhancements

### Planned Improvements

1. **Real-time Sync:**
   ```mermaid
   graph LR
   Client1[Parent Device] --> Supabase[Supabase Realtime]
   Client2[Child Device] --> Supabase
   Supabase -.broadcast.-> Client1
   Supabase -.broadcast.-> Client2
   ```

2. **Caching Layer:**
   - Redis for API responses
   - Edge caching for static content
   - Service Worker for offline

3. **Microservices:**
   - Notification service (email/SMS)
   - Export service (PDF/CSV)
   - Analytics service

4. **Mobile Apps:**
   - React Native apps
   - Native database sync
   - Push notifications

---

**Architecture Version:** 1.0  
**Last Updated:** January 5, 2026  
**Related:** [Features](./FEATURES.md) | [Database](./DATABASE.md) | [API](./API.md) | [Deployment](./DEPLOYMENT.md)
