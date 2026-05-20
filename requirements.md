# requirements.md

# Soccer Tournament Management Platform — Complete Requirements Specification

---

# 1. Project Overview

The goal of this project is to build a scalable soccer tournament management platform capable of supporting:

* Multiple tournaments
* Multiple divisions and leagues
* Team/player management
* Match scheduling
* Standings and statistics
* Knockout brackets
* Referee and venue management
* Admin dashboards
* Real-time updates
* Future expansion into mobile apps and analytics systems

The system should support:

* Small local tournaments
* Seasonal leagues
* School competitions
* Large multi-division tournaments
* International events

The platform architecture should prioritize:

* Scalability
* Maintainability
* Modularity
* Real-time capabilities
* Clean relational database design
* Static frontend deployment compatibility

---

# 2. Tech Stack & Tooling

## Required

* TypeScript

  * Strict mode preferred
  * No implicit `any` in new code

* React

  * Function components only
  * Hooks-based architecture

* Tailwind CSS

  * Utility-first styling
  * Compatible with 21st.dev components

* Static frontend build

  * Must deploy to:

    * Vercel
    * Netlify
    * GitHub Pages
    * Static hosting providers

* Prisma ORM

  * Required for database interactions

* PostgreSQL

  * Primary relational database

---

## Recommended Defaults

### Frontend

* Vite
* React
* @vitejs/plugin-react
* React Router
* Zustand or Redux
* Socket.IO Client

### Backend

* Node.js
* NestJS preferred
* Express acceptable
* REST API or GraphQL
* WebSockets for real-time updates

### Hosting

Frontend:

* Vercel preferred

Backend:

* Railway
* Render
* AWS

Database:

* Supabase PostgreSQL
* Neon PostgreSQL

Storage:

* AWS S3
* Cloudflare R2

---

# 3. System Goals

The platform must support:

* Tournament registration
* Division management
* Team registration
* Player roster management
* Match scheduling
* Live score updates
* League standings
* Knockout brackets
* Referee assignment
* Venue management
* Admin permissions
* Statistics tracking
* Real-time updates

---

# 4. Information Architecture & Routing

# Public Routes

## Home Pages

```txt
/
/about
/contact
/news
/gallery
/rules
```

---

## Tournament Pages

```txt
/tournaments
/tournaments/:tournamentSlug
```

Tournament Overview Page Must Include:

* Tournament banner/logo
* Tournament description
* Tournament rules
* Tournament dates
* Tournament location
* Tournament status
* Division listings
* Featured matches
* Latest results
* Top scorers
* Upcoming fixtures
* Venue information
* Sponsor/media section

---

# Division Pages (VERY IMPORTANT)

Each division MUST have its own dedicated page.

Example:

```txt
/tournaments/:tournamentSlug/divisions/:divisionSlug
```

Each Division Page Must Include:

## Overview Section

* Division name
* Age group
* Gender category
* Format
* Number of teams
* Current stage

---

## Standings Table

* Rank
* Team name/logo
* Matches played
* Wins
* Draws
* Losses
* Goals for
* Goals against
* Goal difference
* Points

---

## Division Schedule

* Full fixture list
* Match times
* Match dates
* Venue/field
* Home team
* Away team
* Match status
* Live score
* Referees

Schedule should support:

* Daily filtering
* Matchday filtering
* Team filtering
* Live updates
* Responsive mobile layout

---

## Match Results Section

* Completed matches
* Scores
* Match events
* Goal scorers
* Cards
* Match summaries

---

## Bracket Section (if knockout enabled)

* Quarter finals
* Semi finals
* Finals
* Consolation brackets
* Automatic progression

---

## Teams Section

* Team cards/list
* Team logos
* Team records
* Team detail links

---

## Statistics Section

* Top scorers
* Most assists
* Clean sheets
* Discipline rankings

---

## Media/Updates Section

* Announcements
* Photos
* Highlights
* News updates

---

# Match Pages

