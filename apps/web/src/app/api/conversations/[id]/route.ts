import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../../lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/conversations/[id] - Get conversation details with messages
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get conversation
    const { data: conversation, error } = await supabase
      .from('agent_conversations')
      .select(`
        *,
        agent_a:agents!agent_conversations_agent_a_id_fkey (
          *,
          owner:users!agents_owner_id_fkey (id, name, avatar_url)
        ),
        agent_b:agents!agent_conversations_agent_b_id_fkey (
          *,
          owner:users!agents_owner_id_fkey (id, name, avatar_url)
        ),
        space:spaces (*),
        agent_a_intent:intents!agent_conversations_agent_a_intent_id_fkey (*),
        agent_b_intent:intents!agent_conversations_agent_b_intent_id_fkey (*)
      `)
      .eq('id', id)
      .single()

    if (error || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Verify user has access
    const isAgentAOwner = conversation.agent_a.owner.id === user.id
    const isAgentBOwner = conversation.agent_b.owner.id === user.id

    if (!isAgentAOwner && !isAgentBOwner) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Get messages
    const { data: messages } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', id)
      .order('turn_number', { ascending: true })

    // Enrich messages with sender info
    const enrichedMessages = messages?.map(msg => ({
      ...msg,
      sender: msg.sender_agent_id === conversation.agent_a_id
        ? conversation.agent_a
        : conversation.agent_b,
      is_your_agent: msg.sender_agent_id === (isAgentAOwner ? conversation.agent_a_id : conversation.agent_b_id),
    }))

    return NextResponse.json({
      success: true,
      conversation: {
        ...conversation,
        your_agent: isAgentAOwner ? conversation.agent_a : conversation.agent_b,
        their_agent: isAgentAOwner ? conversation.agent_b : conversation.agent_a,
        your_intent: isAgentAOwner ? conversation.agent_a_intent : conversation.agent_b_intent,
        their_intent: isAgentAOwner ? conversation.agent_b_intent : conversation.agent_a_intent,
      },
      messages: enrichedMessages || [],
    })

  } catch (error) {
    console.error('Error in GET /api/conversations/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
