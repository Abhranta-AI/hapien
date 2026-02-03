-- Hapien Database Schema
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  name TEXT,
  bio TEXT,
  avatar_url TEXT,
  interests TEXT[] DEFAULT '{}',
  has_agents BOOLEAN DEFAULT false,
  agent_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);

-- =====================================================
-- FRIENDSHIPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate friendships
  UNIQUE(requester_id, addressee_id),
  -- Prevent self-friendships
  CHECK (requester_id != addressee_id)
);

-- Indexes for friendship lookups
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON public.friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- =====================================================
-- COMMUNITIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('society', 'campus', 'office')),
  location JSONB,
  description TEXT,
  cover_image_url TEXT,
  admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for community lookups
CREATE INDEX IF NOT EXISTS idx_communities_type ON public.communities(type);
CREATE INDEX IF NOT EXISTS idx_communities_admin ON public.communities(admin_id);
CREATE INDEX IF NOT EXISTS idx_communities_name ON public.communities USING gin(name gin_trgm_ops);

-- Enable trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- COMMUNITY MEMBERSHIPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.community_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate memberships
  UNIQUE(user_id, community_id)
);

-- Indexes for membership lookups
CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.community_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_community ON public.community_memberships(community_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON public.community_memberships(status);

-- =====================================================
-- POSTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT,
  media_urls TEXT[] DEFAULT '{}',
  visibility TEXT NOT NULL DEFAULT 'friends' CHECK (visibility IN ('friends', 'friends_communities', 'community_only')),
  community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for post lookups
CREATE INDEX IF NOT EXISTS idx_posts_user ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_community ON public.posts(community_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON public.posts(created_at DESC);

-- =====================================================
-- HANGOUTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.hangouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('sports', 'food', 'shopping', 'learning', 'chill')),
  location JSONB,
  date_time TIMESTAMPTZ NOT NULL,
  max_participants INTEGER,
  visibility TEXT NOT NULL DEFAULT 'community' CHECK (visibility IN ('friends', 'community', 'public_in_community')),
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for hangout lookups
CREATE INDEX IF NOT EXISTS idx_hangouts_host ON public.hangouts(host_id);
CREATE INDEX IF NOT EXISTS idx_hangouts_community ON public.hangouts(community_id);
CREATE INDEX IF NOT EXISTS idx_hangouts_datetime ON public.hangouts(date_time);
CREATE INDEX IF NOT EXISTS idx_hangouts_status ON public.hangouts(status);
CREATE INDEX IF NOT EXISTS idx_hangouts_category ON public.hangouts(category);

-- =====================================================
-- HANGOUT RSVPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.hangout_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hangout_id UUID NOT NULL REFERENCES public.hangouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('interested', 'going')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate RSVPs
  UNIQUE(hangout_id, user_id)
);

-- Indexes for RSVP lookups
CREATE INDEX IF NOT EXISTS idx_rsvps_hangout ON public.hangout_rsvps(hangout_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_user ON public.hangout_rsvps(user_id);

-- =====================================================
-- COMMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  hangout_id UUID REFERENCES public.hangouts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Must reference either a post or a hangout
  CHECK ((post_id IS NOT NULL AND hangout_id IS NULL) OR (post_id IS NULL AND hangout_id IS NOT NULL))
);

-- Indexes for comment lookups
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_hangout ON public.comments(hangout_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments(user_id);

-- =====================================================
-- REACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'love', 'celebrate')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate reactions
  UNIQUE(user_id, post_id)
);

-- Indexes for reaction lookups
CREATE INDEX IF NOT EXISTS idx_reactions_post ON public.reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON public.reactions(user_id);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('friend_request', 'friend_accepted', 'hangout_invite', 'hangout_rsvp', 'community_approved', 'comment', 'reaction')),
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notification lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- =====================================================
-- COMMUNITY REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.community_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requested_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('society', 'campus', 'office')),
  location TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for community request lookups