```txt
/matches
/matches/:matchId
```

Match Detail Page Must Include:

* Home team
* Away team
* Score
* Match status
* Venue
* Field
* Referees
* Match timeline
* Match events
* Starting lineups
* Player statistics
* Live updates
* Match commentary
* Photos/videos

---

# Team Pages

```txt
/teams
/teams/:teamSlug
```

Team Page Must Include:

* Team profile
* Team logo
* Division
* Coach information
* Team roster
* Team statistics
* Match history
* Upcoming matches
* Team standings position
* Team gallery

---

# Player Pages

```txt
/players
/players/:playerSlug
```

Player Page Must Include:

* Player profile
* Jersey number
* Position
* Team
* Statistics
* Match history
* Goals
* Assists
* Cards
* Player image

---

# Venue Pages

```txt
/venues
/venues/:venueSlug
```

Venue Page Must Include:

* Venue details
* Address
* Fields
* Upcoming matches
* Map integration
* Parking info
* Photos

---

# Bracket Pages

```txt
/brackets
/brackets/:divisionSlug
```

Bracket Page Must Include:

* Interactive bracket visualization
* Match progression
* Team advancement
* Live updates

---

# Schedule Pages

```txt
/schedule
/schedule/:divisionSlug
```

Schedule Page Must Include:

* Daily schedules
* Filters
* Venue filtering
* Team filtering
* Live status indicators
* Printable schedule layout

---

# Standings Pages

```txt
/standings
/standings/:divisionSlug
```

Standings Page Must Include:

* Full standings table
* Tie-breaker logic
* Form indicators
* Team links
* Live updates

---

# Statistics Pages

```txt
/stats
/stats/top-scorers
/stats/top-assists
/stats/discipline
```

Statistics Pages Must Include:

* Leaderboards
* Filters by tournament/division
* Player rankings
* Team rankings

---

# Authentication Pages

```txt
/login
/register
/forgot-password
/reset-password
```

---

# Admin Routes

```txt
/admin
/admin/dashboard
/admin/tournaments
/admin/divisions
/admin/teams
/admin/players
/admin/matches
/admin/schedules
/admin/standings
/admin/brackets
/admin/venues
/admin/referees
/admin/media
/admin/users
/admin/settings
```

---

# Admin Dashboard Requirements

The admin dashboard must support:

* Tournament creation/editing
* Division management
* Team approvals
* Match scheduling
* Live score management
* Referee assignments
* Venue management
* Bracket generation
* Standings recalculation
* Media uploads
* User management
* Permissions management
* Audit logs
* Real-time updates

---

# 5. Core Entities

## User

Fields:

* id
* first_name
* last_name
* email
* password_hash
* phone
* role
* profile_image
* created_at
* updated_at

Roles:

* ADMIN
* TOURNAMENT_ADMIN
* COACH
* REFEREE
* PLAYER
* VIEWER

---

## Tournament

Fields:

* id
* name
* slug
* description
* start_date
* end_date
* location
* status
* tournament_type
* logo
* rules
* created_by

Tournament Types:

* ROUND_ROBIN
* KNOCKOUT
* GROUP_STAGE_PLUS_KNOCKOUT
* LEAGUE
* HYBRID

---

## Division

Fields:

* id
* tournament_id
* name
* slug
* age_group
* gender
* max_teams
* format
* points_win
* points_draw
* points_loss

Examples:

* U10 Boys
* U14 Girls
* Premier Division
* Open Men

---

## Team

Fields:

* id
* division_id
* name
* slug
* logo
* city
* founded_year
* primary_color
* secondary_color
* created_by

---

## Player

Fields:

* id
* first_name
* last_name
* slug
* dob
* nationality
* jersey_number
* preferred_position
* profile_image

---

## TeamRoster

Fields:

* id
* team_id
* player_id
* season
* active
* joined_at

---

## Match

Fields:

