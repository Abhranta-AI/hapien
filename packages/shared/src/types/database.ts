export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string
          owner_id: string
          name: string
          handle: string
          avatar_url: string | null
          bio: string | null
          connection_type: AgentConnectionType
          connection_config: AgentConnectionConfig
          is_active: boolean
          is_verified: boolean
          last_active_at: string | null
          last_health_check_at: string | null
          health_status: AgentHealthStatus
          total_conversations: number
          total_matches: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          handle: string
          avatar_url?: string | null
          bio?: string | null
          connection_type: AgentConnectionType
          connection_config: AgentConnectionConfig
          is_active?: boolean
          is_verified?: boolean
          last_active_at?: string | null
          last_health_check_at?: string | null
          health_status?: AgentHealthStatus
          total_conversations?: number
          total_matches?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          handle?: string
          avatar_url?: string | null
          bio?: string | null
          connection_type?: AgentConnectionType
          connection_config?: AgentConnectionConfig
          is_active?: boolean
          is_verified?: boolean
          last_active_at?: string | null
          last_health_check_at?: string | null
          health_status?: AgentHealthStatus
          total_conversations?: number
          total_matches?: number
          created_at?: string
          updated_at?: string
        }
      }
      intents: {
        Row: {
          id: string
          agent_id: string
          type: IntentType
          title: string
          description: string | null
          preferences: IntentPreferences
          priority: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          type: IntentType
          title: string
          description?: string | null
          preferences?: IntentPreferences
          priority?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          type?: IntentType
          title?: string
          description?: string | null
          preferences?: IntentPreferences
          priority?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      spaces: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon: string | null
          cover_image_url: string | null
          type: SpaceType
          tags: string[]
          is_public: boolean
          is_featured: boolean
          created_by: string | null
          agent_count: number
          conversation_count: number
          match_count: number
          settings: SpaceSettings
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          cover_image_url?: string | null
          type: SpaceType
          tags?: string[]
          is_public?: boolean
          is_featured?: boolean
          created_by?: string | null
          agent_count?: number
          conversation_count?: number
          match_count?: number
          settings?: SpaceSettings
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          cover_image_url?: string | null
          type?: SpaceType
          tags?: string[]
          is_public?: boolean
          is_featured?: boolean
          created_by?: string | null
          agent_count?: number
          conversation_count?: number
          match_count?: number
          settings?: SpaceSettings
          created_at?: string
          updated_at?: string
        }
      }
      space_memberships: {
        Row: {
          id: string
          space_id: string
          agent_id: string
          intent_id: string | null
          is_active: boolean
          joined_at: string
        }
        Insert: {
          id?: string
          space_id: string
          agent_id: string
          intent_id?: string | null
          is_active?: boolean
          joined_at?: string
        }
        Update: {
          id?: string
          space_id?: string
          agent_id?: string
          intent_id?: string | null
          is_active?: boolean
          joined_at?: string
        }
      }
      agent_conversations: {
        Row: {
          id: string
          space_id: string | null
          agent_a_id: string
          agent_b_id: string
          agent_a_intent_id: string | null
          agent_b_intent_id: string | null
          status: ConversationStatus
          turn_count: number
          compatibility_score: number | null
          agent_a_interest_score: number | null
          agent_b_interest_score: number | null
          match_proposed_by: string | null
          match_proposal_status: MatchProposalStatus | null
          started_at: string
          last_message_at: string | null
          concluded_at: string | null
        }
        Insert: {
          id?: string
          space_id?: string | null
          agent_a_id: string
          agent_b_id: string
          agent_a_intent_id?: string | null
          agent_b_intent_id?: string | null
          status?: ConversationStatus
          turn_count?: number
          compatibility_score?: number | null
          agent_a_interest_score?: number | null
          agent_b_interest_score?: number | null
          match_proposed_by?: string | null
          match_proposal_status?: MatchProposalStatus | null
          started_at?: string
          last_message_at?: string | null
          concluded_at?: string | null
        }
        Update: {
          id?: string
          space_id?: string | null
          agent_a_id?: string
          agent_b_id?: string
          agent_a_intent_id?: string | null
          agent_b_intent_id?: string | null
          status?: ConversationStatus
          turn_count?: number
          compatibility_score?: number | null
          agent_a_interest_score?: number | null
          agent_b_interest_score?: number | null
          match_proposed_by?: string | null
          match_proposal_status?: MatchProposalStatus | null
          started_at?: string
          last_message_at?: string | null
          concluded_at?: string | null
        }
      }
      conversation_messages: {
        Row: {
          id: string
          conversation_id: string
          sender_agent_id: string
          content: string
          metadata: MessageMetadata
          turn_number: number
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_agent_id: string
          content: string
          metadata?: MessageMetadata
          turn_number: number
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_agent_id?: string
          content?: string
          metadata?: MessageMetadata
          turn_number?: number
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          conversation_id: string | null
          space_id: string | null
          agent_a_id: string
          agent_b_id: string
          compatibility_score: number
          match_reason: string | null
          conversation_highlights: ConversationHighlight[]
          agent_a_owner_approved: boolean | null
          agent_b_owner_approved: boolean | null
          agent_a_owner_approved_at: string | null
          agent_b_owner_approved_at: string | null
          status: MatchStatus
          intro_scheduled_at: string | null
          intro_method: IntroMethod | null
          intro_notes: string | null
          outcome_rating: number | null
          outcome_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id?: string | null
          space_id?: string | null
          agent_a_id: string
          agent_b_id: string
          compatibility_score: number
          match_reason?: string | null
          conversation_highlights?: ConversationHighlight[]
          agent_a_owner_approved?: boolean | null
          agent_b_owner_approved?: boolean | null
          agent_a_owner_approved_at?: string | null
          agent_b_owner_approved_at?: string | null
          status?: MatchStatus
          intro_scheduled_at?: string | null
          intro_method?: IntroMethod | null
          intro_notes?: string | null
          outcome_rating?: number | null
          outcome_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string | null
          space_id?: string | null
          agent_a_id?: string
          agent_b_id?: string
          compatibility_score?: number
          match_reason?: string | null
          conversation_highlights?: ConversationHighlight[]
          agent_a_owner_approved?: boolean | null
          agent_b_owner_approved?: boolean | null
          agent_a_owner_approved_at?: string | null
          agent_b_owner_approved_at?: string | null
          status?: MatchStatus
          intro_scheduled_at?: string | null
          intro_method?: IntroMethod | null
          intro_notes?: string | null
          outcome_rating?: number | null
          outcome_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string | null
          phone: string | null
          name: string | null
          bio: string | null
          avatar_url: string | null
          interests: string[] | null
          is_admin: boolean | null
          has_agents: boolean
          agent_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          phone?: string | null
          name?: string | null
          bio?: string | null
          avatar_url?: string | null
          interests?: string[] | null
          has_agents?: boolean
          agent_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          phone?: string | null
          name?: string | null
          bio?: string | null
          avatar_url?: string | null
          interests?: string[] | null
          has_agents?: boolean
          agent_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      friendships: {
        Row: {
          id: string
          requester_id: string
          addressee_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          addressee_id: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          addressee_id?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      communities: {
        Row: {
          id: string
          name: string
          location: {
            address: string
            lat: number
            lng: number
            city?: string
            state?: string
          } | null
          description: string | null
          cover_image_url: string | null
          admin_id: string
          member_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          location?: {
            address: string
            lat: number
            lng: number
            city?: string
            state?: string
          } | null
          description?: string | null
          cover_image_url?: string | null
          admin_id: string
          member_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: {
            address: string
            lat: number
            lng: number
            city?: string
            state?: string
          } | null
          description?: string | null
          cover_image_url?: string | null
          admin_id?: string
          member_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      community_memberships: {
        Row: {
          id: string
          user_id: string
          community_id: string
          status: 'pending' | 'approved' | 'rejected'
          role: 'member' | 'admin'
          joined_at: string
        }
        Insert: {
          id?: string
          user_id: string
          community_id: string
          status?: 'pending' | 'approved' | 'rejected'
          role?: 'member' | 'admin'
          joined_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          community_id?: string
          status?: 'pending' | 'approved' | 'rejected'
          role?: 'member' | 'admin'
          joined_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string | null
          media_urls: string[] | null
          visibility: 'friends' | 'friends_communities' | 'community_only'
          community_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content?: string | null
          media_urls?: string[] | null
          visibility?: 'friends' | 'friends_communities' | 'community_only'
          community_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string | null
          media_urls?: string[] | null
          visibility?: 'friends' | 'friends_communities' | 'community_only'
          community_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      hangouts: {
        Row: {
          id: string
          host_id: string
          community_id: string
          title: string
          description: string | null
          category: 'sports' | 'food' | 'shopping' | 'learning' | 'chill'
          location: {
            address: string
            lat: number
            lng: number
            place_name?: string
          } | null
          date_time: string
          max_participants: number | null
          visibility: 'friends' | 'community' | 'public_in_community'
          status: 'upcoming' | 'completed' | 'cancelled'
          cover_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          host_id: string
          community_id: string
          title: string
          description?: string | null
          category: 'sports' | 'food' | 'shopping' | 'learning' | 'chill'
          location?: {
            address: string
            lat: number
            lng: number
            place_name?: string
          } | null
          date_time: string
          max_participants?: number | null
          visibility?: 'friends' | 'community' | 'public_in_community'
          status?: 'upcoming' | 'completed' | 'cancelled'
          cover_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          host_id?: string
          community_id?: string
          title?: string
          description?: string | null
          category?: 'sports' | 'food' | 'shopping' | 'learning' | 'chill'
          location?: {
            address: string
            lat: number
            lng: number
            place_name?: string
          } | null
          date_time?: string
          max_participants?: number | null
          visibility?: 'friends' | 'community' | 'public_in_community'
          status?: 'upcoming' | 'completed' | 'cancelled'
          cover_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      hangout_rsvps: {
        Row: {
          id: string
          hangout_id: string
          user_id: string
          status: 'interested' | 'going'
          created_at: string
        }
        Insert: {
          id?: string
          hangout_id: string
          user_id: string
          status: 'interested' | 'going'
          created_at?: string
        }
        Update: {
          id?: string
          hangout_id?: string
          user_id?: string
          status?: 'interested' | 'going'
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          user_id: string
          post_id: string | null
          hangout_id: string | null
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id?: string | null
          hangout_id?: string | null
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string | null
          hangout_id?: string | null
          content?: string
          created_at?: string
        }
      }
      reactions: {
        Row: {
          id: string
          user_id: string
          post_id: string | null
          type: 'like' | 'love' | 'celebrate'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id?: string | null
          type: 'like' | 'love' | 'celebrate'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string | null
          type?: 'like' | 'love' | 'celebrate'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience types
export type User = Tables<'users'>
export type Friendship = Tables<'friendships'>
export type Community = Tables<'communities'>
export type CommunityMembership = Tables<'community_memberships'>
export type Post = Tables<'posts'>
export type Hangout = Tables<'hangouts'>
export type HangoutRsvp = Tables<'hangout_rsvps'>
export type Comment = Tables<'comments'>
export type Reaction = Tables<'reactions'>

// Agent collaboration types
export type Agent = Tables<'agents'>
export type Intent = Tables<'intents'>
export type Space = Tables<'spaces'>
export type SpaceMembership = Tables<'space_memberships'>
export type AgentConversation = Tables<'agent_conversations'>
export type ConversationMessage = Tables<'conversation_messages'>
export type Match = Tables<'matches'>

// Insert types for agent collaboration
export type AgentInsert = InsertTables<'agents'>
export type IntentInsert = InsertTables<'intents'>
export type SpaceInsert = InsertTables<'spaces'>
export type SpaceMembershipInsert = InsertTables<'space_memberships'>
export type AgentConversationInsert = InsertTables<'agent_conversations'>
export type ConversationMessageInsert = InsertTables<'conversation_messages'>
export type MatchInsert = InsertTables<'matches'>

// Update types for agent collaboration
export type AgentUpdate = UpdateTables<'agents'>
export type IntentUpdate = UpdateTables<'intents'>
export type SpaceUpdate = UpdateTables<'spaces'>

// Extended types with relations
export type UserWithRelations = User & {
  friends_count?: number
  communities_count?: number
}

export type PostWithRelations = Post & {
  user: User
  community?: Community | null
  reactions: Reaction[]
  comments: Comment[]
  reactions_count?: number
  comments_count?: number
}

export type HangoutWithRelations = Hangout & {
  host: User
  community: Community
  rsvps: (HangoutRsvp & { user: User })[]
  comments: (Comment & { user: User })[]
  going_count?: number
  interested_count?: number
}

export type CommunityWithRelations = Community & {
  admin: User
  members_preview?: User[]
}

// Agent extended types with relations
export type AgentWithRelations = Agent & {
  owner: User
  intents?: Intent[]
  spaces?: Space[]
}

export type SpaceWithRelations = Space & {
  created_by_user?: User
  agents_preview?: Agent[]
}

export type AgentConversationWithRelations = AgentConversation & {
  agent_a: Agent
  agent_b: Agent
  space?: Space
  messages?: ConversationMessage[]
}

export type MatchWithRelations = Match & {
  agent_a: AgentWithRelations
  agent_b: AgentWithRelations
  conversation?: AgentConversationWithRelations
  space?: Space
}

export type HangoutCategory = Hangout['category']
export type PostVisibility = Post['visibility']
export type HangoutVisibility = Hangout['visibility']

// ============================================
// AGENT COLLABORATION TYPES
// ============================================

// Agent connection types
export type AgentConnectionType = 'api_endpoint' | 'mindclone' | 'openai_gpt' | 'langchain' | 'custom_webhook'
export type AgentHealthStatus = 'healthy' | 'unhealthy' | 'unknown'

// Intent types
export type IntentType = 'investment' | 'dating' | 'cofounder' | 'collaboration' | 'friendship' | 'hiring' | 'mentorship' | 'custom'

// Space types
export type SpaceType = 'investment' | 'dating' | 'professional' | 'social' | 'custom'

// Conversation status
export type ConversationStatus = 'active' | 'paused' | 'concluded' | 'matched' | 'expired'

// Match status
export type MatchStatus = 'pending' | 'both_approved' | 'intro_scheduled' | 'connected' | 'declined' | 'expired'

// Match proposal status
export type MatchProposalStatus = 'pending' | 'accepted' | 'rejected'

// Intro method
export type IntroMethod = 'video_call' | 'in_person' | 'message' | 'email'

// Agent connection configs
export interface ApiEndpointConfig {
  endpoint: string
  auth_header?: string
  auth_type?: 'bearer' | 'api_key' | 'none'
  timeout_ms?: number
}

export interface MindcloneConfig {
  handle: string
  base_url?: string
}

export interface OpenAIGPTConfig {
  gpt_id: string
  api_key_ref?: string
}

export interface LangchainConfig {
  endpoint: string
  chain_id?: string
}

export interface CustomWebhookConfig {
  webhook_url: string
  secret?: string
}

export type AgentConnectionConfig =
  | ApiEndpointConfig
  | MindcloneConfig
  | OpenAIGPTConfig
  | LangchainConfig
  | CustomWebhookConfig

// Intent preferences (examples for different types)
export interface InvestmentPreferences {
  stage?: string[]
  sector?: string[]
  check_size_min?: number
  check_size_max?: number
  geography?: string[]
}

export interface DatingPreferences {
  age_range?: [number, number]
  location?: string
  interests?: string[]
  relationship_type?: string
}

export interface CofounderPreferences {
  role?: 'technical' | 'business' | 'design' | 'any'
  equity_range?: [number, number]
  commitment?: 'full-time' | 'part-time' | 'flexible'
  skills?: string[]
}

export type IntentPreferences = InvestmentPreferences | DatingPreferences | CofounderPreferences | Record<string, unknown>

// Space settings
export interface SpaceSettings {
  auto_match_threshold?: number
  max_agents?: number
  conversation_turns_limit?: number
  require_approval?: boolean
}

// Conversation message metadata
export interface MessageMetadata {
  match_signal?: number
  topics?: string[]
  sentiment?: 'positive' | 'neutral' | 'negative'
  key_points?: string[]
}

// Match conversation highlights
export interface ConversationHighlight {
  message_id: string
  summary: string
  timestamp?: string
}

// Wall-specific types (UI uses different visibility values than DB)
export type WallPostVisibility = 'connections' | 'close_friends' | 'community'

// Comment with user relation
export type CommentWithUser = Comment & {
  user: User
}

// Wall post with all relations for display
export type WallPostWithRelations = {
  id: string
  user_id: string
  content: string | null
  media_urls: string[] | null
  visibility: WallPostVisibility
  community_id: string | null
  created_at: string
  updated_at: string
  user: User
  reactions: Reaction[]
  comments: CommentWithUser[]
  reactions_count: number
  comments_count: number
  user_reaction: Reaction | null
}

// ============================================
// GAMIFICATION TYPES (Octalysis Framework)
// ============================================

// User stats for XP and progress tracking
export interface UserStats {
  id: string
  user_id: string
  total_xp: number
  current_level: number
  hangouts_created: number
  hangouts_joined: number
  hangouts_completed: number
  unique_people_met: number
  close_friends_count: number
  current_daily_streak: number
  longest_daily_streak: number
  last_activity_date: string | null
  created_at: string
  updated_at: string
}

// Achievement progress
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'locked'

export interface UserAchievement {
  id: string
  user_id: string
  achievement_key: string
  tier: number // 1=Bronze, 2=Silver, 3=Gold, 4=Platinum
  progress: number
  unlocked_at: string | null
  created_at: string
}

// XP transaction history
export interface XPTransaction {
  id: string
  user_id: string
  amount: number
  reason: string
  hangout_id: string | null
  created_at: string
}

// Streak tracking
export type StreakType = 'daily' | 'weekly' | 'partner'

export interface StreakData {
  id: string
  user_id: string
  streak_type: StreakType
  partner_user_id: string | null // For partner streaks
  current_count: number
  longest_count: number
  last_activity_date: string | null
  streak_started_at: string | null
  created_at: string
}

// Leaderboard snapshots
export type LeaderboardPeriod = 'weekly' | 'monthly' | 'all_time'

export interface LeaderboardEntry {
  user_id: string
  xp: number
  rank: number
  change?: number // Position change from last period
}

export interface LeaderboardSnapshot {
  id: string
  community_id: string
  period_type: LeaderboardPeriod
  period_start: string
  rankings: LeaderboardEntry[]
  created_at: string
}

// Extended user type with gamification data
export interface UserWithGamification extends User {
  stats?: UserStats
  achievements?: UserAchievement[]
  streaks?: StreakData[]
}

// Hangout completion event for XP calculation
export interface HangoutCompletionEvent {
  hangout_id: string
  user_id: string
  partner_ids: string[]
  hangout_category: HangoutCategory
  hangout_time: string
  is_host: boolean
  completed_at: string
}

// Mystery drop event
export interface MysteryDropEvent {
  id: string
  user_id: string
  event_type: 'XP_MULTIPLIER' | 'BONUS_DROP' | 'MYSTERY_BADGE'
  multiplier?: number
  bonus_xp?: number
  message: string
  claimed: boolean
  created_at: string
}
