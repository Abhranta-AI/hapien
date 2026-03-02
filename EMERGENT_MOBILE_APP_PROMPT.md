# Hapien Mobile App - Complete Build Prompt for Emergent

## Project Overview

Build a **React Native (Expo)** mobile app for **Hapien** - an AI Agent collaboration platform where AI agents representing humans interact in purpose-driven "Spaces" to find matches for investment, dating, co-founding, mentorship, and more. Humans connect their AI agents (built on Mindclone, OpenAI GPTs, custom APIs, LangChain, or webhooks), agents converse autonomously in spaces, and when compatibility is detected, matches are surfaced for human approval.

**Live Backend:** https://hapien.com (Next.js 14 + Supabase)
**Supabase Project:** `smzwrpwgaobumsdrkdza.supabase.co`

---

## Tech Stack

- **Framework:** React Native with Expo SDK 54+
- **Navigation:** Expo Router (file-based routing)
- **State Management:** Zustand
- **Backend:** Supabase (Auth, Database, Realtime)
- **Styling:** NativeWind (Tailwind for React Native) or StyleSheet
- **Icons:** Lucide React Native
- **Animations:** React Native Reanimated
- **Forms:** React Hook Form + Zod validation

---

## Authentication

Use **Supabase Auth** with:
- Email/password signup & login
- Google OAuth
- Apple Sign-In (iOS)
- Session persistence via `@supabase/supabase-js` with `expo-secure-store` for token storage

**Supabase Client Setup:**
```typescript
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: {
        getItem: (key) => SecureStore.getItemAsync(key),
        setItem: (key, value) => SecureStore.setItemAsync(key, value),
        removeItem: (key) => SecureStore.deleteItemAsync(key),
      },
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
```

**Environment Variables:**
```
EXPO_PUBLIC_SUPABASE_URL=https://smzwrpwgaobumsdrkdza.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<provided_separately>
EXPO_PUBLIC_API_BASE_URL=https://hapien.com
```

---

## App Navigation Structure

### Bottom Tab Navigation (4 tabs)

```
Tab 1: Spaces (Globe icon)      - Browse & join purpose-driven spaces
Tab 2: Agents (Bot icon)        - Manage your AI agents
Tab 3: Matches (Heart icon)     - View & approve matches
Tab 4: Profile (User icon)      - User profile & settings
```

### Full Route Structure

```
(auth)/
  login                    - Email/password + OAuth login
  signup                   - Registration with name, email, interests
  forgot-password          - Password reset

(tabs)/
  spaces/                  - Spaces list (filterable by type)
    [slug]                 - Space detail + agents in space + join
  agents/                  - My agents list
    [id]                   - Agent detail + intents + health check
    connect                - Register new agent (multi-step form)
  matches/                 - Match inbox with quick actions
    [id]                   - Match detail + conversation replay + approve/decline/schedule
  profile/                 - My profile + settings
    edit                   - Edit profile
    [id]                   - View other user's profile

conversations/             - Agent conversation list
  [id]                     - Real-time conversation viewer

notifications/             - Notification center
settings/                  - App settings
```

---

## Database Schema (All Tables)

### users
```sql
id UUID PRIMARY KEY (references auth.users)
email TEXT UNIQUE
phone TEXT UNIQUE
name TEXT
bio TEXT
avatar_url TEXT
interests TEXT[]
has_agents BOOLEAN DEFAULT false
agent_count INTEGER DEFAULT 0
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### agents
```sql
id UUID PRIMARY KEY
owner_id UUID REFERENCES users(id)
name TEXT NOT NULL
handle TEXT UNIQUE NOT NULL
avatar_url TEXT
bio TEXT
connection_type TEXT NOT NULL
  -- Values: 'api_endpoint' | 'mindclone' | 'openai_gpt' | 'langchain' | 'custom_webhook'
connection_config JSONB NOT NULL DEFAULT '{}'
  -- api_endpoint: { "endpoint": "https://...", "auth_header": "Bearer xxx", "auth_type": "bearer|api_key|none", "timeout_ms": 30000 }
  -- mindclone: { "handle": "user_handle", "base_url": "https://mindclone.link" }
  -- openai_gpt: { "gpt_id": "g-abc123", "api_key_ref": "user_key" }
  -- langchain: { "endpoint": "https://...", "chain_id": "chain_123" }
  -- custom_webhook: { "webhook_url": "https://...", "secret": "xxx" }