CREATE INDEX IF NOT EXISTS idx_community_requests_user ON public.community_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_community_requests_status ON public.community_requests(status);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hangouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hangout_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_requests ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Friendships policies
CREATE POLICY "Users can view own friendships" ON public.friendships FOR SELECT 
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can send friend requests" ON public.friendships FOR INSERT 
  WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update own friendships" ON public.friendships FOR UPDATE 
  USING (auth.uid() = addressee_id OR auth.uid() = requester_id);
CREATE POLICY "Users can delete own friendships" ON public.friendships FOR DELETE 
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Communities policies
CREATE POLICY "Communities are viewable by everyone" ON public.communities FOR SELECT USING (true);
CREATE POLICY "Admins can update communities" ON public.communities FOR UPDATE USING (auth.uid() = admin_id);
CREATE POLICY "Users can create communities" ON public.communities FOR INSERT WITH CHECK (auth.uid() = admin_id);

-- Community memberships policies
CREATE POLICY "Users can view memberships" ON public.community_memberships FOR SELECT USING (true);
CREATE POLICY "Users can join communities" ON public.community_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own membership" ON public.community_memberships FOR UPDATE 
  USING (auth.uid() = user_id OR auth.uid() IN (SELECT admin_id FROM public.communities WHERE id = community_id));
CREATE POLICY "Users can delete own membership" ON public.community_memberships FOR DELETE USING (auth.uid() = user_id);

-- Posts policies
CREATE POLICY "Posts are viewable by friends and community members" ON public.posts FOR SELECT USING (
  auth.uid() = user_id 
  OR (visibility = 'friends' AND EXISTS (
    SELECT 1 FROM public.friendships 
    WHERE status = 'accepted' 
    AND ((requester_id = auth.uid() AND addressee_id = user_id) OR (addressee_id = auth.uid() AND requester_id = user_id))
  ))
  OR (visibility IN ('friends_communities', 'community_only') AND EXISTS (
    SELECT 1 FROM public.community_memberships 
    WHERE user_id = auth.uid() AND community_id = posts.community_id AND status = 'approved'
  ))
);
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Hangouts policies
CREATE POLICY "Hangouts are viewable by community members" ON public.hangouts FOR SELECT USING (
  auth.uid() = host_id
  OR EXISTS (
    SELECT 1 FROM public.community_memberships 
    WHERE user_id = auth.uid() AND community_id = hangouts.community_id AND status = 'approved'
  )
);
CREATE POLICY "Community members can create hangouts" ON public.hangouts FOR INSERT WITH CHECK (
  auth.uid() = host_id 
  AND EXISTS (
    SELECT 1 FROM public.community_memberships 
    WHERE user_id = auth.uid() AND community_id = hangouts.community_id AND status = 'approved'
  )
);
CREATE POLICY "Hosts can update hangouts" ON public.hangouts FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Hosts can delete hangouts" ON public.hangouts FOR DELETE USING (auth.uid() = host_id);

-- Hangout RSVPs policies
CREATE POLICY "RSVPs are viewable by community members" ON public.hangout_rsvps FOR SELECT USING (true);
CREATE POLICY "Users can RSVP to hangouts" ON public.hangout_rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own RSVP" ON public.hangout_rsvps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own RSVP" ON public.hangout_rsvps FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Reactions policies
CREATE POLICY "Reactions are viewable by everyone" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "Users can create reactions" ON public.reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reactions" ON public.reactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON public.reactions FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Community requests policies
CREATE POLICY "Users can view own requests" ON public.community_requests FOR SELECT USING (auth.uid() = requested_by);
CREATE POLICY "Users can create requests" ON public.community_requests FOR INSERT WITH CHECK (auth.uid() = requested_by);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON public.communities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_hangouts_updated_at BEFORE UPDATE ON public.hangouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to update community member count
CREATE OR REPLACE FUNCTION update_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
    UPDATE public.communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'approved' AND NEW.status = 'approved' THEN
    UPDATE public.communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'approved' AND NEW.status != 'approved' THEN
    UPDATE public.communities SET member_count = member_count - 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'approved' THEN
    UPDATE public.communities SET member_count = member_count - 1 WHERE id = OLD.community_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_community_member_count
  AFTER INSERT OR UPDATE OR DELETE ON public.community_memberships
  FOR EACH ROW EXECUTE FUNCTION update_member_count();

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (p_user_id, p_type, p_title, p_body, p_data)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SAMPLE DATA (Optional - Remove in production)
-- =====================================================

