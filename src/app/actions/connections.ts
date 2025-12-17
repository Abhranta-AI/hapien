'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Accept a connection request after hangout
export async function acceptConnection(otherUserId: string, hangoutId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if connection already exists
  const { data: existing } = await supabase
    .from('connections')
    .select('*')
    .or(`and(user_id.eq.${user.id},connected_user_id.eq.${otherUserId}),and(user_id.eq.${otherUserId},connected_user_id.eq.${user.id})`)
    .single()

  if (existing) {
    // Update existing connection
    if (existing.user_id === user.id) {
      await supabase
        .from('connections')
        .update({
          user_accepted: true,
          status: existing.connected_user_accepted ? 'connected' : 'pending_mutual',
          connected_at: existing.connected_user_accepted ? new Date().toISOString() : null
        })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('connections')
        .update({
          connected_user_accepted: true,
          status: existing.user_accepted ? 'connected' : 'pending_mutual',
          connected_at: existing.user_accepted ? new Date().toISOString() : null
        })
        .eq('id', existing.id)
    }
  } else {
    // Create new connection record
    await supabase
      .from('connections')
      .insert({
        user_id: user.id,
        connected_user_id: otherUserId,
        hangout_id: hangoutId,
        status: 'pending_mutual',
        user_accepted: true,
        connected_user_accepted: false
      })
  }

  revalidatePath('/wall')
  revalidatePath('/profile')
  return { success: true }
}

// Decline a connection (just don't create/update the record)
export async function declineConnection(otherUserId: string) {
  // For now, we just don't do anything - user can connect later from profile
  return { success: true }
}

// Get all connections for current user
export async function getConnections() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: connections, error } = await supabase
    .from('connections')
    .select(`
      *,
      connected_user:users!connections_connected_user_id_fkey(*)
    `)
    .eq('user_id', user.id)
    .eq('status', 'connected')

  if (error) throw error

  // Also get connections where user is the connected_user
  const { data: reverseConnections } = await supabase
    .from('connections')
    .select(`
      *,
      connected_user:users!connections_user_id_fkey(*)
    `)
    .eq('connected_user_id', user.id)
    .eq('status', 'connected')

  return [...(connections || []), ...(reverseConnections || [])]
}

// Check connection status with another user
export async function getConnectionStatus(otherUserId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: connection } = await supabase
    .from('connections')
    .select('*')
    .or(`and(user_id.eq.${user.id},connected_user_id.eq.${otherUserId}),and(user_id.eq.${otherUserId},connected_user_id.eq.${user.id})`)
    .single()

  if (!connection) return 'not_connected'
  if (connection.status === 'connected') return 'connected'

  // Check if current user has accepted
  if (connection.user_id === user.id && connection.user_accepted) return 'pending_their_response'
  if (connection.connected_user_id === user.id && connection.connected_user_accepted) return 'pending_their_response'

  return 'pending_your_response'
}

// Send connection request from profile (not after hangout)
export async function sendConnectionRequest(otherUserId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if connection already exists
  const { data: existing } = await supabase
    .from('connections')
    .select('*')
    .or(`and(user_id.eq.${user.id},connected_user_id.eq.${otherUserId}),and(user_id.eq.${otherUserId},connected_user_id.eq.${user.id})`)
    .single()

  if (existing) {
    // Update existing - accept if they already requested
    if (existing.user_id === otherUserId && existing.user_accepted) {
      await supabase
        .from('connections')
        .update({
          connected_user_accepted: true,
          status: 'connected',
          connected_at: new Date().toISOString()
        })
        .eq('id', existing.id)
    }
    return { success: true, status: 'updated' }
  }

  // Create new connection request
  await supabase
    .from('connections')
    .insert({
      user_id: user.id,
      connected_user_id: otherUserId,
      status: 'pending_mutual',
      user_accepted: true,
      connected_user_accepted: false
    })

  revalidatePath('/profile')
  return { success: true, status: 'created' }
}