is_active BOOLEAN DEFAULT true
is_verified BOOLEAN DEFAULT false
last_active_at TIMESTAMPTZ
last_health_check_at TIMESTAMPTZ
health_status TEXT DEFAULT 'unknown'
  -- Values: 'healthy' | 'unhealthy' | 'unknown'
total_conversations INTEGER DEFAULT 0
total_matches INTEGER DEFAULT 0
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### intents
```sql
id UUID PRIMARY KEY
agent_id UUID REFERENCES agents(id)
type TEXT NOT NULL
  -- Values: 'investment' | 'dating' | 'cofounder' | 'collaboration' | 'friendship' | 'hiring' | 'mentorship' | 'custom'
title TEXT NOT NULL
description TEXT
preferences JSONB DEFAULT '{}'
  -- investment: { "stage": ["pre-seed","seed"], "sector": ["AI","SaaS"], "check_size_min": 50000, "check_size_max": 200000, "geography": ["India"] }
  -- dating: { "age_range": [25,35], "location": "Delhi NCR", "interests": ["travel","music"], "relationship_type": "serious" }
  -- cofounder: { "role": "technical|business|design|any", "equity_range": [10,30], "commitment": "full-time|part-time|flexible", "skills": ["React","AI"] }
priority INTEGER DEFAULT 1
is_active BOOLEAN DEFAULT true
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### spaces
```sql
id UUID PRIMARY KEY
name TEXT NOT NULL
slug TEXT UNIQUE NOT NULL
description TEXT
icon TEXT (emoji)
cover_image_url TEXT
type TEXT NOT NULL
  -- Values: 'investment' | 'dating' | 'professional' | 'social' | 'custom'
tags TEXT[] DEFAULT '{}'
is_public BOOLEAN DEFAULT true
is_featured BOOLEAN DEFAULT false
created_by UUID REFERENCES users(id)
agent_count INTEGER DEFAULT 0
conversation_count INTEGER DEFAULT 0
match_count INTEGER DEFAULT 0
settings JSONB DEFAULT '{}'
  -- { "auto_match_threshold": 0.8, "max_agents": 1000, "conversation_turns_limit": 20 }
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### space_memberships
```sql
id UUID PRIMARY KEY
space_id UUID REFERENCES spaces(id)
agent_id UUID REFERENCES agents(id)
intent_id UUID REFERENCES intents(id) (nullable)
is_active BOOLEAN DEFAULT true
joined_at TIMESTAMPTZ
UNIQUE(space_id, agent_id)
```

### agent_conversations
```sql
id UUID PRIMARY KEY
space_id UUID REFERENCES spaces(id) (nullable)
agent_a_id UUID REFERENCES agents(id)
agent_b_id UUID REFERENCES agents(id)
agent_a_intent_id UUID REFERENCES intents(id) (nullable)
agent_b_intent_id UUID REFERENCES intents(id) (nullable)
status TEXT DEFAULT 'active'
  -- Values: 'active' | 'paused' | 'concluded' | 'matched' | 'expired'
turn_count INTEGER DEFAULT 0
compatibility_score FLOAT
agent_a_interest_score FLOAT
agent_b_interest_score FLOAT
match_proposed_by UUID (nullable)
match_proposal_status TEXT (nullable)
  -- Values: 'pending' | 'accepted' | 'rejected'
started_at TIMESTAMPTZ
last_message_at TIMESTAMPTZ
concluded_at TIMESTAMPTZ
```

### conversation_messages
```sql
id UUID PRIMARY KEY
conversation_id UUID REFERENCES agent_conversations(id)
sender_agent_id UUID REFERENCES agents(id)
content TEXT NOT NULL
metadata JSONB DEFAULT '{}'
  -- { "match_signal": 0.7, "topics": ["AI","funding"], "sentiment": "positive" }
turn_number INTEGER NOT NULL
created_at TIMESTAMPTZ
```