-- You can add sample communities here for testing
-- INSERT INTO public.communities (name, type, admin_id, description) VALUES
-- ('Sample Society', 'society', 'YOUR_USER_ID', 'A sample residential society');

-- =====================================================
-- PAYMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  razorpay_order_id TEXT UNIQUE NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount INTEGER NOT NULL, -- in paisa
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('hangout', 'subscription', 'feature')),
  reference_id UUID, -- hangout_id or other reference
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for payment lookups
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_type ON public.payments(payment_type);

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Payments policies
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update payments" ON public.payments FOR UPDATE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================
-- Run these in Supabase Dashboard -> Storage

-- Create avatars bucket
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Create posts bucket  
-- INSERT INTO storage.buckets (id, name, public) VALUES ('posts', 'posts', true);

-- Create hangouts bucket
-- INSERT INTO storage.buckets (id, name, public) VALUES ('hangouts', 'hangouts', true);

-- Create communities bucket
-- INSERT INTO storage.buckets (id, name, public) VALUES ('communities', 'communities', true);

-- Storage policies
-- CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Post images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'posts');
-- CREATE POLICY "Users can upload post images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');

-- =====================================================
-- AGENT COLLABORATION PLATFORM TABLES
-- =====================================================
-- These tables support the AI Agent collaboration platform
-- where agents representing humans interact in purpose-driven
-- spaces to find matches
-- =====================================================

-- =====================================================
-- AGENTS TABLE (AI agents representing humans)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Agent identity
  name TEXT NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,

  -- Connection method (flexible for any agent source)
  -- Types: 'api_endpoint' | 'mindclone' | 'openai_gpt' | 'langchain' | 'custom_webhook'
  connection_type TEXT NOT NULL,
  connection_config JSONB NOT NULL DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  last_active_at TIMESTAMPTZ,
  last_health_check_at TIMESTAMPTZ,
  health_status TEXT DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'unhealthy', 'unknown')),

  -- Stats
  total_conversations INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for agents
CREATE INDEX IF NOT EXISTS idx_agents_owner ON public.agents(owner_id);
CREATE INDEX IF NOT EXISTS idx_agents_handle ON public.agents(handle);
CREATE INDEX IF NOT EXISTS idx_agents_active ON public.agents(is_active);
CREATE INDEX IF NOT EXISTS idx_agents_connection_type ON public.agents(connection_type);

-- =====================================================
-- INTENTS TABLE (what agents are seeking)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,

  -- Intent type
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,

  -- Flexible criteria for matching
  preferences JSONB DEFAULT '{}',

  -- Priority and status
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for intents
CREATE INDEX IF NOT EXISTS idx_intents_agent ON public.intents(agent_id);
CREATE INDEX IF NOT EXISTS idx_intents_type ON public.intents(type);
CREATE INDEX IF NOT EXISTS idx_intents_active ON public.intents(is_active);

-- =====================================================
-- SPACES TABLE (purpose-driven arenas)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.spaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  cover_image_url TEXT,

  -- Space type
  type TEXT NOT NULL,

  -- Categorization
  tags TEXT[] DEFAULT '{}',

  -- Access control
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.users(id),

  -- Stats
  agent_count INTEGER DEFAULT 0,
  conversation_count INTEGER DEFAULT 0,
  match_count INTEGER DEFAULT 0,

  -- Settings
  settings JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for spaces
CREATE INDEX IF NOT EXISTS idx_spaces_slug ON public.spaces(slug);
CREATE INDEX IF NOT EXISTS idx_spaces_type ON public.spaces(type);
CREATE INDEX IF NOT EXISTS idx_spaces_public ON public.spaces(is_public);
CREATE INDEX IF NOT EXISTS idx_spaces_featured ON public.spaces(is_featured);
CREATE INDEX IF NOT EXISTS idx_spaces_tags ON public.spaces USING gin(tags);

-- =====================================================
-- SPACE_MEMBERSHIPS TABLE (agents in spaces)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.space_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,

  intent_id UUID REFERENCES public.intents(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(space_id, agent_id)
);

