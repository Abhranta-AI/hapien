import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { HAPIEN_SYSTEM_PROMPT, getContextualPrompt } from '@/lib/hapien-ai/system-prompt'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, context, conversationHistory } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      // Return a fallback response if no API key
      return NextResponse.json({
        response: "I'm still learning! For now, I can help you with finding people to meet, checking what's happening, and tracking your progress. Try asking about one of these! 💡",
        fallback: true
      })
    }

    // Build contextual message
    const contextualMessage = getContextualPrompt(message, context)

    // Build messages array with history
    const messages: Anthropic.MessageParam[] = []

    // Add conversation history if provided (last 10 messages for context)
    if (conversationHistory && Array.isArray(conversationHistory)) {
      const recentHistory = conversationHistory.slice(-10)
      for (const msg of recentHistory) {
        messages.push({
          role: msg.direction === 'from_user' ? 'user' : 'assistant',
          content: msg.content
        })
      }
    }

    // Add current message
    messages.push({
      role: 'user',
      content: contextualMessage
    })

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307', // Using Haiku for speed and cost
      max_tokens: 300,
      system: HAPIEN_SYSTEM_PROMPT,
      messages
    })

    // Extract text response
    const textContent = response.content.find(block => block.type === 'text')
    const responseText = textContent?.type === 'text' ? textContent.text : "I'm having trouble responding right now. Try again in a moment!"

    return NextResponse.json({
      response: responseText,
      fallback: false
    })

  } catch (error) {
    console.error('AI Chat Error:', error)

    // Return friendly fallback on error
    return NextResponse.json({
      response: "Oops! I'm having a moment. Try asking again, or check out what's happening in your community! 🌟",
      fallback: true,
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    })
  }
}
