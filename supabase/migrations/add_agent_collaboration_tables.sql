-- =====================================================
-- Agent Collaboration Platform Migration
-- =====================================================
-- This migration adds tables for the AI Agent collaboration
-- platform where agents representing humans interact in
-- purpose-driven spaces to find matches
-- =====================================================

-- =====================================================
-- 1. AGENTS TABLE (AI agents representing humans)
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
  -- Example configs:
  -- api_endpoint: { "endpoint": "https://my-agent.com/api/chat", "auth_header": "Bearer xxx" }
  -- mindclone: { "handle": "raj_sharma", "base_url": "https://mindclone.link" }
  -- openai_gpt: { "gpt_id": "g-abc123", "api_key_ref": "user_openai_key" }

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
-- 2. INTENTS TABLE (what agents are seeking)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,

  -- Intent type: investment | dating | cofounder | collaboration | friendship | hiring | mentorship | custom
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,

  -- Flexible criteria for matching
  preferences JSONB DEFAULT '{}',
  -- Example preferences:
  -- investment: { "stage": "pre-seed", "sector": ["AI", "SaaS"], "check_size_min": 50000, "check_size_max": 200000 }
  -- dating: { "age_range": [25, 35], "location": "Delhi NCR", "interests": ["travel", "music"] }
  -- cofounder: { "role": "technical", "equity_range": [10, 30], "commitment": "full-time" }

  -- Priority and status
  priority INTEGER DEFAULT 1, -- Higher = more important
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for intents
CREATE INDEX IF NOT EXISTS idx_intents_agent ON public.intents(agent_id);
CREATE INDEX IF NOT EXISTS idx_intents_type ON public.intents(type);
CREATE INDEX IF NOT EXISTS idx_intents_active ON public.intents(is_active);

-- =====================================================
-- 3. SPACES TABLE (purpose-driven arenas)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.spaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT, -- emoji or icon identifier
  cover_image_url TEXT,

  -- Space type: investment | dating | professional | social | custom
  type TEXT NOT NULL,

  -- Categorization
  tags TEXT[] DEFAULT '{}',

  -- Access control
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.users(id),

  -- Stats (denormalized for performance)
  agent_count INTEGER DEFAULT 0,
  conversation_count INTEGER DEFAULT 0,
  match_count INTEGER DEFAULT 0,

  -- Settings
  settings JSONB DEFAULT '{}',
  -- Example: { "auto_match_threshold": 0.8, "max_agents": 1000, "conversation_turns_limit": 20 }

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
-- 4. SPACE_MEMBERSHIPS TABLE (agents in spaces)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.space_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,

  -- Which intent brought them here
  intent_id UUID REFERENCES public.intents(id) ON DELETE SET NULL,

  -- Status
  is_active BOOLEAN DEFAULT true,

  joined_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate memberships
  UNIQUE(space_id, agent_id)
);

-- Indexes for space memberships
CREATE INDEX IF NOT EXISTS idx_space_memberships_space ON public.space_memberships(space_id);
CREATE INDEX IF NOT EXISTS idx_space_memberships_agent ON public.space_memberships(agent_id);
CREATE INDEX IF NOT EXISTS idx_space_memberships_active ON public.space_memberships(is_active);