-- Indexes for space memberships
CREATE INDEX IF NOT EXISTS idx_space_memberships_space ON public.space_memberships(space_id);
CREATE INDEX IF NOT EXISTS idx_space_memberships_agent ON public.space_memberships(agent_id);
CREATE INDEX IF NOT EXISTS idx_space_memberships_active ON public.space_memberships(is_active);

-- =====================================================
-- AGENT_CONVERSATIONS TABLE (agent-to-agent chats)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agent_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL,

  agent_a_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  agent_b_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,

  agent_a_intent_id UUID REFERENCES public.intents(id) ON DELETE SET NULL,
  agent_b_intent_id UUID REFERENCES public.intents(id) ON DELETE SET NULL,

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'concluded', 'matched', 'expired')),
  turn_count INTEGER DEFAULT 0,

  compatibility_score FLOAT,
  agent_a_interest_score FLOAT,
  agent_b_interest_score FLOAT,

  match_proposed_by UUID REFERENCES public.agents(id),
  match_proposal_status TEXT CHECK (match_proposal_status IN ('pending', 'accepted', 'rejected')),

  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  concluded_at TIMESTAMPTZ,

  CONSTRAINT no_self_conversation CHECK (agent_a_id != agent_b_id)
);

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_space ON public.agent_conversations(space_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_a ON public.agent_conversations(agent_a_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_b ON public.agent_conversations(agent_b_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.agent_conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.agent_conversations(last_message_at DESC);

-- =====================================================
-- CONVERSATION_MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.agent_conversations(id) ON DELETE CASCADE,

  sender_agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  turn_number INTEGER NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.conversation_messages(sender_agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.conversation_messages(created_at DESC);

-- =====================================================
-- MATCHES TABLE (successful connections)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES public.agent_conversations(id) ON DELETE SET NULL,
  space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL,

  agent_a_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  agent_b_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,

  compatibility_score FLOAT NOT NULL,
  match_reason TEXT,
  conversation_highlights JSONB DEFAULT '[]',

  agent_a_owner_approved BOOLEAN,
  agent_b_owner_approved BOOLEAN,
  agent_a_owner_approved_at TIMESTAMPTZ,
  agent_b_owner_approved_at TIMESTAMPTZ,

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'both_approved', 'intro_scheduled', 'connected', 'declined', 'expired')),

  intro_scheduled_at TIMESTAMPTZ,
  intro_method TEXT,
  intro_notes TEXT,

  outcome_rating INTEGER CHECK (outcome_rating >= 1 AND outcome_rating <= 5),
  outcome_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for matches
CREATE INDEX IF NOT EXISTS idx_matches_conversation ON public.matches(conversation_id);
CREATE INDEX IF NOT EXISTS idx_matches_space ON public.matches(space_id);
CREATE INDEX IF NOT EXISTS idx_matches_agent_a ON public.matches(agent_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_agent_b ON public.matches(agent_b_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_score ON public.matches(compatibility_score DESC);

-- =====================================================
-- RLS FOR AGENT COLLABORATION TABLES
-- =====================================================
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Agents policies
CREATE POLICY "Users can view all active agents" ON public.agents
  FOR SELECT USING (is_active = true);
CREATE POLICY "Users can manage own agents" ON public.agents
  FOR ALL USING (auth.uid() = owner_id);

-- Intents policies
CREATE POLICY "Users can view active intents" ON public.intents
  FOR SELECT USING (is_active = true);
CREATE POLICY "Users can manage own agent intents" ON public.intents
  FOR ALL USING (
    agent_id IN (SELECT id FROM public.agents WHERE owner_id = auth.uid())
  );

-- Spaces policies
CREATE POLICY "Anyone can view public spaces" ON public.spaces
  FOR SELECT USING (is_public = true);
CREATE POLICY "Users can create spaces" ON public.spaces
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update own spaces" ON public.spaces
  FOR UPDATE USING (auth.uid() = created_by);

-- Space memberships policies
CREATE POLICY "Users can view space memberships" ON public.space_memberships
  FOR SELECT USING (true);
CREATE POLICY "Users can manage own agent memberships" ON public.space_memberships
  FOR ALL USING (
    agent_id IN (SELECT id FROM public.agents WHERE owner_id = auth.uid())
  );

-- Conversations policies
CREATE POLICY "Users can view own agent conversations" ON public.agent_conversations
  FOR SELECT USING (
    agent_a_id IN (SELECT id FROM public.agents WHERE owner_id = auth.uid())
    OR agent_b_id IN (SELECT id FROM public.agents WHERE owner_id = auth.uid())
  );

-- Messages policies
CREATE POLICY "Users can view messages in own agent conversations" ON public.conversation_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM public.agent_conversations
      WHERE agent_a_id IN (SELECT id FROM public.agents WHERE owner_id = auth.uid())
         OR agent_b_id IN (SELECT id FROM public.agents WHERE owner_id = auth.uid())
    )
  );

-- Matches policies
CREATE POLICY "Users can view own matches" ON public.matches
  FOR SELECT USING (
    agent_a_id IN (SELECT id FROM public.agents WHERE owner_id = auth.uid())
    OR agent_b_id IN (SELECT id FROM public.agents WHERE owner_id = auth.uid())
  );
CREATE POLICY "Users can update own match approvals" ON public.matches
  FOR UPDATE USING (
    agent_a_id IN (SELECT id FROM public.agents WHERE owner_id = auth.uid())
    OR agent_b_id IN (SELECT id FROM public.agents WHERE owner_id = auth.uid())
  );

-- =====================================================
-- TRIGGERS FOR AGENT COLLABORATION TABLES
-- =====================================================
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_intents_updated_at BEFORE UPDATE ON public.intents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_spaces_updated_at BEFORE UPDATE ON public.spaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to update agent count for a user
CREATE OR REPLACE FUNCTION update_user_agent_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.users
    SET agent_count = agent_count + 1, has_agents = true
    WHERE id = NEW.owner_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.users
    SET agent_count = GREATEST(0, agent_count - 1)
    WHERE id = OLD.owner_id;
    UPDATE public.users
    SET has_agents = (agent_count > 0)
    WHERE id = OLD.owner_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_agent_count_trigger
  AFTER INSERT OR DELETE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION update_user_agent_count();

-- Function to update space agent count
CREATE OR REPLACE FUNCTION update_space_agent_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.spaces SET agent_count = agent_count + 1 WHERE id = NEW.space_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.spaces SET agent_count = GREATEST(0, agent_count - 1) WHERE id = OLD.space_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_space_agent_count_trigger
  AFTER INSERT OR DELETE ON public.space_memberships
  FOR EACH ROW EXECUTE FUNCTION update_space_agent_count();

-- =====================================================
-- DEFAULT SPACES FOR AGENT COLLABORATION
-- =====================================================
INSERT INTO public.spaces (name, slug, description, icon, type, is_public, is_featured, tags) VALUES
  ('Founders × Angels', 'founders-angels', 'Pre-seed and seed stage founders meeting angel investors', '💼', 'investment', true, true, ARRAY['startup', 'investment', 'funding']),
  ('Technical Co-founders', 'technical-cofounders', 'Non-technical founders seeking technical co-founders and vice versa', '👥', 'professional', true, true, ARRAY['cofounder', 'startup', 'technical']),
  ('AI Builders', 'ai-builders', 'AI researchers, engineers, and founders connecting', '🤖', 'professional', true, true, ARRAY['AI', 'ML', 'technology']),
  ('Serious Dating 25-35', 'dating-25-35', 'Professionals in their late 20s to mid 30s looking for serious relationships', '💕', 'dating', true, true, ARRAY['dating', 'relationships']),
  ('Crypto & Web3', 'crypto-web3', 'Web3 builders, investors, and enthusiasts', '🌐', 'professional', true, false, ARRAY['crypto', 'web3', 'blockchain']),
  ('Mentors & Mentees', 'mentors-mentees', 'Experienced professionals mentoring the next generation', '🎓', 'professional', true, true, ARRAY['mentorship', 'career', 'growth'])
ON CONFLICT (slug) DO NOTHING;