* id
* tournament_id
* division_id
* home_team_id
* away_team_id
* venue_id
* referee_id
* stage_id
* scheduled_start
* scheduled_end
* status
* round
* match_type
* home_score
* away_score

Statuses:

* SCHEDULED
* LIVE
* COMPLETED
* POSTPONED
* CANCELLED

---

## MatchEvent

Fields:

* id
* match_id
* player_id
* team_id
* type
* minute
* extra_time

Event Types:

* GOAL
* OWN_GOAL
* YELLOW_CARD
* RED_CARD
* SUBSTITUTION
* PENALTY
* ASSIST

---

## Standings

Fields:

* id
* division_id
* team_id
* played
* wins
* draws
* losses
* goals_for
* goals_against
* goal_difference
* points
* rank

---

# 6. Operational Flows

## Team Registration Flow

```txt
Admin Creates Tournament
        ↓
Admin Creates Divisions
        ↓
Teams Register
        ↓
Players Added to Rosters
        ↓
Coaches Assigned
```

---

## Scheduling Flow

```txt
Division Created
        ↓
Generate Fixtures
        ↓
Assign Venues & Referees
        ↓
Publish Schedule
```

---

## Match Day Flow

```txt
Match Starts
        ↓
Live Events Recorded
        ↓
Scores Updated
        ↓
Match Completed
        ↓
Standings Auto-Recalculated
        ↓
Bracket Advancement Updated
```

---

# 7. Real-Time Requirements

The system should support:

* Live match updates
* Live standings
* Real-time admin changes
* Live bracket updates
* Notifications
* Auto-refresh schedules
* Live score widgets

Recommended:

* Socket.IO
* WebSockets

---

# 8. Scalability Requirements

## Must Support

* Multiple simultaneous tournaments
* Large team counts
* High match volumes
* Real-time concurrent users

---

## Architecture Principles

* UUIDs for all primary keys
* Modular services
* Configurable tournament rules
* Event-driven backend architecture
* Separation of concerns

---

## Example Event Flow

```txt
MATCH_COMPLETED
    ↓
Update Standings Service
    ↓
Update Stats Service
    ↓
Update Bracket Service
    ↓
Send Notifications
```

---

# 9. Recommended Database Tables

```txt
users
organizations
tournaments
divisions
teams
players
team_rosters
coaches
team_coaches
matches
match_events
stages
bracket_nodes
venues
fields
referees
match_referees
standings
player_stats
tournament_admins
notifications
media
audit_logs
```

---

# 10. Frontend Requirements

## UI/UX Requirements

* Responsive design
* Mobile-first support
* Fast page loads
* Accessible navigation
* Reusable UI components
* Consistent design system
* Dark/light mode support
* Interactive tables
* Real-time updating widgets
* Optimized tournament browsing

---

# 11. Backend Requirements

## API Requirements

* REST or GraphQL
* Authentication
* Authorization
* CRUD endpoints
* Real-time websocket events

---

## Security Requirements

* Password hashing
* JWT authentication
* Role-based access control
* Input validation
* Rate limiting
* CSRF protection
* Secure file uploads

---

# 12. Deployment Requirements

Frontend must generate static build output.

Example:

```bash
npm run build
```

Output:

```txt
dist/
```

Must be deployable to:

* Vercel
* Netlify
* GitHub Pages

---

# 13. Future Expansion Goals

Future support may include:

* Mobile applications
* Push notifications
* Payment systems
* Online registration
* Media galleries
* Video highlights
* Advanced analytics
* Heatmaps
* Possession tracking
* AI/statistical insights
* Tournament livestream integration

---

# 14. Final Architecture Summary

```txt
Multi-Tenant Tournament Platform
            ↓
Tournament
            ↓
Division
            ↓
Teams
            ↓
Matches
            ↓
Standings + Brackets + Stats
```

Architecture Goals:

* Modular
* Scalable
* Relationally clean
* PostgreSQL + Prisma optimized
* Real-time ready
* Mobile extensible
* Future-proof
