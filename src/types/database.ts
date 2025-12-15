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