-- =====================================================
-- 5. AGENT_CONVERSATIONS TABLE (agent-to-agent chats)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agent_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL,

  agent_a_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  agent_b_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,

  -- Link to intents that triggered this conversation
  agent_a_intent_id UUID REFERENCES public.intents(id) ON DELETE SET NULL,
  agent_b_intent_id UUID REFERENCES public.intents(id) ON DELETE SET NULL,

  -- Conversation state
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'concluded', 'matched', 'expired')),
  turn_count INTEGER DEFAULT 0,

  -- Match signals (updated as conversation progresses)
  compatibility_score FLOAT,
  agent_a_interest_score FLOAT, -- How interested agent A seems
  agent_b_interest_score FLOAT, -- How interested agent B seems

  -- Match proposal
  match_proposed_by UUID REFERENCES public.agents(id),
  match_proposal_status TEXT CHECK (match_proposal_status IN ('pending', 'accepted', 'rejected')),

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  concluded_at TIMESTAMPTZ,

  -- Prevent duplicate active conversations between same agents
  CONSTRAINT no_self_conversation CHECK (agent_a_id != agent_b_id)
);

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_space ON public.agent_conversations(space_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_a ON public.agent_conversations(agent_a_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_b ON public.agent_conversations(agent_b_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.agent_conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.agent_conversations(last_message_at DESC);

-- =====================================================
-- 6. CONVERSATION_MESSAGES TABLE (individual messages)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.agent_conversations(id) ON DELETE CASCADE,

  sender_agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,

  -- Metadata from agent response
  metadata JSONB DEFAULT '{}',
  -- Example: { "match_signal": 0.7, "topics": ["AI", "funding"], "sentiment": "positive" }

  -- For tracking
  turn_number INTEGER NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.conversation_messages(sender_agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.conversation_messages(created_at DESC);

-- =====================================================
-- 7. MATCHES TABLE (successful connections)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES public.agent_conversations(id) ON DELETE SET NULL,
  space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL,

  agent_a_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  agent_b_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,

  -- Match details
  compatibility_score FLOAT NOT NULL,
  match_reason TEXT, -- AI-generated summary of why they matched
  conversation_highlights JSONB DEFAULT '[]', -- Key moments from the conversation
  -- Example: [{ "message_id": "xxx", "summary": "Both interested in AI infrastructure" }]

  -- Human approval
  agent_a_owner_approved BOOLEAN,
  agent_b_owner_approved BOOLEAN,
  agent_a_owner_approved_at TIMESTAMPTZ,
  agent_b_owner_approved_at TIMESTAMPTZ,

  -- Outcome
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'both_approved', 'intro_scheduled', 'connected', 'declined', 'expired')),

  -- If intro happens
  intro_scheduled_at TIMESTAMPTZ,
  intro_method TEXT, -- 'video_call' | 'in_person' | 'message' | 'email'
  intro_notes TEXT,

  -- Feedback after connection
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
-- 8. ADD AGENT-RELATED FIELDS TO USERS TABLE
-- =====================================================
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS has_agents BOOLEAN DEFAULT false;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS agent_count INTEGER DEFAULT 0;

-- =====================================================
-- 9. EXTEND NOTIFICATIONS FOR AGENT ACTIVITIES
-- =====================================================
-- Drop and recreate the check constraint to add new notification types
ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN (
  -- Existing types
  'friend_request', 'friend_accepted', 'hangout_invite', 'hangout_rsvp',
  'community_approved', 'comment', 'reaction',
  -- New agent types
  'agent_registered', 'agent_conversation_started', 'agent_match_found',
  'match_pending_approval', 'match_approved', 'match_declined',
  'intro_scheduled', 'agent_health_alert'
));

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on new tables
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
-- TRIGGERS
-- =====================================================

-- Updated_at triggers for new tables
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_intents_updated_at BEFORE UPDATE ON public.intents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_spaces_updated_at BEFORE UPDATE ON public.spaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- FUNCTIONS
-- =====================================================

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

    -- Update has_agents flag
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

-- Function to update agent stats
CREATE OR REPLACE FUNCTION update_agent_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.agents SET total_conversations = total_conversations + 1 WHERE id = NEW.agent_a_id;
    UPDATE public.agents SET total_conversations = total_conversations + 1 WHERE id = NEW.agent_b_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_conversation_stats_trigger
  AFTER INSERT ON public.agent_conversations
  FOR EACH ROW EXECUTE FUNCTION update_agent_conversation_stats();

-- Function to update agent match stats
CREATE OR REPLACE FUNCTION update_agent_match_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.agents SET total_matches = total_matches + 1 WHERE id = NEW.agent_a_id;
    UPDATE public.agents SET total_matches = total_matches + 1 WHERE id = NEW.agent_b_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_match_stats_trigger
  AFTER INSERT ON public.matches
  FOR EACH ROW EXECUTE FUNCTION update_agent_match_stats();

-- =====================================================
-- SEED DEFAULT SPACES
-- =====================================================
INSERT INTO public.spaces (name, slug, description, icon, type, is_public, is_featured, tags) VALUES
  ('Founders × Angels', 'founders-angels', 'Pre-seed and seed stage founders meeting angel investors', '💼', 'investment', true, true, ARRAY['startup', 'investment', 'funding']),
  ('Technical Co-founders', 'technical-cofounders', 'Non-technical founders seeking technical co-founders and vice versa', '👥', 'professional', true, true, ARRAY['cofounder', 'startup', 'technical']),
  ('AI Builders', 'ai-builders', 'AI researchers, engineers, and founders connecting', '🤖', 'professional', true, true, ARRAY['AI', 'ML', 'technology']),
  ('Serious Dating 25-35', 'dating-25-35', 'Professionals in their late 20s to mid 30s looking for serious relationships', '💕', 'dating', true, true, ARRAY['dating', 'relationships']),
  ('Crypto & Web3', 'crypto-web3', 'Web3 builders, investors, and enthusiasts', '🌐', 'professional', true, false, ARRAY['crypto', 'web3', 'blockchain']),
  ('Mentors & Mentees', 'mentors-mentees', 'Experienced professionals mentoring the next generation', '🎓', 'professional', true, true, ARRAY['mentorship', 'career', 'growth'])
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- ROLLBACK INSTRUCTIONS
-- =====================================================
-- To rollback this migration, run:
--
-- DROP TABLE IF EXISTS public.matches CASCADE;
-- DROP TABLE IF EXISTS public.conversation_messages CASCADE;
-- DROP TABLE IF EXISTS public.agent_conversations CASCADE;
-- DROP TABLE IF EXISTS public.space_memberships CASCADE;
-- DROP TABLE IF EXISTS public.spaces CASCADE;
-- DROP TABLE IF EXISTS public.intents CASCADE;
-- DROP TABLE IF EXISTS public.agents CASCADE;
--
-- ALTER TABLE public.users DROP COLUMN IF EXISTS has_agents;
-- ALTER TABLE public.users DROP COLUMN IF EXISTS agent_count;
--
-- ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
-- ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
--   CHECK (type IN ('friend_request', 'friend_accepted', 'hangout_invite', 'hangout_rsvp', 'community_approved', 'comment', 'reaction'));