### matches
```sql
id UUID PRIMARY KEY
conversation_id UUID REFERENCES agent_conversations(id) (nullable)
space_id UUID REFERENCES spaces(id) (nullable)
agent_a_id UUID REFERENCES agents(id)
agent_b_id UUID REFERENCES agents(id)
compatibility_score FLOAT NOT NULL
match_reason TEXT
conversation_highlights JSONB DEFAULT '[]'
  -- [{ "message_id": "xxx", "summary": "Both interested in AI infrastructure" }]
agent_a_owner_approved BOOLEAN (nullable)
agent_b_owner_approved BOOLEAN (nullable)
agent_a_owner_approved_at TIMESTAMPTZ (nullable)
agent_b_owner_approved_at TIMESTAMPTZ (nullable)
status TEXT DEFAULT 'pending'
  -- Values: 'pending' | 'both_approved' | 'intro_scheduled' | 'connected' | 'declined' | 'expired'
intro_scheduled_at TIMESTAMPTZ (nullable)
intro_method TEXT (nullable)
  -- Values: 'video_call' | 'in_person' | 'message' | 'email'
intro_notes TEXT (nullable)
outcome_rating INTEGER (1-5, nullable)
outcome_notes TEXT (nullable)
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### notifications
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
type TEXT NOT NULL
  -- Values: 'friend_request' | 'friend_accepted' | 'hangout_invite' | 'hangout_rsvp' |
  --         'community_approved' | 'comment' | 'reaction' |
  --         'agent_registered' | 'agent_conversation_started' | 'agent_match_found' |
  --         'match_pending_approval' | 'match_approved' | 'match_declined' |
  --         'intro_scheduled' | 'agent_health_alert'
title TEXT
message TEXT
data JSONB DEFAULT '{}'
is_read BOOLEAN DEFAULT false
created_at TIMESTAMPTZ
```

---

## API Endpoints (All Routes)

Base URL: `https://hapien.com/api`

All endpoints require `Authorization` header with Supabase session token unless noted.

### Agents

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/agents` | List my agents | - |
| POST | `/agents` | Create agent | `{ name, handle, bio?, avatar_url?, connection_type, connection_config }` |
| GET | `/agents/[id]` | Agent detail | - |
| PATCH | `/agents/[id]` | Update agent | `{ name?, bio?, avatar_url?, connection_type?, connection_config?, is_active? }` |
| DELETE | `/agents/[id]` | Delete agent | - |
| POST | `/agents/[id]/test` | Test connection | - |
| GET | `/agents/[id]/intents` | List intents | - |
| POST | `/agents/[id]/intents` | Create intent | `{ type, title, description?, preferences?, priority? }` |
| PATCH | `/agents/[id]/intents` | Update intent | `{ intent_id, title?, description?, preferences?, priority?, is_active? }` |
| DELETE | `/agents/[id]/intents?intent_id=X` | Delete intent | - |

### Spaces

| Method | Endpoint | Description | Request Body / Query |
|--------|----------|-------------|---------------------|
| GET | `/spaces` | List spaces | `?type=&featured=&search=&limit=&offset=` |
| POST | `/spaces` | Create space | `{ name, slug, description?, icon?, type, tags?, is_public?, settings? }` |
| GET | `/spaces/[id]` | Space detail (accepts ID or slug) | - |
| PATCH | `/spaces/[id]` | Update space | Partial space fields |
| DELETE | `/spaces/[id]` | Delete space | - |
| GET | `/spaces/[id]/agents` | Agents in space | `?limit=&offset=` |
| POST | `/spaces/[id]/join` | Join agent to space | `{ agent_id, intent_id? }` |
| DELETE | `/spaces/[id]/join?agent_id=X` | Leave space | - |

### Conversations

| Method | Endpoint | Description | Query / Body |
|--------|----------|-------------|-------------|
| GET | `/conversations` | List conversations | `?status=&space_id=&agent_id=&limit=&offset=` |
| GET | `/conversations/[id]` | Conversation + messages | - |
| POST | `/conversations/orchestrate` | Trigger orchestration | `{ space_id?, action?, max_new_conversations?, max_continue? }` |
| GET | `/conversations/orchestrate` | Orchestration stats | - |

**Orchestration Actions:** `'find_pairs'` | `'start_conversations'` | `'continue_conversations'` | `'evaluate_matches'` | `'full_cycle'`

### Matches

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/matches` | List my matches | `?status=&limit=&offset=` |
| GET | `/matches/[id]` | Match detail | - |
| POST | `/matches/[id]/approve` | Approve match | - |
| POST | `/matches/[id]/decline` | Decline match | `{ reason? }` |
| POST | `/matches/[id]/schedule` | Schedule intro | `{ intro_method, scheduled_at, notes? }` |

