import { MemorySaver } from '@langchain/langgraph';

// In-memory checkpointer for development
// For production with multiple serverless instances, consider:
// - Redis-based checkpointer
// - Custom Supabase checkpointer
// - Or rely on conversation history from database (current approach)

export const checkpointer = new MemorySaver();

// Note: The current implementation uses conversation history from Supabase
// (planner_messages table) rather than LangGraph checkpointing.
// This is simpler for SMS-based interactions where each message
// is a discrete event.
//
// If you need more sophisticated state persistence (e.g., tracking
// which phase of the coaching workflow the user is in), you can:
//
// 1. Create a planner_agent_state table:
//    CREATE TABLE planner_agent_state (
//      user_id UUID PRIMARY KEY REFERENCES planner_users(id),
//      state JSONB NOT NULL,
//      updated_at TIMESTAMPTZ DEFAULT NOW()
//    );
//
// 2. Implement a custom checkpointer that reads/writes to this table
//
// For now, the agent treats each conversation as stateless with
// history provided from the messages table.
