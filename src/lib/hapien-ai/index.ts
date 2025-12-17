// Hapien AI - The Connection Orchestrator
// Main entry point for AI functionality

import {
  User,
  AIMessage,
  AIMessageType,
  AINotificationData,
  HAPIEN_AI
} from '@/types/database'
import * as prompts from './prompts'

export { HAPIEN_AI }

// Generate AI message ID
const generateMessageId = () => `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// Create a connection prompt notification
export function createConnectionPrompt(
  userId: string,
  otherUser: User,
  hangoutId: string,
  hangoutTitle: string,
  category: string
): AINotificationData {
  const message = prompts.connectionPrompt(otherUser, hangoutTitle, category as any)

  return {
    id: generateMessageId(),
    message,
    type: 'connection_prompt',
    avatar: HAPIEN_AI.avatar,
    timestamp: new Date().toISOString(),
    action_buttons: [
      { label: 'Yes, connect us!', action: `connect:${otherUser.id}:${hangoutId}`, variant: 'primary' },
      { label: 'Not this time', action: 'dismiss', variant: 'secondary' }
    ],
    context_user: otherUser,
    read: false
  }
}

// Create a post encouragement notification
export function createPostEncouragement(
  userId: string,
  userName: string,
  daysSinceLastPost: number
): AINotificationData | null {
  const message = prompts.postEncouragement(daysSinceLastPost, userName)
  if (!message) return null

  return {
    id: generateMessageId(),
    message,
    type: 'post_encouragement',
    avatar: HAPIEN_AI.avatar,
    timestamp: new Date().toISOString(),
    action_buttons: [
      { label: 'Share something', action: 'navigate:/wall', variant: 'primary' },
      { label: 'Maybe later', action: 'dismiss', variant: 'secondary' }
    ],
    read: false
  }
}

// Create a streak celebration notification
export function createStreakCelebration(
  userId: string,
  streakDays: number
): AINotificationData | null {
  const message = prompts.streakCelebration(streakDays)
  if (!message) return null

  return {
    id: generateMessageId(),
    message,
    type: 'streak_celebration',
    avatar: HAPIEN_AI.avatar,
    timestamp: new Date().toISOString(),
    action_buttons: [
      { label: 'Keep it going!', action: 'navigate:/feed', variant: 'primary' }
    ],
    read: false
  }
}

// Create a friendship cooling alert
export function createFriendshipCoolingAlert(
  userId: string,
  friend: User,
  daysSinceMeetup: number
): AINotificationData | null {
  const friendName = friend.name || 'your friend'
  const message = prompts.friendshipCooling(friendName, daysSinceMeetup)
  if (!message) return null

  return {
    id: generateMessageId(),
    message,
    type: 'friendship_cooling',
    avatar: HAPIEN_AI.avatar,
    timestamp: new Date().toISOString(),
    action_buttons: [
      { label: 'Plan a hangout', action: `plan:${friend.id}`, variant: 'primary' },
      { label: 'Remind me later', action: 'snooze:7', variant: 'secondary' }
    ],
    context_user: friend,
    read: false
  }
}

// Create welcome message for new users
export function createWelcomeMessage(userId: string, userName: string): AINotificationData {
  const message = prompts.welcomeMessage(userName)

  return {
    id: generateMessageId(),
    message,
    type: 'welcome',
    avatar: HAPIEN_AI.avatar,
    timestamp: new Date().toISOString(),
    action_buttons: [
      { label: 'Get started', action: 'navigate:/communities', variant: 'primary' }
    ],
    read: false
  }
}

// Process user chat message and get template response
export function processUserMessage(message: string): string {
  const lowerMessage = message.toLowerCase().trim()

  // Check for default responses
  if (lowerMessage.includes('help') || lowerMessage === '?') {
    return prompts.defaultResponses.help
  }
  if (lowerMessage.includes('thank')) {
    return prompts.defaultResponses.thanks
  }
  if (lowerMessage.match(/^(hi|hello|hey)$/)) {
    return prompts.defaultResponses.hello
  }
  if (lowerMessage.match(/^(bye|goodbye|see you)$/)) {
    return prompts.defaultResponses.bye
  }

  // Check for specific questions
  if (lowerMessage.includes('who should i meet') || lowerMessage.includes('who to meet')) {
    return "Let me check your tribe... I'll analyze your connections and suggest someone. Give me a moment! 🔍"
  }
  if (lowerMessage.includes('what to do') || lowerMessage.includes("what's happening")) {
    return "Let me see what's happening in your community... 🔍"
  }
  if (lowerMessage.includes('how am i doing') || lowerMessage.includes('my progress')) {
    return "Let me pull up your stats... 📊"
  }

  // Fallback - this would trigger LLM in production
  return "I'm still learning! For now, I can help you with:\n\n• Finding people to meet\n• Checking what's happening\n• Your progress and stats\n\nTry asking about one of these! 💡"
}

// Calculate happiness score from metrics
export function calculateHappinessScore(
  hangoutsCompleted: number,
  postsCreated: number,
  connectionsMade: number,
  reactionsReceived: number,
  streakBonus: number = 0
): number {
  const rawScore = (
    hangoutsCompleted * 20 +
    postsCreated * 10 +
    connectionsMade * 30 +
    reactionsReceived * 5 +
    streakBonus
  )

  // Normalize to 0-100 (assuming max expected raw score of ~500)
  return Math.min(100, Math.round(rawScore / 5))
}

// Get streak bonus based on streak days
export function getStreakBonus(streakDays: number): number {
  if (streakDays >= 30) return 50
  if (streakDays >= 14) return 30
  if (streakDays >= 7) return 20
  if (streakDays >= 3) return 10
  return 0
}