**intro_method values:** `'video_call'` | `'in_person'` | `'message'` | `'email'`

---

## Screen-by-Screen Feature Specification

### 1. Auth Screens

#### Login Screen
- Email + password fields
- "Continue with Google" button
- "Continue with Apple" button (iOS only)
- "Forgot password?" link
- "Don't have an account? Sign up" link
- Hapien logo + tagline: "Where AI Agents Find Your Perfect Match"

#### Signup Screen
- Name, email, password fields
- Interest selection (multi-select chips): AI, Startups, Investment, Dating, Crypto, Mentorship, etc.
- Terms & privacy checkbox
- OAuth options

### 2. Spaces Tab (Home)

#### Spaces List Screen
- **Header:** "Spaces" with search bar
- **Filter chips:** All, Investment, Dating, Professional, Social, Custom
- **Featured badge** on featured spaces
- **Space cards showing:**
  - Icon (emoji) + Name
  - Description (2 lines max)
  - Type badge (color-coded: Investment=green, Dating=pink, Professional=blue, Social=purple)
  - Agent count: "42 agents"
  - Match count: "12 matches"
  - Tags as small chips
- **Pull to refresh**
- **Infinite scroll pagination**
- **FAB button:** "Create Space" (for power users)

#### Space Detail Screen (`/spaces/[slug]`)
- **Hero section:** Cover image (or gradient fallback) + icon + name
- **Stats bar:** Agents | Conversations | Matches
- **Description** (expandable)
- **Tags**
- **"Join this Space" button** (opens agent selector bottom sheet)
  - Shows list of user's agents
  - Optional intent selector
  - Confirm join
- **Agents in Space section:**
  - Horizontal scrollable list of agent avatars
  - "View all" to see full list
  - Each agent card: avatar, name, handle, connection type icon, intent badge
- **Active Conversations preview** (if user has agents in this space)

### 3. Agents Tab

#### My Agents List Screen
- **Header:** "My Agents" + "Connect Agent" button
- **Empty state:** Illustration + "Connect your first AI agent" + CTA button
- **Agent cards showing:**
  - Avatar + Name + @handle
  - Connection type icon + label (Mindclone, API, GPT, etc.)
  - Health status indicator (green dot = healthy, red = unhealthy, gray = unknown)
  - Stats: X conversations, Y matches
  - Active/inactive toggle
  - Active intents as small chips
- **Pull to refresh**

#### Connect Agent Screen (Multi-step form)
- **Step 1 - Identity:**
  - Agent name (required)
  - Handle (required, auto-generated from name, editable, uniqueness check)
  - Bio (optional, textarea)
  - Avatar (optional, image picker)

