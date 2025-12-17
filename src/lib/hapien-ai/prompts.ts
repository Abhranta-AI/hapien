// Hapien AI Message Templates
// These are used for template-based responses (not LLM)

import { User, AIMessageType, HangoutCategory } from '@/types/database'

// Get activity emoji by category
const getActivityEmoji = (category: HangoutCategory | string): string => {
  const emojis: Record<string, string> = {
    sports: '🏸',
    food: '🍕',
    shopping: '🛍️',
    learning: '📚',
    chill: '😎',
    coffee_date: '☕',
    dinner_date: '🍽️',
    drinks_date: '🍹',
  }
  return emojis[category] || '🎉'
}

// Connection prompt after hangout
export const connectionPrompt = (
  otherUser: User,
  hangoutTitle: string,
  category: HangoutCategory | string
) => {
  const emoji = getActivityEmoji(category)
  const name = otherUser.name || 'your hangout partner'

  const variations = [
    `Hey! ${emoji} Looks like you had a great time with ${name}! Would you like to stay connected so you can see each other's updates?`,
    `${emoji} Nice hangout with ${name}! Want to add them to your tribe so you don't lose touch?`,
    `That was fun! ${emoji} ${name} seems cool - want to stay connected and see what they're up to?`,
  ]

  return variations[Math.floor(Math.random() * variations.length)]
}

// Post encouragement
export const postEncouragement = (daysSinceLastPost: number, userName: string) => {
  if (daysSinceLastPost <= 1) {
    return null // Don't nag if they posted recently
  }

  if (daysSinceLastPost <= 3) {
    return `Hey ${userName}! Your tribe would love to hear from you. Got any moments to share? 📸`
  }

  if (daysSinceLastPost <= 7) {
    return `${userName}, it's been a few days! Your connections miss seeing what you're up to. Share something? 💭`
  }

  return `Hey ${userName}! Your tribe is wondering where you've been. Even a quick update helps you stay connected! 🌟`
}

// Streak celebration
export const streakCelebration = (streakDays: number) => {
  if (streakDays === 3) {
    return `🔥 3 days in a row! You're building momentum. Keep it up!`
  }
  if (streakDays === 7) {
    return `🔥🔥 ONE WEEK STREAK! You're crushing it! Your tribe is growing stronger.`
  }
  if (streakDays === 14) {
    return `🔥🔥🔥 Two weeks straight! You're becoming a community pillar. Amazing!`
  }
  if (streakDays === 30) {
    return `👑 ONE MONTH STREAK! You're officially a tribe-building legend!`
  }
  if (streakDays % 7 === 0) {
    return `🔥 ${streakDays} day streak! You're on fire! Keep building those connections.`
  }
  return null
}

// Friendship cooling alert
export const friendshipCooling = (friendName: string, daysSinceMeetup: number) => {
  if (daysSinceMeetup < 14) return null

  if (daysSinceMeetup < 21) {
    return `Hey! You and ${friendName} haven't hung out in ${daysSinceMeetup} days. Time for a quick catch-up? ☕`
  }

  if (daysSinceMeetup < 30) {
    return `Your connection with ${friendName} is cooling down... It's been ${daysSinceMeetup} days! Plan something together?`
  }

  return `It's been over a month since you met ${friendName}! Don't let this friendship fade - reach out! 💫`
}

// Weekly happiness update
export const happinessUpdate = (
  userName: string,
  score: number,
  hangoutsThisWeek: number,
  connectionsThisWeek: number
) => {
  let message = `📊 Weekly Tribe Report for ${userName}:\n\n`

  message += `Happiness Score: ${score}/100 `
  if (score >= 80) message += '🌟 Amazing!\n'
  else if (score >= 60) message += '😊 Great!\n'
  else if (score >= 40) message += '👍 Good progress!\n'
  else message += '💪 Room to grow!\n'

  message += `Hangouts: ${hangoutsThisWeek} this week\n`
  message += `New connections: ${connectionsThisWeek}\n\n`

  if (score < 50) {
    message += `💡 Tip: Try joining one more hangout this week to boost your happiness!`
  } else if (score >= 80) {
    message += `🎉 You're crushing it! Keep building those connections!`
  }

  return message
}

// Welcome message for new users
export const welcomeMessage = (userName: string) => {
  return `Hey ${userName}! 👋 Welcome to Hapien!\n\nI'm here to help you build your tribe - real friendships through shared activities.\n\nStart by:\n1. 🏠 Joining a community (your apartment, office, etc.)\n2. 🎯 Finding or creating a hangout\n3. 🤝 Meeting awesome people!\n\nNeed help? Just ask me anything!`
}

// Achievement unlocked
export const achievementUnlocked = (
  achievementName: string,
  achievementEmoji: string,
  tier: string
) => {
  return `🏆 Achievement Unlocked!\n\n${achievementEmoji} ${achievementName} (${tier})\n\nYou're building an amazing tribe! Keep it up!`
}

// Quick suggestion responses (for chat)
export const quickSuggestions = {
  whoToMeet: (suggestions: { name: string; reason: string }[]) => {
    if (suggestions.length === 0) {
      return "I don't have specific suggestions right now, but check out the hangouts in your community - there might be someone new to meet!"
    }

    let message = "Based on your activity, I'd suggest meeting:\n\n"
    suggestions.forEach((s, i) => {
      message += `${i + 1}. ${s.name} - ${s.reason}\n`
    })
    message += "\nWant me to help you plan something?"
    return message
  },

  whatToDo: (activities: string[]) => {
    if (activities.length === 0) {
      return "There aren't many hangouts happening right now. Why not create one? Your tribe is waiting!"
    }

    return `Here's what's happening in your community:\n\n${activities.join('\n')}\n\nAnything catch your eye?`
  },

  howAmIDoing: (score: number, streakDays: number, meetupsThisWeek: number) => {
    let message = "Here's how you're doing:\n\n"
    message += `Happiness Score: ${score}/100\n`
    message += `Current Streak: ${streakDays} days 🔥\n`
    message += `Meetups this week: ${meetupsThisWeek}\n\n`

    if (score >= 70) {
      message += "You're doing great! Keep building those connections! 🌟"
    } else if (score >= 40) {
      message += "Good progress! A few more meetups could really boost your happiness. 💪"
    } else {
      message += "Let's get you more connected! Try joining a hangout today - small steps lead to great friendships! ✨"
    }

    return message
  }
}

// Default responses for common questions
export const defaultResponses: Record<string, string> = {
  help: "I can help you with:\n\n• Finding people to meet\n• Suggesting activities\n• Checking your progress\n• Understanding your tribe\n\nJust ask me anything!",

  thanks: "You're welcome! 😊 That's what I'm here for. Keep building your tribe!",

  hello: "Hey there! 👋 How can I help you build your tribe today?",

  bye: "Catch you later! 👋 Keep making those connections!",
}
