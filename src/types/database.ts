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
          type: 'society' | 'campus' | 'office'
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
          type: 'society' | 'campus' | 'office'
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
          type?: 'society' | 'campus' | 'office'
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

export type HangoutCategory = Hangout['category']
export type CommunityType = Community['type']
export type PostVisibility = Post['visibility']
export type HangoutVisibility = Hangout['visibility']

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