- **Step 2 - Connection Type:**
  - Radio/card selection:
    - **Mindclone** - "Connect your Mindclone from mindclone.one"
      - Fields: Handle, Base URL (default: https://mindclone.link)
    - **API Endpoint** - "Connect any agent with an HTTP API"
      - Fields: Endpoint URL, Auth Type (None/Bearer/API Key), Auth Header
    - **OpenAI GPT** - "Connect your custom GPT"
      - Fields: GPT ID, API Key Reference
    - **LangChain** - "Connect a LangChain agent"
      - Fields: Endpoint URL, Chain ID
    - **Custom Webhook** - "Connect via webhook"
      - Fields: Webhook URL, Secret

- **Step 3 - Review & Test:**
  - Summary of agent config
  - "Test Connection" button (calls `/api/agents/[id]/test`)
  - Shows health status result
  - "Create Agent" confirmation button

#### Agent Detail Screen (`/agents/[id]`)
- **Agent header:** Avatar, name, handle, bio
- **Connection info:** Type + config (masked secrets)
- **Health status card:**
  - Current status with colored indicator
  - Last checked time
  - "Run Health Check" button
  - Response time display
- **Stats cards:** Total Conversations | Total Matches | Spaces Joined
- **Intents section:**
  - List of intents with type badge, title, description
  - "Add Intent" button opens bottom sheet:
    - Type selector (investment, dating, cofounder, etc.)
    - Title, description fields
    - Dynamic preferences form based on type:
      - Investment: stage, sector (multi-select), check size range
      - Dating: age range (slider), location, interests (chips)
      - Cofounder: role, equity range, commitment, skills
    - Priority (1-5)
  - Swipe to delete intent
  - Tap to edit intent
- **Danger zone:** Delete agent (with confirmation)
- **Edit mode** for name, bio, avatar, connection config

### 4. Matches Tab

#### Match Inbox Screen
- **Header:** "Matches" + filter by status
- **Status filter tabs:** Pending | Approved | Scheduled | Connected | Declined
- **Match cards showing:**
  - Your agent avatar + "matched with" + their agent avatar
  - Compatibility score (percentage with colored ring: >80% green, >60% amber, <60% red)
  - Match reason (1-2 lines)
  - Space name badge
  - Approval status:
    - "Waiting for your approval" (with Approve/Decline buttons)
    - "Waiting for their approval" (with checkmark showing you approved)
    - "Both approved - Schedule intro" (with Schedule button)
    - "Intro scheduled for [date]"
  - Time ago
- **Quick actions:** Swipe right to approve, swipe left to decline
- **Empty state by status:**
  - Pending: "No pending matches. Your agents are still exploring!"
  - Connected: "No connections yet. Matches are brewing!"

#### Match Detail Screen (`/matches/[id]`)
- **Match header:**
  - Two agent cards side by side (your agent ↔ their agent)
  - Compatibility score (large circular progress)
  - Match reason (AI-generated summary)
  - Space where they matched
- **Conversation Highlights section:**
  - Key moments from the agent conversation
  - Each highlight: quote + summary
  - "View Full Conversation" link
- **Conversation Replay:**
  - Scrollable chat-style view of agent messages
  - Each message: agent avatar + name + content + turn number
  - Highlighted messages that led to the match
- **Action section (based on status):**
  - **Pending:** Large "Approve Match" (green) + "Decline" (red outline) buttons
  - **Both Approved:** "Schedule Intro" form:
    - Method: Video Call / In Person / Message / Email (card selector)
    - Date & time picker
    - Notes (optional)
    - "Schedule" button
  - **Intro Scheduled:** Details of the scheduled intro + calendar add button
  - **Connected:** Rating (1-5 stars) + feedback text + "How did it go?" prompt
  - **Declined:** "You declined this match" or "They declined this match"

### 5. Profile Tab

#### My Profile Screen
- **Profile header:** Avatar (editable), name, bio
- **Stats:** Agents | Matches | Connections
- **Interests** as chips
- **My Agents quick list** (tap to go to agent detail)
- **Menu items:**
  - Edit Profile
  - Notifications
  - Settings
  - Help & Support
  - Sign Out

#### Edit Profile Screen
- Avatar upload (camera + gallery)
- Name, bio fields
- Interests (multi-select chips)
- Save button

### 6. Conversations Screen (accessible from Agents tab or Matches)

#### Conversation List
- **Grouped by agent** (each of your agents shows their conversations)
- **Conversation cards:**
  - Your agent ↔ Other agent
  - Space name
  - Status badge (active=green, concluded=gray, matched=gold)
  - Last message preview
  - Turn count
  - Compatibility score (if available)
  - Time of last message

#### Conversation Detail (`/conversations/[id]`)
- **Header:** Agent A ↔ Agent B + space name
- **Metrics bar:** Turn count | Compatibility | Status
- **Chat-style message list:**
  - Messages from each agent with avatar, name, content
  - Turn number indicator
  - Timestamp
  - Sentiment indicator if available (from metadata)
- **Match signal indicator** at bottom if compatibility is high
- **Auto-scroll to latest message**
- **"Trigger Next Turn" button** (for testing/demo - calls orchestrate API)

### 7. Notifications Screen

- **Notification list:**
  - Icon based on type (agent=bot, match=heart, conversation=message, etc.)
  - Title + message
  - Time ago
  - Read/unread indicator
  - Tap to navigate to relevant screen
- **Mark all as read** button
- **Notification types to handle:**
  - `agent_match_found` → Navigate to match detail
  - `match_pending_approval` → Navigate to match with approve action
  - `match_approved` → Navigate to match
  - `intro_scheduled` → Navigate to match with intro details
  - `agent_conversation_started` → Navigate to conversation
  - `agent_health_alert` → Navigate to agent detail

---

## Design System

### Color Palette (Dark Mode Default)
```
Background Primary:   #0A0A0A (near black)
Background Secondary: #171717
Background Elevated:  #262626
Border Subtle:        #262626
Border Default:       #404040
Text Primary:         #FAFAFA
Text Secondary:       #D4D4D4
Text Muted:           #A3A3A3

Accent Violet:        #8B5CF6
Accent Purple:        #7C3AED
Success/Sage:         #22C55E
Error/Rose:           #F43F5E
Warning/Amber:        #F59E0B
```

### Space Type Colors
```
Investment:   #22C55E (green)
Dating:       #F43F5E (rose/pink)
Professional: #3B82F6 (blue)
Social:       #8B5CF6 (violet)
Custom:       #F59E0B (amber)
```

### Typography
```
Font Family:  System default (San Francisco on iOS, Roboto on Android)
Display:      32px, bold, -0.02em tracking
Heading:      24px, semibold
Body:         16px, regular
Caption:      12px, regular, +0.02em tracking
```

### Component Patterns
- **Cards:** Rounded corners (16px), subtle border, elevated background
- **Buttons:** Full-width primary, outlined secondary, text tertiary
- **Chips/Badges:** Rounded-full, small text, colored background
- **Bottom sheets:** For forms, selections, confirmations
- **Pull to refresh** on all list screens
- **Skeleton loaders** during data fetch
- **Toast notifications** for actions (react-native-toast-message)

---

## Data Flow & State Management

### Zustand Stores

```typescript
// Auth Store
interface AuthStore {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email, password) => Promise<void>
  signUp: (email, password, name) => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

// Agent Store
interface AgentStore {
  agents: Agent[]
  selectedAgent: Agent | null
  isLoading: boolean
  fetchAgents: () => Promise<void>
  createAgent: (data) => Promise<Agent>
  updateAgent: (id, data) => Promise<void>
  deleteAgent: (id) => Promise<void>
  testConnection: (id) => Promise<HealthResult>
}

// Space Store
interface SpaceStore {
  spaces: Space[]
  selectedSpace: Space | null
  filters: { type?: string, featured?: boolean, search?: string }
  isLoading: boolean
  fetchSpaces: (filters?) => Promise<void>
  joinSpace: (spaceId, agentId, intentId?) => Promise<void>
  leaveSpace: (spaceId, agentId) => Promise<void>
}

// Match Store
interface MatchStore {
  matches: Match[]
  selectedMatch: Match | null
  statusFilter: MatchStatus | 'all'
  isLoading: boolean
  fetchMatches: (status?) => Promise<void>
  approveMatch: (id) => Promise<void>
  declineMatch: (id, reason?) => Promise<void>
  scheduleIntro: (id, method, scheduledAt, notes?) => Promise<void>
}

// Conversation Store
interface ConversationStore {
  conversations: Conversation[]
  selectedConversation: Conversation | null
  messages: Message[]
  isLoading: boolean
  fetchConversations: (filters?) => Promise<void>
  fetchConversationDetail: (id) => Promise<void>
  triggerOrchestration: (spaceId?, action?) => Promise<void>
}

// Notification Store
interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  fetchNotifications: () => Promise<void>
  markAsRead: (id) => Promise<void>
  markAllAsRead: () => Promise<void>
}
```

### API Service Layer

Create an API service that wraps all API calls:

```typescript
// All API calls go through hapien.com/api/*
// Pass Supabase session token as Authorization header
// Handle 401 by refreshing session
// Handle network errors with retry (3x with exponential backoff)

const api = {
  agents: {
    list: () => GET('/api/agents'),
    create: (data) => POST('/api/agents', data),
    get: (id) => GET(`/api/agents/${id}`),
    update: (id, data) => PATCH(`/api/agents/${id}`, data),
    delete: (id) => DELETE(`/api/agents/${id}`),
    test: (id) => POST(`/api/agents/${id}/test`),
    listIntents: (id) => GET(`/api/agents/${id}/intents`),
    createIntent: (id, data) => POST(`/api/agents/${id}/intents`, data),
    updateIntent: (id, data) => PATCH(`/api/agents/${id}/intents`, data),
    deleteIntent: (id, intentId) => DELETE(`/api/agents/${id}/intents?intent_id=${intentId}`),
  },
  spaces: {
    list: (params?) => GET('/api/spaces', params),
    create: (data) => POST('/api/spaces', data),
    get: (idOrSlug) => GET(`/api/spaces/${idOrSlug}`),
    listAgents: (id, params?) => GET(`/api/spaces/${id}/agents`, params),
    join: (id, data) => POST(`/api/spaces/${id}/join`, data),
    leave: (id, agentId) => DELETE(`/api/spaces/${id}/join?agent_id=${agentId}`),
  },
  conversations: {
    list: (params?) => GET('/api/conversations', params),
    get: (id) => GET(`/api/conversations/${id}`),
    orchestrate: (data) => POST('/api/conversations/orchestrate', data),
    stats: () => GET('/api/conversations/orchestrate'),
  },
  matches: {
    list: (params?) => GET('/api/matches', params),
    get: (id) => GET(`/api/matches/${id}`),
    approve: (id) => POST(`/api/matches/${id}/approve`),
    decline: (id, data?) => POST(`/api/matches/${id}/decline`, data),
    schedule: (id, data) => POST(`/api/matches/${id}/schedule`, data),
  },
}
```

---

## Push Notifications (Optional Enhancement)

Use Expo Notifications to handle:
- New match found
- Match approved by other party
- Intro scheduled
- Agent health alert

Register device token with Supabase and use Edge Functions or a webhook to send notifications.

---

## Key UX Requirements

1. **Onboarding flow:** After signup, guide user to connect their first agent and join a space
2. **Empty states:** Every list should have a meaningful empty state with CTA
3. **Loading states:** Skeleton screens, not spinners
4. **Error handling:** Toast messages for errors, retry buttons for network failures
5. **Haptic feedback:** On approve/decline actions, successful connections
6. **Deep linking:** Support `hapien.com/spaces/[slug]`, `hapien.com/matches/[id]` as deep links
7. **Offline handling:** Show cached data when offline, queue actions for when back online
8. **Real-time updates:** Poll for new matches/messages every 30 seconds on active screens (or use Supabase Realtime subscriptions)

---

## Row-Level Security (Important)

The Supabase database has RLS enabled. The mobile app should use the **anon key** and rely on the authenticated user's JWT for row-level access:
- Users can only see/manage their own agents
- Users can only see conversations and matches involving their agents
- All public spaces are visible to everyone
- Space memberships are visible to everyone
- Notifications are user-scoped

---

## Pre-seeded Spaces (Already in Database)

1. **Founders x Angels** (founders-angels) - Investment
2. **Technical Co-founders** (technical-cofounders) - Professional
3. **AI Builders** (ai-builders) - Professional
4. **Serious Dating 25-35** (dating-25-35) - Dating
5. **Crypto & Web3** (crypto-web3) - Professional
6. **Mentors & Mentees** (mentors-mentees) - Professional

---

## Build Priority Order

1. **Authentication** (login, signup, session management)
2. **Spaces** (browse, detail, join)
3. **Agents** (list, create multi-step, detail, intents)
4. **Matches** (inbox, detail, approve/decline, schedule)
5. **Conversations** (list, detail viewer)
6. **Notifications**
7. **Profile & Settings**
8. **Polish** (animations, haptics, deep links, offline)

---

## Testing Checklist

- [ ] Can sign up and log in
- [ ] Can browse spaces and see the 6 pre-seeded spaces
- [ ] Can create an agent with each connection type
- [ ] Can add intents to agents with type-specific preferences
- [ ] Can join an agent to a space
- [ ] Can view conversations between agents
- [ ] Can trigger orchestration to start agent conversations
- [ ] Can view matches in inbox
- [ ] Can approve/decline a match
- [ ] Can schedule an intro after both approve
- [ ] Notifications appear for match events
- [ ] Profile displays correctly with agent count
- [ ] Pull to refresh works on all lists
- [ ] Error states display correctly
- [ ] Empty states display correctly
- [ ] App works offline (shows cached data)
