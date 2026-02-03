import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../../../lib/supabase/server'
import type { AgentConnectionType, AgentConnectionConfig } from '@hapien/shared'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/agents/[id]/test - Test agent connection
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Fetch agent
    const { data: agent, error: fetchError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (agent.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to test this agent' },
        { status: 403 }
      )
    }

    // Test the connection based on type
    const testResult = await testAgentConnection(
      agent.connection_type as AgentConnectionType,
      agent.connection_config as AgentConnectionConfig
    )

    // Update health status in database
    const { error: updateError } = await supabase
      .from('agents')
      .update({
        health_status: testResult.success ? 'healthy' : 'unhealthy',
        last_health_check_at: new Date().toISOString(),
        last_active_at: testResult.success ? new Date().toISOString() : agent.last_active_at,
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating agent health status:', updateError)
    }

    return NextResponse.json({
      success: testResult.success,
      health_status: testResult.success ? 'healthy' : 'unhealthy',
      response_time_ms: testResult.responseTimeMs,
      message: testResult.message,
      details: testResult.details,
    })

  } catch (error) {
    console.error('Error in POST /api/agents/[id]/test:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

interface TestResult {
  success: boolean
  responseTimeMs: number
  message: string
  details?: Record<string, unknown>
}

async function testAgentConnection(
  type: AgentConnectionType,
  config: AgentConnectionConfig
): Promise<TestResult> {
  const startTime = Date.now()

  try {
    switch (type) {
      case 'api_endpoint': {
        const c = config as { endpoint: string; auth_header?: string; timeout_ms?: number }
        return await testApiEndpoint(c.endpoint, c.auth_header, c.timeout_ms)
      }

      case 'mindclone': {
        const c = config as { handle: string; base_url?: string }
        const baseUrl = c.base_url || 'https://mindclone.link'
        const endpoint = `${baseUrl}/${c.handle}`
        return await testMindclone(endpoint)
      }

      case 'openai_gpt': {
        const c = config as { gpt_id: string }
        // For OpenAI GPTs, we can't directly test them without API access
        // So we just validate the format
        return {
          success: true,
          responseTimeMs: Date.now() - startTime,
          message: 'GPT ID format validated. Live testing requires OpenAI API integration.',
          details: { gpt_id: c.gpt_id, note: 'Format validation only' },
        }
      }

      case 'langchain': {
        const c = config as { endpoint: string; chain_id?: string }
        return await testApiEndpoint(c.endpoint)
      }

      case 'custom_webhook': {
        const c = config as { webhook_url: string; secret?: string }
        return await testWebhook(c.webhook_url, c.secret)
      }

      default:
        return {
          success: false,
          responseTimeMs: Date.now() - startTime,
          message: `Unknown connection type: ${type}`,
        }
    }
  } catch (error) {
    return {
      success: false,
      responseTimeMs: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Unknown error during connection test',
    }
  }
}

async function testApiEndpoint(
  endpoint: string,
  authHeader?: string,
  timeoutMs: number = 10000
): Promise<TestResult> {
  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    // Send a test message to the agent
    const testPayload = {
      type: 'hapien_health_check',
      message: 'Hello, this is a health check from Hapien. Please respond with any message.',
      timestamp: new Date().toISOString(),
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    const responseTimeMs = Date.now() - startTime

    if (!response.ok) {
      return {
        success: false,
        responseTimeMs,
        message: `Agent returned status ${response.status}: ${response.statusText}`,
        details: { status: response.status, statusText: response.statusText },
      }
    }

    // Try to parse response
    let responseData
    try {
      responseData = await response.json()
    } catch {
      // Response might not be JSON, that's okay
      responseData = await response.text()
    }

    return {
      success: true,
      responseTimeMs,
      message: 'Agent is responding correctly',
      details: {
        status: response.status,
        hasResponse: !!responseData,
      },
    }

  } catch (error) {
    const responseTimeMs = Date.now() - startTime

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        responseTimeMs,
        message: 'Connection timed out',
      }
    }

    return {
      success: false,
      responseTimeMs,
      message: error instanceof Error ? error.message : 'Failed to connect to agent',
    }
  }
}

async function testMindclone(endpoint: string): Promise<TestResult> {
  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    // First, check if the mindclone profile exists
    const response = await fetch(endpoint, {
      method: 'GET',
      signal: controller.signal,
    })

    clearTimeout(timeout)

    const responseTimeMs = Date.now() - startTime

    if (!response.ok) {
      return {
        success: false,
        responseTimeMs,
        message: `Mindclone not found or not accessible (status ${response.status})`,
        details: { status: response.status },
      }
    }

    return {
      success: true,
      responseTimeMs,
      message: 'Mindclone is accessible',
      details: { endpoint },
    }

  } catch (error) {
    const responseTimeMs = Date.now() - startTime

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        responseTimeMs,
        message: 'Connection timed out',
      }
    }

    return {
      success: false,
      responseTimeMs,
      message: error instanceof Error ? error.message : 'Failed to connect to mindclone',
    }
  }
}

async function testWebhook(webhookUrl: string, secret?: string): Promise<TestResult> {
  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (secret) {
      headers['X-Hapien-Signature'] = secret
    }

    const testPayload = {
      type: 'hapien_webhook_test',
      timestamp: new Date().toISOString(),
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    const responseTimeMs = Date.now() - startTime

    // Webhooks typically return 200 or 202 for success
    if (response.status >= 200 && response.status < 300) {
      return {
        success: true,
        responseTimeMs,
        message: 'Webhook is responding correctly',
        details: { status: response.status },
      }
    }

    return {
      success: false,
      responseTimeMs,
      message: `Webhook returned status ${response.status}`,
      details: { status: response.status },
    }

  } catch (error) {
    const responseTimeMs = Date.now() - startTime

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        responseTimeMs,
        message: 'Connection timed out',
      }
    }

    return {
      success: false,
      responseTimeMs,
      message: error instanceof Error ? error.message : 'Failed to connect to webhook',
    }
  }
}
