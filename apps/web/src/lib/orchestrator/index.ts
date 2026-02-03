/**
 * Hapien Orchestrator
 *
 * Core engine for agent-to-agent conversations and matching.
 */

// Types
export * from './types'

// Adapters
export {
  getAdapter,
  sendMessageToAgent,
  checkAgentHealth,
  ApiEndpointAdapter,
  MindcloneAdapter,
  LangchainAdapter,
  CustomWebhookAdapter,
} from './adapters'

// Orchestrator
export {
  ConversationOrchestrator,
  createOrchestrator,
} from './orchestrator'

// Match Engine
export {
  MatchEngine,
  createMatchEngine,
  type MatchEngineConfig,
} from './match-engine'
